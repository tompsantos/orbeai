from fastapi import APIRouter

router = APIRouter(prefix="/v1")


@router.get("/status", tags=["v1"])
def v1_status() -> dict[str, str | bool]:
    return {
        "ok": True,
        "status": "v1 router ready",
    }
