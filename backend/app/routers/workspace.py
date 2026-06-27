from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import (
    MEMBERS_READ,
    WORKSPACE_READ,
    WORKSPACE_SETTINGS_UPDATE,
    WORKSPACE_UPDATE,
    list_role_permissions,
)
from app.db.session import get_db
from app.dependencies.permissions import require_permission
from app.dependencies.workspace import CurrentWorkspaceContext
from app.models import User, Workspace, WorkspaceMember
from app.schemas.workspace import (
    WorkspaceRead,
    WorkspaceSettingsRead,
    WorkspaceSettingsUpdate,
    WorkspaceUpdate,
)
from app.schemas.workspace_members import WorkspaceMemberAccessRead, WorkspaceMemberRead
from app.services.audit import write_audit_log
from app.services.workspace_settings import get_or_create_workspace_settings

router = APIRouter(prefix="/workspace", tags=["workspace"])


def to_workspace_read(workspace: Workspace, settings: object) -> WorkspaceRead:
    return WorkspaceRead(
        id=workspace.id,
        name=workspace.name,
        slug=workspace.slug,
        plan=workspace.plan,
        created_at=workspace.created_at,
        updated_at=workspace.updated_at,
        settings=WorkspaceSettingsRead.model_validate(settings),
    )


def to_member_read(member: WorkspaceMember, user: User) -> WorkspaceMemberRead:
    return WorkspaceMemberRead(
        id=member.id,
        workspace_id=member.workspace_id,
        user_id=member.user_id,
        user_email=user.email,
        user_name=user.name,
        user_status=user.status,
        role=member.role,
        status=member.status,
        created_at=member.created_at,
        updated_at=member.updated_at,
    )


def get_workspace_member_or_404(
    member_id: str,
    workspace_id: str,
    db: Session,
) -> tuple[WorkspaceMember, User]:
    row = db.execute(
        select(WorkspaceMember, User)
        .join(User, User.id == WorkspaceMember.user_id)
        .where(WorkspaceMember.id == member_id)
        .where(WorkspaceMember.workspace_id == workspace_id)
    ).one_or_none()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace member not found",
        )

    member, user = row

    return member, user


@router.get("", response_model=WorkspaceRead)
def get_workspace(
    db: Session = Depends(get_db),
    context: CurrentWorkspaceContext = Depends(require_permission(WORKSPACE_READ)),
) -> WorkspaceRead:
    workspace = context.workspace
    settings = get_or_create_workspace_settings(db, workspace)

    return to_workspace_read(workspace, settings)


@router.patch("", response_model=WorkspaceRead)
def update_workspace(
    payload: WorkspaceUpdate,
    db: Session = Depends(get_db),
    context: CurrentWorkspaceContext = Depends(require_permission(WORKSPACE_UPDATE)),
) -> WorkspaceRead:
    workspace = context.workspace
    settings = get_or_create_workspace_settings(db, workspace)
    changes = payload.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(workspace, field, value)

    write_audit_log(
        db=db,
        workspace_id=workspace.id,
        action="workspace.update",
        resource_type="workspace",
        resource_id=workspace.id,
        meta={
            "changes": list(changes.keys()),
            "auth_user_id": context.user_id,
            "membership_role": context.role,
            "name": workspace.name,
            "plan": workspace.plan,
        },
    )

    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    return to_workspace_read(workspace, settings)


@router.patch("/settings", response_model=WorkspaceSettingsRead)
def update_workspace_settings(
    payload: WorkspaceSettingsUpdate,
    db: Session = Depends(get_db),
    context: CurrentWorkspaceContext = Depends(require_permission(WORKSPACE_SETTINGS_UPDATE)),
) -> WorkspaceSettingsRead:
    workspace = context.workspace
    settings = get_or_create_workspace_settings(db, workspace)
    changes = payload.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(settings, field, value)

    write_audit_log(
        db=db,
        workspace_id=workspace.id,
        action="workspace.settings.update",
        resource_type="workspace_settings",
        resource_id=settings.id,
        meta={
            "changes": list(changes.keys()),
            "auth_user_id": context.user_id,
            "membership_role": context.role,
            "locale": settings.locale,
            "timezone": settings.timezone,
            "default_chat_mode": settings.default_chat_mode,
            "default_model_preference": settings.default_model_preference,
            "memory_policy": settings.memory_policy,
        },
    )

    db.add(settings)
    db.commit()
    db.refresh(settings)

    return WorkspaceSettingsRead.model_validate(settings)


@router.get("/members/me/access", response_model=WorkspaceMemberAccessRead)
def get_my_workspace_access(
    context: CurrentWorkspaceContext = Depends(require_permission(WORKSPACE_READ)),
) -> WorkspaceMemberAccessRead:
    return WorkspaceMemberAccessRead(
        workspace_id=context.workspace_id,
        member_id=context.membership.id,
        user_id=context.user_id,
        role=context.role,
        status=context.membership.status,
        permissions=list_role_permissions(context.role),
    )


@router.get("/members", response_model=list[WorkspaceMemberRead])
def list_workspace_members(
    db: Session = Depends(get_db),
    context: CurrentWorkspaceContext = Depends(require_permission(MEMBERS_READ)),
) -> list[WorkspaceMemberRead]:
    rows = db.execute(
        select(WorkspaceMember, User)
        .join(User, User.id == WorkspaceMember.user_id)
        .where(WorkspaceMember.workspace_id == context.workspace_id)
        .order_by(WorkspaceMember.created_at.asc())
    ).all()

    return [to_member_read(member, user) for member, user in rows]


@router.get("/members/{member_id}", response_model=WorkspaceMemberRead)
def get_workspace_member(
    member_id: str,
    db: Session = Depends(get_db),
    context: CurrentWorkspaceContext = Depends(require_permission(MEMBERS_READ)),
) -> WorkspaceMemberRead:
    member, user = get_workspace_member_or_404(member_id, context.workspace_id, db)

    return to_member_read(member, user)
