from types import SimpleNamespace

import pytest
from fastapi import HTTPException, status

from app.core.permissions import (
    AUDIT_READ,
    CHAT_SEND,
    MEMBERS_UPDATE_ROLE,
    PROJECTS_CREATE,
    PROJECTS_DELETE,
    ROLE_ADMIN,
    ROLE_MEMBER,
    ROLE_OWNER,
    ROLE_VIEWER,
)
from app.dependencies.permissions import (
    ensure_workspace_permission,
    get_current_permissions,
    require_known_permission,
    require_permission,
)


def context_with_role(role: str):
    return SimpleNamespace(role=role)


def test_require_known_permission_normalizes_permission():
    assert require_known_permission(" CHAT.SEND ") == CHAT_SEND


def test_require_known_permission_rejects_unknown_permission():
    with pytest.raises(ValueError, match="Unknown permission"):
        require_known_permission("workspace.destroy")


def test_owner_passes_any_known_permission():
    context = context_with_role(ROLE_OWNER)

    assert ensure_workspace_permission(context, MEMBERS_UPDATE_ROLE) is context
    assert ensure_workspace_permission(context, PROJECTS_DELETE) is context
    assert ensure_workspace_permission(context, AUDIT_READ) is context


def test_member_passes_operational_permission():
    context = context_with_role(ROLE_MEMBER)

    assert ensure_workspace_permission(context, CHAT_SEND) is context
    assert ensure_workspace_permission(context, PROJECTS_CREATE) is context


def test_member_is_denied_admin_permission():
    context = context_with_role(ROLE_MEMBER)

    with pytest.raises(HTTPException) as exc_info:
        ensure_workspace_permission(context, AUDIT_READ)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert exc_info.value.detail["code"] == "permission_denied"
    assert exc_info.value.detail["permission"] == AUDIT_READ


def test_viewer_is_denied_write_permission():
    context = context_with_role(ROLE_VIEWER)

    with pytest.raises(HTTPException) as exc_info:
        ensure_workspace_permission(context, CHAT_SEND)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert exc_info.value.detail["permission"] == CHAT_SEND


def test_require_permission_returns_dependency_callable_that_allows_role():
    dependency = require_permission(CHAT_SEND)
    context = context_with_role(ROLE_MEMBER)

    assert dependency(context) is context


def test_require_permission_returns_dependency_callable_that_denies_role():
    dependency = require_permission(MEMBERS_UPDATE_ROLE)
    context = context_with_role(ROLE_ADMIN)

    with pytest.raises(HTTPException) as exc_info:
        dependency(context)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert exc_info.value.detail["permission"] == MEMBERS_UPDATE_ROLE


def test_require_permission_rejects_unknown_permission_at_definition_time():
    with pytest.raises(ValueError, match="Unknown permission"):
        require_permission("fake.permission")


def test_get_current_permissions_returns_role_permissions():
    permissions = get_current_permissions(context_with_role(ROLE_VIEWER))

    assert permissions == sorted(permissions)
    assert CHAT_SEND not in permissions
    assert AUDIT_READ not in permissions
