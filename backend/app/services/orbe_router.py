import re
from dataclasses import dataclass

from app.core.config import Settings, get_settings

PROVIDER_NAMES = {
    "mock": "orbe-mock",
    "openai": "OpenAI",
    "anthropic": "Anthropic",
    "gemini": "Google Gemini",
    "qwen": "Qwen",
    "groq": "Groq",
    "local": "Local",
}

PROVIDER_MODELS = {
    "mock": "orbe-mock-v0",
    "openai": "gpt-5.5-thinking",
    "anthropic": "claude-sonnet-4.5",
    "gemini": "gemini-2.5-flash",
    "qwen": "qwen-plus",
    "groq": "llama-3.3-70b",
    "local": "qwen-local",
}

PROVIDER_LATENCY = {
    "mock": 250,
    "openai": 1400,
    "anthropic": 1600,
    "gemini": 1300,
    "qwen": 1100,
    "groq": 380,
    "local": 900,
}

PROVIDER_COST = {
    "mock": 0.0,
    "openai": 0.005,
    "anthropic": 0.006,
    "gemini": 0.004,
    "qwen": 0.002,
    "groq": 0.0005,
    "local": 0.0,
}

PROVIDER_QUALITY = {
    "mock": "padrão",
    "openai": "premium",
    "anthropic": "flagship",
    "gemini": "premium",
    "qwen": "padrão",
    "groq": "essencial",
    "local": "essencial",
}

MODE_TO_PROVIDER = {
    "padrão": "mock",
    "strategist": "anthropic",
    "dev": "anthropic",
    "research": "gemini",
    "document": "openai",
    "creative": "openai",
    "ops": "groq",
    "mentor": "anthropic",
    "safe": "openai",
}

MODEL_TO_PROVIDER = {
    "gpt": "openai",
    "openai": "openai",
    "claude": "anthropic",
    "anthropic": "anthropic",
    "gemini": "gemini",
    "qwen": "qwen",
    "groq": "groq",
    "local": "local",
    "mock": "mock",
}

HINT_PATTERNS = [
    ("código", re.compile(r"\b(c[óo]digo|bug|debug|typescript|python|api|refactor)\b", re.I)),
    ("documento", re.compile(r"\b(pdf|documento|contrato|edital|relat[óo]rio|anexo)\b", re.I)),
    ("pesquisa", re.compile(r"\b(pesquis\w+|fontes|investig\w+|mercado|benchmark)\b", re.I)),
    ("estratégia", re.compile(r"\b(estrat[ée]gia|roadmap|posicionamento|go-to-market)\b", re.I)),
    ("risco", re.compile(r"\b(risco|compliance|lgpd|auditoria|regulat[óo]rio)\b", re.I)),
    ("ops", re.compile(r"\b(workflow|automa\w+|processo|opera\w+|runbook)\b", re.I)),
    ("governo", re.compile(r"\b(licita\w+|edital|termo de refer[êe]ncia|setor p[úu]blico)\b", re.I)),
    ("vendas", re.compile(r"\b(vendas|lead|pipeline|proposta|comercial|prospec\w+)\b", re.I)),
]


@dataclass(frozen=True)
class RouterDecision:
    provider_slug: str
    provider_name: str
    model_name: str
    primary_provider_slug: str
    primary_model_name: str
    reason: str
    fallback_chain: list[str]
    routing_mode: str
    estimated_latency_ms: int
    estimated_cost_usd: float
    quality_tier: str
    task_hints: list[str]
    primary_configured: bool
    selected_configured: bool
    is_fallback: bool


def provider_is_configured(slug: str, settings: Settings) -> bool:
    if slug == "mock":
        return True

    if slug == "openai":
        return bool(settings.openai_api_key)

    if slug == "anthropic":
        return bool(settings.anthropic_api_key)

    if slug == "gemini":
        return bool(settings.gemini_api_key)

    if slug == "qwen":
        return bool(settings.qwen_api_key)

    if slug == "groq":
        return bool(settings.groq_api_key)

    return False


def detect_task_hints(content: str) -> list[str]:
    return [hint for hint, pattern in HINT_PATTERNS if pattern.search(content)]


def build_fallback_chain(primary_provider: str) -> list[str]:
    order = ["anthropic", "openai", "gemini", "qwen", "groq", "local", "mock"]
    return [provider for provider in order if provider != primary_provider]


def choose_primary_provider(
    content: str,
    mode: str | None,
    model_preference: str | None,
    routing_mode: str | None,
) -> tuple[str, str, list[str]]:
    hints = detect_task_hints(content)
    model_key = (model_preference or "auto").strip().lower()
    route_mode = (routing_mode or "automático").strip().lower()

    if model_key and model_key != "auto":
        provider = MODEL_TO_PROVIDER.get(model_key, "mock")
        return provider, f"Modelo selecionado manualmente: {model_key}.", hints

    if route_mode in {"menor custo", "custo"}:
        return "groq", "Política de menor custo.", hints

    if route_mode in {"mais rápido", "rapidez", "latência"}:
        return "groq", "Política de menor latência.", hints

    if route_mode in {"raciocínio profundo", "melhor qualidade", "qualidade"}:
        return "anthropic", "Política de raciocínio profundo.", hints

    if "código" in hints:
        return "anthropic", "Prompt com sinal de código.", hints

    if "pesquisa" in hints:
        return "gemini", "Prompt com sinal de pesquisa.", hints

    if "documento" in hints or "governo" in hints:
        return "openai", "Prompt com sinal de documento/governo.", hints

    if "ops" in hints or "vendas" in hints:
        return "groq", "Prompt com sinal de operação/comercial.", hints

    provider = MODE_TO_PROVIDER.get(mode or "padrão", "mock")
    return provider, f"Modo orbe {mode or 'padrão'} usado como critério.", hints


def resolve_chat_route(
    content: str,
    mode: str | None,
    model_preference: str | None,
    routing_mode: str | None = "automático",
) -> RouterDecision:
    settings = get_settings()
    primary_provider, primary_reason, hints = choose_primary_provider(
        content=content,
        mode=mode,
        model_preference=model_preference,
        routing_mode=routing_mode,
    )

    primary_configured = provider_is_configured(primary_provider, settings)

    # Nesta fase, providers reais ainda não executam chamadas externas.
    # O orbeRouter escolhe o provider ideal, mas usa orbe-mock como executor seguro.
    selected_provider = "mock"
    selected_configured = True
    is_fallback = selected_provider != primary_provider

    if is_fallback:
        reason = (
            f"orbeRouter escolheu {primary_provider} porque {primary_reason} "
            "Como o executor real ainda não está conectado, usou orbe-mock como fallback seguro."
        )
    else:
        reason = f"orbeRouter escolheu orbe-mock porque {primary_reason}"

    return RouterDecision(
        provider_slug=selected_provider,
        provider_name=PROVIDER_NAMES[selected_provider],
        model_name=PROVIDER_MODELS[selected_provider],
        primary_provider_slug=primary_provider,
        primary_model_name=PROVIDER_MODELS[primary_provider],
        reason=reason,
        fallback_chain=[primary_provider, *build_fallback_chain(primary_provider)],
        routing_mode=routing_mode or "automático",
        estimated_latency_ms=PROVIDER_LATENCY[selected_provider],
        estimated_cost_usd=PROVIDER_COST[selected_provider],
        quality_tier=PROVIDER_QUALITY[selected_provider],
        task_hints=hints,
        primary_configured=primary_configured,
        selected_configured=selected_configured,
        is_fallback=is_fallback,
    )
