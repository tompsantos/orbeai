from pydantic import BaseModel, Field

from app.schemas.messages import MessageRead


class ChatSendRequest(BaseModel):
    content: str = Field(min_length=1)
    chat_id: str | None = None
    project_id: str | None = None
    title: str | None = Field(default=None, max_length=220)
    mode: str = Field(default="strategist", min_length=2, max_length=60)
    model_preference: str = Field(default="auto", min_length=2, max_length=80)


class ChatSendResponse(BaseModel):
    chat_id: str
    provider: str
    model: str
    model_run_id: str
    user_message: MessageRead
    assistant_message: MessageRead
