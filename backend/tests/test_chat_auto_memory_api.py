from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_chat_send_creates_explicit_memory() -> None:
    response = client.post(
        "/v1/chat/send",
        json={
            "content": "lembre que meu formato preferido é resposta objetiva em tópicos curtos",
            "mode": "strategist",
            "model_preference": "mock",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["memory_events"]
    assert data["memory_events"][0]["status"] == "ativa"

    memories_response = client.get("/v1/memories?q=tópicos")
    assert memories_response.status_code == 200

    memories = memories_response.json()
    assert any("resposta objetiva" in item["content"] for item in memories)


def test_chat_send_ignores_non_relevant_memory() -> None:
    response = client.post(
        "/v1/chat/send",
        json={
            "content": "qual é a diferença entre json e yaml?",
            "mode": "dev",
            "model_preference": "mock",
        },
    )

    assert response.status_code == 201
    assert response.json()["memory_events"] == []
