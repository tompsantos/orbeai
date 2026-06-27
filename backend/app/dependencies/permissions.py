from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends, HTTPException, status

from app.core.permissions import (
    PermissionDeniedError,
    assert_role_permission,
    is_known_permission,
    list_role_permissions,
    normalize_permission,
)
from app.dependencies.workspace import CurrentWorkspaceContext, get_current_workspace_context


def unknown_permission_error(permission: str | None) -> ValueError:
    normalized_permission = normalize_permission(permission)

    return ValueError(f"Unknown permission: {normalized_permission or 'empty'}")


def permission_denied_error(permission: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "code": "permission_denied",
            "message": "Missing required workspace permission",
            "permission": permission,
        },
    )


def require_known_permission(permission: str | None) -> str:
    normalized_permission = normalize_permission(permission)

    if not is_known_permission(normalized_permission):
        raise unknown_permission_error(permission)

    return normalized_permission


def ensure_workspace_permission(
    context: CurrentWorkspaceContext,
    permission: str | None,
) -> CurrentWorkspaceContext:
    normalized_permission = require_known_permission(permission)

    try:
        assert_role_permission(context.role, normalized_permission)
    except PermissionDeniedError as exc:
        raise permission_denied_error(normalized_permission) from exc

    return context


def require_permission(
    permission: str,
) -> Callable[[CurrentWorkspaceContext], CurrentWorkspaceContext]:
    normalized_permission = require_known_permission(permission)

    def dependency(
        context: CurrentWorkspaceContext = Depends(get_current_workspace_context),
    ) -> CurrentWorkspaceContext:
        return ensure_workspace_permission(context, normalized_permission)

    return dependency


def get_current_permissions(
    context: CurrentWorkspaceContext = Depends(get_current_workspace_context),
) -> list[str]:
    return list_role_permissions(context.role)
