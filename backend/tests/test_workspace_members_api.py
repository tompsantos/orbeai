from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.dependencies.workspace import CurrentWorkspaceContext, get_current_workspace_context
from app.main import app
from app.models import AuthSession, User, Workspace, WorkspaceMember
from app.models.core import utc_now
from app.services.bootstrap import get_or_create_default_workspace

client = TestClient(app)


def unique(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


def create_user_and_member(
    *,
    workspace_id: str,
    role: str = "owner",
    member_status: str = "active",
) -> tuple[User, WorkspaceMember]:
    now = utc_now()
    suffix = uuid4().hex[:12]

    user = User(
        id=unique("usr"),
        email=f"{suffix}@orbeone.test",
        name=f"User {suffix}",
        password_hash="pytest-only",
        status="active",
        is_superuser=False,
        created_at=now,
        updated_at=now,
    )

    member = WorkspaceMember(
        id=unique("wm"),
        workspace_id=workspace_id,
        user_id=user.id,
        role=role,
        status=member_status,
        created_at=now,
        updated_at=now,
    )

    return user, member


def context_for(user: User, member: WorkspaceMember, workspace: Workspace) -> CurrentWorkspaceContext:
    now = utc_now()

    session = AuthSession(
        id=unique("sess"),
        user_id=user.id,
        token_hash=unique("hash"),
        status="active",
        user_agent="pytest",
        ip_address="127.0.0.1",
        expires_at=now,
        revoked_at=None,
        created_at=now,
        updated_at=now,
    )

    auth = SimpleNamespace(user=user, session=session)

    return CurrentWorkspaceContext(
        auth=auth,
        workspace=workspace,
        membership=member,
    )


def seed_workspace_member(role: str = "owner") -> tuple[Workspace, User, WorkspaceMember]:
    db = SessionLocal()

    try:
        workspace = get_or_create_default_workspace(db)
        user, member = create_user_and_member(workspace_id=workspace.id, role=role)

        db.add(user)
        db.add(member)
        db.commit()
        db.refresh(user)
        db.refresh(member)
        db.refresh(workspace)

        return workspace, user, member
    finally:
        db.close()


def override_context(role: str = "owner") -> tuple[Workspace, User, WorkspaceMember]:
    workspace, user, member = seed_workspace_member(role=role)

    app.dependency_overrides[get_current_workspace_context] = lambda: context_for(
        user=user,
        member=member,
        workspace=workspace,
    )

    return workspace, user, member


def test_current_member_access_returns_role_and_permissions():
    _, user, member = override_context(role="viewer")

    response = client.get("/v1/workspace/members/me/access")

    assert response.status_code == 200

    data = response.json()

    assert data["user_id"] == user.id
    assert data["member_id"] == member.id
    assert data["role"] == "viewer"
    assert "workspace.read" in data["permissions"]
    assert "chat.send" not in data["permissions"]


def test_member_without_members_read_cannot_list_members():
    override_context(role="member")

    response = client.get("/v1/workspace/members")

    assert response.status_code == 403
    assert response.json()["detail"]["permission"] == "members.read"


def test_owner_can_list_workspace_members():
    workspace, user, member = override_context(role="owner")

    db = SessionLocal()

    try:
        extra_user, extra_member = create_user_and_member(
            workspace_id=workspace.id,
            role="member",
        )

        db.add(extra_user)
        db.add(extra_member)
        db.commit()

        extra_member_id = extra_member.id
        extra_user_email = extra_user.email
    finally:
        db.close()

    response = client.get("/v1/workspace/members")

    assert response.status_code == 200

    members = response.json()
    member_ids = {item["id"] for item in members}
    emails = {item["user_email"] for item in members}

    assert member.id in member_ids
    assert user.email in emails
    assert extra_member_id in member_ids
    assert extra_user_email in emails


def test_owner_can_get_workspace_member_detail():
    _, _, member = override_context(role="owner")

    response = client.get(f"/v1/workspace/members/{member.id}")

    assert response.status_code == 200
    assert response.json()["id"] == member.id
    assert response.json()["role"] == "owner"


def test_workspace_member_detail_is_scoped_to_current_workspace():
    workspace, _, _ = override_context(role="owner")

    db = SessionLocal()

    try:
        other_workspace = Workspace(
            id=unique("wrk"),
            name="Other Workspace",
            slug=unique("other"),
            plan="dev",
        )
        db.add(other_workspace)
        db.commit()
        db.refresh(other_workspace)

        other_user, other_member = create_user_and_member(
            workspace_id=other_workspace.id,
            role="owner",
        )

        db.add(other_user)
        db.add(other_member)
        db.commit()
        other_member_id = other_member.id

        assert other_workspace.id != workspace.id
    finally:
        db.close()

    response = client.get(f"/v1/workspace/members/{other_member_id}")

    assert response.status_code == 404
