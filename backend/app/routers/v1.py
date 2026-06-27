from fastapi import APIRouter

from app.routers import chat_send, chats, messages, projects

router = APIRouter(prefix="/v1")

router.include_router(projects.router)
router.include_router(chats.router)
router.include_router(messages.router)
router.include_router(chat_send.router)


@router.get("/status")
def v1_status() -> dict[str, bool | str]:
    return {"ok": True, "status": "v1 router ready"}
