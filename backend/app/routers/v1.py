from fastapi import APIRouter

from app.routers import chats, messages, projects

router = APIRouter(prefix="/v1")

router.include_router(projects.router)
router.include_router(chats.router)
router.include_router(messages.router)


@router.get("/status")
def v1_status() -> dict[str, bool | str]:
    return {"ok": True, "status": "v1 router ready"}
