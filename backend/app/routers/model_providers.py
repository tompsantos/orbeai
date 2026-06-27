from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.model_providers import ModelProviderRead

router = APIRouter(prefix="/model-providers", tags=["model-providers"])


@router.get("", response_model=list[ModelProviderRead])
def list_model_providers() -> list[ModelProviderRead]:
    settings = get_settings()

    providers = [
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
            status="placeholder",
            models=["gpt-5.5-thinking", "gpt-5.5", "gpt-5.1"],
            api_key_status="ambiente" if settings.openai_api_key else "não configurado",
            latency_ms=None,
            cost_per_k_tokens=None,
        ),
        ModelProviderRead(
            slug="anthropic",
            name="Anthropic",
            status="placeholder",
            models=["claude-sonnet-4.5", "claude-haiku-3.5"],
            api_key_status="ambiente" if settings.anthropic_api_key else "não configurado",
            latency_ms=None,
            cost_per_k_tokens=None,
        ),
        ModelProviderRead(
            slug="gemini",
            name="Google Gemini",
            status="placeholder",
            models=["gemini-2.5-flash", "gemini-3-pro"],
            api_key_status="ambiente" if settings.gemini_api_key else "não configurado",
            latency_ms=None,
            cost_per_k_tokens=None,
        ),
        ModelProviderRead(
            slug="qwen",
            name="Qwen",
            status="placeholder",
            models=["qwen-plus", "qwen-max", "qwen3"],
            api_key_status="ambiente" if settings.qwen_api_key else "não configurado",
            latency_ms=None,
            cost_per_k_tokens=None,
        ),
        ModelProviderRead(
            slug="groq",
            name="Groq",
            status="placeholder",
            models=["llama-3.3-70b", "mixtral"],
            api_key_status="ambiente" if settings.groq_api_key else "não configurado",
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

    return providers
