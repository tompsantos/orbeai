from time import perf_counter

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Chat, Message, ModelRun, Project
from app.models.core import utc_now
from app.schemas.chat_send import ChatSendRequest, ChatSendResponse
from app.services.bootstrap import get_or_create_default_workspace
from app.services.providers.mock import (
    MOCK_MODEL_NAME,
    MOCK_PROVIDER_NAME,
    generate_mock_response,
)

router = APIRouter(prefix="/chat", tags=["chat"])


def get_project_or_404(project_id: str, db: Session) -> Project:
    project = db.get(Project, project_id)

    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


def get_chat_or_404(chat_id: str, db: Session) -> Chat:
    chat = db.get(Chat, chat_id)

    if chat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )

    return chat


def resolve_or_create_chat(payload: ChatSendRequest, db: Session) -> Chat:
    if payload.chat_id is not None:
        return get_chat_or_404(payload.chat_id, db)

    workspace = get_or_create_default_workspace(db)
    project_id = payload.project_id

    if project_id is not None:
        project = get_project_or_404(project_id, db)
        workspace_id = project.workspace_id
    else:
        workspace_id = workspace.id

    chat = Chat(
        workspace_id=workspace_id,
        project_id=project_id,
        title=payload.title or "Nova conversa",
        mode=payload.mode,
        model_preference=payload.model_preference,
    )

    db.add(chat)
    db.commit()
    db.refresh(chat)

    return chat


@router.post("/send", response_model=ChatSendResponse, status_code=status.HTTP_201_CREATED)
def send_chat_message(
    payload: ChatSendRequest,
    db: Session = Depends(get_db),
) -> ChatSendResponse:
    started_at = perf_counter()

    chat = resolve_or_create_chat(payload, db)

    user_message = Message(
        chat_id=chat.id,
        role="user",
        content=payload.content,
        provider=None,
        model=None,
        input_tokens=None,
        output_tokens=None,
        meta={
            "source": "chat-send",
            "mode": payload.mode,
            "model_preference": payload.model_preference,
        },
    )

    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    result = generate_mock_response(
        user_content=payload.content,
        mode=chat.mode,
        model_preference=chat.model_preference,
    )

    assistant_message = Message(
        chat_id=chat.id,
        role="assistant",
        content=result.content,
        provider=MOCK_PROVIDER_NAME,
        model=MOCK_MODEL_NAME,
        input_tokens=result.input_tokens,
        output_tokens=result.output_tokens,
        meta={
            "source": "chat-send",
            "provider_type": "mock",
        },
    )

    chat.updated_at = utc_now()

    db.add(assistant_message)
    db.add(chat)
    db.commit()
    db.refresh(assistant_message)

    latency_ms = int((perf_counter() - started_at) * 1000)

    model_run = ModelRun(
        workspace_id=chat.workspace_id,
        chat_id=chat.id,
        message_id=assistant_message.id,
        provider_name=MOCK_PROVIDER_NAME,
        model_name=MOCK_MODEL_NAME,
        task_type="chat.send",
        status="success",
        latency_ms=latency_ms,
        input_tokens=result.input_tokens,
        output_tokens=result.output_tokens,
        estimated_cost_usd=0.0,
        router_reason=result.router_reason,
        fallback_chain=[MOCK_PROVIDER_NAME],
        error_message=None,
    )

    db.add(model_run)
    db.commit()
    db.refresh(model_run)

    return ChatSendResponse(
        chat_id=chat.id,
        provider=MOCK_PROVIDER_NAME,
        model=MOCK_MODEL_NAME,
        model_run_id=model_run.id,
        user_message=user_message,
        assistant_message=assistant_message,
    )
