from collections.abc import Generator

import pytest
from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import FeatureFlag
from app.services.bootstrap import get_or_create_default_workspace
from app.services.feature_flags import ensure_default_flags
from app.services.workspace_settings import get_or_create_workspace_settings


DEFAULT_FLAG_STATE = {
    "real_providers": True,
    "auto_memory": True,
    "memory_context": True,
    "audit_logs": True,
    "artifact_versions": True,
}

DEFAULT_WORKSPACE_SETTINGS = {
    "locale": "pt-BR",
    "timezone": "America/Sao_Paulo",
    "default_chat_mode": "strategist",
    "default_model_preference": "auto",
    "memory_policy": "balanced",
    "data_retention_days": 365,
    "allow_exports": True,
    "allow_public_sharing": False,
    "meta": {
        "seeded": True,
        "product": "orbeAI",
        "test_reset": True,
    },
}


def reset_runtime_state() -> None:
    db = SessionLocal()

    try:
        workspace = get_or_create_default_workspace(db)
        settings = get_or_create_workspace_settings(db, workspace)

        for field, value in DEFAULT_WORKSPACE_SETTINGS.items():
            setattr(settings, field, value)

        ensure_default_flags(db, workspace.id)

        flags = db.scalars(
            select(FeatureFlag).where(FeatureFlag.workspace_id == workspace.id)
        ).all()

        for flag in flags:
            if flag.key in DEFAULT_FLAG_STATE:
                flag.enabled = DEFAULT_FLAG_STATE[flag.key]

        db.add(settings)
        db.commit()
    finally:
        db.close()


@pytest.fixture(autouse=True)
def clean_runtime_controls() -> Generator[None, None, None]:
    reset_runtime_state()

    yield

    reset_runtime_state()
