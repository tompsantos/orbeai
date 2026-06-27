from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.model_providers import ModelProviderRead

router = APIRouter(prefix="/model-providers", tags=["model-providers"])


def real_status(enabled: bool, has_key: bool) -> str:
    if enabled and has_key:
        return "online"

    return "placeholder"


def key_status(has_key: bool) -> str:
    if has_key:
        return "ambiente"

    return "não configurado"


@router.get("", response_model=list[ModelProviderRead])
def list_model_providers() -> list[ModelProviderRead]:
    settings = get_settings()

    openai_has_key = bool(settings.openai_api_key)
    gemini_has_key = bool(settings.gemini_api_key)

    return [
        ModelProviderRead(
            slug="mock",
            name="orbe-mock",
            status="online",
            models=["orbe-mock-v0"],
            api_key_status="configurado",
            latency_ms=250,
            cost_per_k_tokens=0.0,
        ),
        ModelProviderRead(
            slug="openai",
            name="OpenAI",
            status=real_status(settings.enable_real_providers, openai_has_key),
            models=[settings.openai_model],
            api_key_status=key_status(openai_has_key),
            latency_ms=None,
            cost_per_k_tokens=None,
        ),
        ModelProviderRead(
            slug="gemini",
            name="Google Gemini",
            status=real_status(settings.enable_real_providers, gemini_has_key),
            models=[settings.gemini_model],
            api_key_status=key_status(gemini_has_key),
            latency_ms=None,
            cost_per_k_tokens=None,
        ),
        ModelProviderRead(
            slug="anthropic",
            name="Anthropic",
            status="placeholder",
            models=["claude-sonnet-4.5", "claude-haiku-3.5"],
            api_key_status="não configurado",
            latency_ms=None,
            cost_per_k_tokens=None,
        ),
        ModelProviderRead(
            slug="qwen",
            name="Qwen",
            status="placeholder",
            models=["qwen-plus", "qwen-max", "qwen3"],
            api_key_status="não configurado",
            latency_ms=None,
            cost_per_k_tokens=None,
        ),
        ModelProviderRead(
            slug="groq",
            name="Groq",
            status="placeholder",
            models=["llama-3.3-70b", "mixtral"],
            api_key_status="não configurado",
            latency_ms=None,
            cost_per_k_tokens=None,
        ),
        ModelProviderRead(
            slug="local",
            name="Local",
            status="placeholder",
            models=["qwen-local", "llama-cpp"],
            api_key_status="não configurado",
            latency_ms=None,
            cost_per_k_tokens=0.0,
        ),
    ]
