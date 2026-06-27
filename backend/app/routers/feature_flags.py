from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import FEATURE_FLAGS_READ, FEATURE_FLAGS_UPDATE
from app.db.session import get_db
from app.dependencies.permissions import require_permission
from app.dependencies.workspace import CurrentWorkspaceContext
from app.models import FeatureFlag
from app.schemas.feature_flags import FeatureFlagRead, FeatureFlagUpdate
from app.services.audit import write_audit_log
from app.services.feature_flags import ensure_default_flags, get_feature_flag

router = APIRouter(prefix="/feature-flags", tags=["feature-flags"])


def get_flag_or_404(db: Session, workspace_id: str, key: str) -> FeatureFlag:
    flag = get_feature_flag(db, workspace_id, key)

    if flag is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature flag not found",
        )

    return flag


@router.get("", response_model=list[FeatureFlagRead])
def list_feature_flags(
    db: Session = Depends(get_db),
    context: CurrentWorkspaceContext = Depends(require_permission(FEATURE_FLAGS_READ)),
) -> list[FeatureFlag]:
    ensure_default_flags(db, context.workspace_id)

    return list(
        db.scalars(
            select(FeatureFlag)
            .where(FeatureFlag.workspace_id == context.workspace_id)
            .order_by(FeatureFlag.key.asc())
        )
    )


@router.patch("/{key}", response_model=FeatureFlagRead)
def update_feature_flag(
    key: str,
    payload: FeatureFlagUpdate,
    db: Session = Depends(get_db),
    context: CurrentWorkspaceContext = Depends(require_permission(FEATURE_FLAGS_UPDATE)),
) -> FeatureFlag:
    flag = get_flag_or_404(db, context.workspace_id, key)
    changes = payload.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(flag, field, value)

    write_audit_log(
        db=db,
        workspace_id=context.workspace_id,
        action="feature_flag.update",
        resource_type="feature_flag",
        resource_id=flag.key,
        meta={
            "changes": list(changes.keys()),
            "enabled": flag.enabled,
            "audience": flag.audience,
            "auth_user_id": context.user_id,
            "membership_role": context.role,
        },
    )

    db.add(flag)
    db.commit()
    db.refresh(flag)

    return flag


@router.post("/{key}/toggle", response_model=FeatureFlagRead)
def toggle_feature_flag(
    key: str,
    db: Session = Depends(get_db),
    context: CurrentWorkspaceContext = Depends(require_permission(FEATURE_FLAGS_UPDATE)),
) -> FeatureFlag:
    flag = get_flag_or_404(db, context.workspace_id, key)
    flag.enabled = not flag.enabled

    write_audit_log(
        db=db,
        workspace_id=context.workspace_id,
        action="feature_flag.toggle",
        resource_type="feature_flag",
        resource_id=flag.key,
        meta={
            "enabled": flag.enabled,
            "audience": flag.audience,
            "auth_user_id": context.user_id,
            "membership_role": context.role,
        },
    )

    db.add(flag)
    db.commit()
    db.refresh(flag)

    return flag
