from __future__ import annotations

from dataclasses import dataclass
from typing import Final


ROLE_OWNER: Final = "owner"
ROLE_ADMIN: Final = "admin"
ROLE_MEMBER: Final = "member"
ROLE_VIEWER: Final = "viewer"

VALID_ROLES: Final[frozenset[str]] = frozenset(
    {
        ROLE_OWNER,
        ROLE_ADMIN,
        ROLE_MEMBER,
        ROLE_VIEWER,
    }
)


WORKSPACE_READ: Final = "workspace.read"
WORKSPACE_UPDATE: Final = "workspace.update"
WORKSPACE_SETTINGS_READ: Final = "workspace.settings.read"
WORKSPACE_SETTINGS_UPDATE: Final = "workspace.settings.update"

MEMBERS_READ: Final = "members.read"
MEMBERS_INVITE: Final = "members.invite"
MEMBERS_UPDATE_ROLE: Final = "members.update_role"
MEMBERS_DEACTIVATE: Final = "members.deactivate"

PROJECTS_READ: Final = "projects.read"
PROJECTS_CREATE: Final = "projects.create"
PROJECTS_UPDATE: Final = "projects.update"
PROJECTS_DELETE: Final = "projects.delete"

CHATS_READ: Final = "chats.read"
CHATS_CREATE: Final = "chats.create"
CHATS_UPDATE: Final = "chats.update"
CHATS_DELETE: Final = "chats.delete"
CHAT_SEND: Final = "chat.send"

ARTIFACTS_READ: Final = "artifacts.read"
ARTIFACTS_CREATE: Final = "artifacts.create"
ARTIFACTS_UPDATE: Final = "artifacts.update"
ARTIFACTS_DELETE: Final = "artifacts.delete"

MEMORIES_READ: Final = "memories.read"
MEMORIES_CREATE: Final = "memories.create"
MEMORIES_UPDATE: Final = "memories.update"
MEMORIES_DELETE: Final = "memories.delete"

AUDIT_READ: Final = "audit.read"

FEATURE_FLAGS_READ: Final = "feature_flags.read"
FEATURE_FLAGS_UPDATE: Final = "feature_flags.update"

MODEL_RUNS_READ: Final = "model_runs.read"
MODEL_PROVIDERS_READ: Final = "model_providers.read"


ALL_PERMISSIONS: Final[frozenset[str]] = frozenset(
    {
        WORKSPACE_READ,
        WORKSPACE_UPDATE,
        WORKSPACE_SETTINGS_READ,
        WORKSPACE_SETTINGS_UPDATE,
        MEMBERS_READ,
        MEMBERS_INVITE,
        MEMBERS_UPDATE_ROLE,
        MEMBERS_DEACTIVATE,
        PROJECTS_READ,
        PROJECTS_CREATE,
        PROJECTS_UPDATE,
        PROJECTS_DELETE,
        CHATS_READ,
        CHATS_CREATE,
        CHATS_UPDATE,
        CHATS_DELETE,
        CHAT_SEND,
        ARTIFACTS_READ,
        ARTIFACTS_CREATE,
        ARTIFACTS_UPDATE,
        ARTIFACTS_DELETE,
        MEMORIES_READ,
        MEMORIES_CREATE,
        MEMORIES_UPDATE,
        MEMORIES_DELETE,
        AUDIT_READ,
        FEATURE_FLAGS_READ,
        FEATURE_FLAGS_UPDATE,
        MODEL_RUNS_READ,
        MODEL_PROVIDERS_READ,
    }
)


OWNER_PERMISSIONS: Final[frozenset[str]] = ALL_PERMISSIONS

ADMIN_PERMISSIONS: Final[frozenset[str]] = frozenset(
    permission
    for permission in ALL_PERMISSIONS
    if permission
    not in {
        MEMBERS_UPDATE_ROLE,
    }
)

MEMBER_PERMISSIONS: Final[frozenset[str]] = frozenset(
    {
        WORKSPACE_READ,
        WORKSPACE_SETTINGS_READ,
        PROJECTS_READ,
        PROJECTS_CREATE,
        PROJECTS_UPDATE,
        CHATS_READ,
        CHATS_CREATE,
        CHATS_UPDATE,
        CHAT_SEND,
        ARTIFACTS_READ,
        ARTIFACTS_CREATE,
        ARTIFACTS_UPDATE,
        MEMORIES_READ,
        MEMORIES_CREATE,
        MEMORIES_UPDATE,
        MODEL_RUNS_READ,
        MODEL_PROVIDERS_READ,
    }
)

VIEWER_PERMISSIONS: Final[frozenset[str]] = frozenset(
    {
        WORKSPACE_READ,
        WORKSPACE_SETTINGS_READ,
        PROJECTS_READ,
        CHATS_READ,
        ARTIFACTS_READ,
        MEMORIES_READ,
        MODEL_RUNS_READ,
        MODEL_PROVIDERS_READ,
    }
)


ROLE_PERMISSIONS: Final[dict[str, frozenset[str]]] = {
    ROLE_OWNER: OWNER_PERMISSIONS,
    ROLE_ADMIN: ADMIN_PERMISSIONS,
    ROLE_MEMBER: MEMBER_PERMISSIONS,
    ROLE_VIEWER: VIEWER_PERMISSIONS,
}


@dataclass(frozen=True)
class PermissionDeniedError(Exception):
    role: str | None
    permission: str

    def __str__(self) -> str:
        return f"role {self.role or 'unknown'} does not have permission {self.permission}"


def normalize_role(role: str | None) -> str:
    return (role or "").strip().lower()


def normalize_permission(permission: str | None) -> str:
    return (permission or "").strip().lower()


def is_valid_role(role: str | None) -> bool:
    return normalize_role(role) in VALID_ROLES


def is_known_permission(permission: str | None) -> bool:
    return normalize_permission(permission) in ALL_PERMISSIONS


def get_role_permissions(role: str | None) -> frozenset[str]:
    return ROLE_PERMISSIONS.get(normalize_role(role), frozenset())


def role_has_permission(role: str | None, permission: str | None) -> bool:
    normalized_permission = normalize_permission(permission)

    if normalized_permission not in ALL_PERMISSIONS:
        return False

    return normalized_permission in get_role_permissions(role)


def assert_role_permission(role: str | None, permission: str | None) -> None:
    normalized_permission = normalize_permission(permission)

    if not role_has_permission(role, normalized_permission):
        raise PermissionDeniedError(role=normalize_role(role), permission=normalized_permission)


def list_role_permissions(role: str | None) -> list[str]:
    return sorted(get_role_permissions(role))
