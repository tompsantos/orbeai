from fastapi import APIRouter

from app.routers import artifacts, chat_send, chats, messages, model_providers, model_runs, orbe_router, projects

router = APIRouter(prefix="/v1")

router.include_router(projects.router)
router.include_router(artifacts.router)
router.include_router(chats.router)
router.include_router(messages.router)
router.include_router(chat_send.router)
router.include_router(model_runs.router)
router.include_router(model_providers.router)
router.include_router(orbe_router.router)


@router.get("/status")
def v1_status() -> dict[str, bool | str]:
    return {"ok": True, "status": "v1 router ready"}
