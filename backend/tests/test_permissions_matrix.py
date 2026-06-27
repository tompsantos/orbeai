import pytest

from app.core.permissions import (
    ALL_PERMISSIONS,
    ARTIFACTS_CREATE,
    AUDIT_READ,
    CHAT_SEND,
    CHATS_READ,
    CHATS_CREATE,
    FEATURE_FLAGS_UPDATE,
    MEMBERS_READ,
    MEMBERS_UPDATE_ROLE,
    PermissionDeniedError,
    PROJECTS_CREATE,
    PROJECTS_DELETE,
    PROJECTS_READ,
    ROLE_ADMIN,
    ROLE_MEMBER,
    ROLE_OWNER,
    ROLE_VIEWER,
    VALID_ROLES,
    WORKSPACE_READ,
    WORKSPACE_SETTINGS_READ,
    assert_role_permission,
    get_role_permissions,
    is_known_permission,
    is_valid_role,
    list_role_permissions,
    role_has_permission,
)


def test_roles_are_explicit():
    assert VALID_ROLES == {"owner", "admin", "member", "viewer"}

    assert is_valid_role("owner")
    assert is_valid_role(" admin ")
    assert is_valid_role("MEMBER")
    assert is_valid_role("viewer")
    assert not is_valid_role("stranger")
    assert not is_valid_role(None)


def test_known_permissions_are_explicit():
    assert WORKSPACE_READ in ALL_PERMISSIONS
    assert PROJECTS_READ in ALL_PERMISSIONS
    assert CHAT_SEND in ALL_PERMISSIONS
    assert MEMBERS_UPDATE_ROLE in ALL_PERMISSIONS

    assert is_known_permission("workspace.read")
    assert is_known_permission(" PROJECTS.READ ")
    assert not is_known_permission("workspace.destroy")
    assert not is_known_permission(None)


def test_owner_has_all_permissions():
    assert get_role_permissions(ROLE_OWNER) == ALL_PERMISSIONS

    for permission in ALL_PERMISSIONS:
        assert role_has_permission(ROLE_OWNER, permission)


def test_admin_has_operational_permissions_but_not_role_update():
    assert role_has_permission(ROLE_ADMIN, WORKSPACE_READ)
    assert role_has_permission(ROLE_ADMIN, PROJECTS_DELETE)
    assert role_has_permission(ROLE_ADMIN, AUDIT_READ)
    assert role_has_permission(ROLE_ADMIN, FEATURE_FLAGS_UPDATE)
    assert role_has_permission(ROLE_ADMIN, MEMBERS_READ)

    assert not role_has_permission(ROLE_ADMIN, MEMBERS_UPDATE_ROLE)


def test_member_can_work_but_cannot_administer_workspace():
    assert role_has_permission(ROLE_MEMBER, WORKSPACE_READ)
    assert role_has_permission(ROLE_MEMBER, WORKSPACE_SETTINGS_READ)
    assert role_has_permission(ROLE_MEMBER, PROJECTS_CREATE)
    assert role_has_permission(ROLE_MEMBER, CHATS_CREATE)
    assert role_has_permission(ROLE_MEMBER, CHAT_SEND)
    assert role_has_permission(ROLE_MEMBER, ARTIFACTS_CREATE)

    assert not role_has_permission(ROLE_MEMBER, PROJECTS_DELETE)
    assert not role_has_permission(ROLE_MEMBER, AUDIT_READ)
    assert not role_has_permission(ROLE_MEMBER, MEMBERS_READ)
    assert not role_has_permission(ROLE_MEMBER, FEATURE_FLAGS_UPDATE)


def test_viewer_is_read_only():
    assert role_has_permission(ROLE_VIEWER, WORKSPACE_READ)
    assert role_has_permission(ROLE_VIEWER, WORKSPACE_SETTINGS_READ)
    assert role_has_permission(ROLE_VIEWER, PROJECTS_READ)
    assert role_has_permission(ROLE_VIEWER, CHATS_READ)

    assert not role_has_permission(ROLE_VIEWER, PROJECTS_CREATE)
    assert not role_has_permission(ROLE_VIEWER, CHAT_SEND)
    assert not role_has_permission(ROLE_VIEWER, ARTIFACTS_CREATE)
    assert not role_has_permission(ROLE_VIEWER, MEMBERS_READ)


def test_unknown_role_has_no_permissions():
    assert get_role_permissions("ghost") == frozenset()
    assert not role_has_permission("ghost", WORKSPACE_READ)


def test_unknown_permission_is_denied_even_for_owner():
    assert not role_has_permission(ROLE_OWNER, "workspace.destroy")


def test_assert_permission_passes_and_raises():
    assert_role_permission(ROLE_OWNER, MEMBERS_UPDATE_ROLE)
    assert_role_permission(ROLE_MEMBER, CHAT_SEND)

    with pytest.raises(PermissionDeniedError):
        assert_role_permission(ROLE_VIEWER, CHAT_SEND)


def test_list_role_permissions_is_sorted():
    permissions = list_role_permissions(ROLE_MEMBER)

    assert permissions == sorted(permissions)
    assert CHAT_SEND in permissions
