from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.dependencies.workspace import get_current_workspace_context
from app.main import app

client = TestClient(app)


def deny_as(role: str) -> None:
    app.dependency_overrides[get_current_workspace_context] = lambda: SimpleNamespace(role=role)


def test_viewer_cannot_update_workspace():
    deny_as("viewer")

    response = client.patch("/v1/workspace", json={"name": "Denied"})

    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "permission_denied"
    assert response.json()["detail"]["permission"] == "workspace.update"


def test_member_cannot_read_audit_logs():
    deny_as("member")

    response = client.get("/v1/audit-logs")

    assert response.status_code == 403
    assert response.json()["detail"]["permission"] == "audit.read"


def test_member_cannot_update_feature_flags():
    deny_as("member")

    response = client.patch("/v1/feature-flags/real_providers", json={"enabled": False})

    assert response.status_code == 403
    assert response.json()["detail"]["permission"] == "feature_flags.update"


def test_viewer_cannot_send_chat_message():
    deny_as("viewer")

    response = client.post("/v1/chat/send", json={"content": "teste bloqueado"})

    assert response.status_code == 403
    assert response.json()["detail"]["permission"] == "chat.send"


def test_viewer_cannot_create_project():
    deny_as("viewer")

    response = client.post(
        "/v1/projects",
        json={
            "name": "Projeto bloqueado",
            "slug": "projeto-bloqueado",
            "product": "orbeAI",
            "description": "não deveria criar",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"]["permission"] == "projects.create"


def test_viewer_cannot_delete_artifact():
    deny_as("viewer")

    response = client.delete("/v1/artifacts/artifact_fake")

    assert response.status_code == 403
    assert response.json()["detail"]["permission"] == "artifacts.delete"


def test_viewer_cannot_update_memory():
    deny_as("viewer")

    response = client.patch("/v1/memories/mem_fake", json={"label": "bloqueado"})

    assert response.status_code == 403
    assert response.json()["detail"]["permission"] == "memories.update"
