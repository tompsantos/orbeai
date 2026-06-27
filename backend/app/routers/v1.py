from fastapi import APIRouter

from app.routers import projects

router = APIRouter(prefix="/v1")

router.include_router(projects.router)


@router.get("/status")
def v1_status() -> dict[str, bool | str]:
    return {"ok": True, "status": "v1 router ready"}
