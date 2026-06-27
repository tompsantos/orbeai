from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.permissions import AUDIT_READ
from app.db.session import get_db
from app.dependencies.permissions import require_permission
from app.dependencies.workspace import CurrentWorkspaceContext
from app.models import AuditLog
from app.schemas.audit import AuditLogCreate, AuditLogRead
from app.services.audit import write_audit_log

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("", response_model=list[AuditLogRead])
def list_audit_logs(
    action: str | None = Query(default=None),
    resource_type: str | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=300),
    db: Session = Depends(get_db),
    context: CurrentWorkspaceContext = Depends(require_permission(AUDIT_READ)),
) -> list[AuditLog]:
    statement = select(AuditLog).where(AuditLog.workspace_id == context.workspace_id)

    if action is not None:
        statement = statement.where(AuditLog.action == action)

    if resource_type is not None:
        statement = statement.where(AuditLog.resource_type == resource_type)

    if q:
        term = f"%{q.lower()}%"
        statement = statement.where(
            or_(
                AuditLog.action.ilike(term),
                AuditLog.resource_type.ilike(term),
                AuditLog.resource_id.ilike(term),
                AuditLog.product.ilike(term),
            )
        )

    result = db.scalars(statement.order_by(AuditLog.created_at.desc()).limit(limit))

    return list(result)


@router.post("", response_model=AuditLogRead, status_code=status.HTTP_201_CREATED)
def create_audit_log(
    payload: AuditLogCreate,
    db: Session = Depends(get_db),
    context: CurrentWorkspaceContext = Depends(require_permission(AUDIT_READ)),
) -> AuditLog:
    return write_audit_log(
        db=db,
        workspace_id=context.workspace_id,
        action=payload.action,
        resource_type=payload.resource_type,
        resource_id=payload.resource_id,
        product=payload.product,
        request_id=payload.request_id,
        ip_address=payload.ip_address,
        meta={
            **(payload.meta or {}),
            "auth_user_id": context.user_id,
            "membership_role": context.role,
        },
        commit=True,
    )
