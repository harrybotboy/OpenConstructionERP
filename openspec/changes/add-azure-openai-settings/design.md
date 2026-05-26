## Context

The AI settings page at `/settings?tab=ai` lets users pick a provider (Anthropic, OpenAI, Gemini, etc.) and save an API key. All providers currently use a single encrypted `_api_key` column per provider in `oe_ai_settings`. The `call_ai()` dispatcher in `ai_client.py` routes requests to provider-specific async functions.

Azure OpenAI differs from plain OpenAI in three ways:
1. **Auth header**: `api-key: <key>` instead of `Authorization: Bearer <key>`
2. **URL structure**: `{endpoint}/openai/deployments/{deployment}/chat/completions?api-version=2024-12-01-preview`
3. **No global URL**: each customer has their own endpoint (e.g. `https://myco.openai.azure.com/`)

The current architecture has no concept of per-provider extra config beyond the API key. The `metadata_` JSON column already exists and is used for `model_overrides`.

## Goals / Non-Goals

**Goals:**
- Azure OpenAI appears as a selectable provider card in the Settings UI
- Users can save API key (encrypted), endpoint URL, and deployment name
- All AI features route through Azure OpenAI when it is the active provider
- "Test Connection" verifies Azure endpoint + key + deployment
- No user-visible regression for existing providers

**Non-Goals:**
- Azure managed identity / Entra token auth (API key only for now)
- Per-feature Azure endpoint override (one Azure config per user)
- Azure-specific model listing from the Management API

## Decisions

### 1. API key in its own column; endpoint + deployment in `metadata_`

**Decision**: Add `azure_openai_api_key` as a proper `String(500)` column on `oe_ai_settings` (consistent with all other providers). Store `endpoint` and `deployment` as `metadata_["azure_endpoint"]` and `metadata_["azure_deployment"]`.

**Rationale**: The key must be Fernet-encrypted at rest — the existing `encrypt_secret` / `decrypt_secret` pattern only works with ORM columns. Endpoint and deployment are non-secret configuration strings; the existing `metadata_` JSON blob is the right place for them (same pattern as `model_overrides`). This avoids adding two more nullable text columns for config that has no reason to be encrypted.

**Alternatives considered**:
- *All three in metadata_*: key would not be encrypted — rejected.
- *Separate columns for endpoint + deployment*: adds two more columns + migration complexity for non-secret strings — rejected.

### 2. `call_azure_openai()` as a first-class caller, not a wrapper

**Decision**: Add `call_azure_openai()` as a standalone async function in `ai_client.py` similar to `call_openai()`. It builds the Azure URL from `endpoint` + `deployment`, uses the `api-key` header, and delegates response parsing to the shared `_extract_openai_message_text()`.

**Rationale**: Azure has a distinct auth scheme and URL pattern that doesn't fit the `_OPENAI_COMPAT_CONFIG` dict (which only handles static base URLs). A standalone function keeps the logic explicit and testable.

### 3. Pass `azure_endpoint` + `azure_deployment` through `call_ai()` via `extra_config`

**Decision**: Add an optional `extra_config: dict | None = None` parameter to `call_ai()`. The Azure branch reads `extra_config["endpoint"]` and `extra_config["deployment"]`. The `resolve_provider_key_model()` function is extended to a 4-tuple: `(provider, api_key, model_override, extra_config)`.

**Rationale**: All call sites of `call_ai()` are unaffected (they pass nothing for `extra_config`). The extended return from `resolve_provider_key_model` only needs updating at call sites that explicitly handle Azure, or can be ignored via `*_` unpacking in existing callers.

**Alternatives considered**:
- *Encode endpoint/deployment into the key field with separators*: brittle and not encrypted independently — rejected.
- *Global module-level Azure config*: not per-user — rejected.

### 4. Frontend extra fields rendered conditionally

**Decision**: When `azure_openai` is the selected provider, two additional text inputs (Endpoint URL, Deployment Name) appear below the API key field. Values are sourced from `settings.metadata_["azure_endpoint"]` / `["azure_deployment"]` on load and sent as `azure_openai_endpoint` / `azure_openai_deployment` in the update payload.

**Rationale**: No other provider needs extra fields, so the extra inputs are purely conditional — zero impact on the existing UI for other providers.

## Risks / Trade-offs

- **DB migration required**: Adding `azure_openai_api_key` column needs an Alembic migration. Docker quickstart runs `alembic upgrade head` on startup, so existing deployments auto-migrate. → Mitigation: migration uses `_add_column_safe` pattern (idempotent).
- **`resolve_provider_key_model` 4-tuple**: existing callers destructure as `provider, key, model = …` — this breaks. → Mitigation: change to `provider, key, model, *_ = …` at existing call sites, or keep backward compat by making the 4th element optional via a wrapper.
- **Test endpoint for Azure**: the existing `/settings/test/` route builds `key_attr = f"{provider}_api_key"` dynamically — this works for `azure_openai` → `azure_openai_api_key`. But it also needs to read endpoint/deployment from metadata for the test call. → Mitigation: add a special-case branch for `azure_openai` in the test handler.

## Migration Plan

1. Add Alembic migration `v4100_azure_openai.py` — adds `azure_openai_api_key` column with `_add_column_safe`.
2. Deploy backend — migration runs on startup, column added with `NULL` default.
3. Deploy frontend — new provider card visible; existing settings unchanged.
4. Rollback: remove the card from the frontend; the column remains but is unused (safe).
