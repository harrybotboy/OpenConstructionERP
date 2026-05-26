## 1. Database Migration

- [x] 1.1 Add `azure_openai_api_key String(500) nullable` column to `AISettings` model in `backend/app/modules/ai/models.py`
- [x] 1.2 Create Alembic migration `backend/alembic/versions/v4100_azure_openai.py` that calls `_add_column_safe("oe_ai_settings", sa.Column("azure_openai_api_key", sa.String(500), nullable=True))`

## 2. Backend Schemas

- [x] 2.1 Add `azure_openai_api_key: str | None = None` to `AISettingsUpdate` in `backend/app/modules/ai/schemas.py`
- [x] 2.2 Add `azure_openai_endpoint: str | None = None` and `azure_openai_deployment: str | None = None` to `AISettingsUpdate`
- [x] 2.3 Add `azure_openai_api_key_set: bool = False` to `AISettingsResponse`
- [x] 2.4 Add `azure_openai_endpoint: str | None = None` and `azure_openai_deployment: str | None = None` to `AISettingsResponse`

## 3. Backend Service

- [x] 3.1 Add `"azure_openai_api_key"` to `_API_KEY_FIELDS` list in `update_ai_settings()` in `backend/app/modules/ai/service.py`
- [x] 3.2 Add `azure_openai_api_key_set=_usable(getattr(settings, "azure_openai_api_key", None))` to `_build_settings_response()`
- [x] 3.3 In `update_ai_settings()`, read `data.azure_openai_endpoint` and `data.azure_openai_deployment`; store them in `metadata_["azure_endpoint"]` and `metadata_["azure_deployment"]` alongside existing metadata mutations
- [x] 3.4 In `_build_settings_response()`, read `metadata_.get("azure_endpoint")` and `metadata_.get("azure_deployment")` and set them on the response object

## 4. Backend AI Client

- [x] 4.1 Add `call_azure_openai()` async function in `backend/app/modules/ai/ai_client.py` — builds URL as `{endpoint}/openai/deployments/{deployment}/chat/completions?api-version=2024-12-01-preview`, uses `api-key: {key}` header, delegates response parsing to `_extract_openai_message_text()`
- [ ] 4.2 Add `"azure_openai": ""` entry to `DEFAULT_MODELS` dict (deployment name is user-supplied, no built-in default)
- [x] 4.3 (N/A — used null-byte bundling instead of extra_config; no signature change needed)
- [x] 4.4 Add Azure OpenAI branch in `call_ai()` dispatcher
- [x] 4.5 Add `"azure_openai"` to the `_MODEL_PROVIDER_MAP` and `_FALLBACK_ORDER` in `resolve_provider_and_key()` (key attr: `azure_openai_api_key`)
- [x] 4.6 (N/A — null-byte bundling keeps 3-tuple; `_bundle_azure_credentials()` helper added)
- [x] 4.7 (N/A — no callers needed updating due to null-byte bundling approach)

## 5. Backend Router

- [x] 5.1 Add `"azure_openai"` to `_VALID_PROVIDERS` tuple in the test endpoint handler in `backend/app/modules/ai/router.py`
- [x] 5.2 Add Azure OpenAI entry to `_AI_PROVIDERS` list
- [x] 5.3 In the test endpoint handler, add a special-case branch for `provider == "azure_openai"` that reads `endpoint` and `deployment` from `settings.metadata_` and bundles them into the api_key string

## 6. Frontend Types

- [x] 6.1 Add `'azure_openai'` to the `AIProvider` union type in `frontend/src/features/ai/api.ts`
- [x] 6.2 Add `azure_openai_api_key_set: boolean` to the `AISettings` interface
- [x] 6.3 Add `azure_openai_endpoint?: string | null` and `azure_openai_deployment?: string | null` to `AISettings`
- [x] 6.4 Add `azure_openai_api_key?: string | null`, `azure_openai_endpoint?: string | null`, and `azure_openai_deployment?: string | null` to `AISettingsUpdate`

## 7. Frontend Settings UI

- [x] 7.1 Add Azure OpenAI entry to `AI_PROVIDERS` array in `frontend/src/features/settings/SettingsPage.tsx` with `id: 'azure_openai'`, name "Azure OpenAI (Microsoft)", description, `keyPrefix: ''`, and `docsUrl` pointing to Azure portal
- [x] 7.2 Add `azureEndpoint` and `azureDeployment` state variables (both `string`) to `AIConfigurationCard`
- [x] 7.3 Add `useEffect` to sync `azureEndpoint` and `azureDeployment` from `settings.azure_openai_endpoint` / `settings.azure_openai_deployment` when `selectedProvider === 'azure_openai'`
- [x] 7.4 Render the Endpoint URL and Deployment Name input fields conditionally (only when `selectedProvider === 'azure_openai'`) below the API key input
- [x] 7.5 Include `azure_openai_endpoint` and `azure_openai_deployment` in the `saveMutation` payload when `selectedProvider === 'azure_openai'`
- [x] 7.6 Include `azure_openai_endpoint` and `azure_openai_deployment` in the `testMutation` auto-save payload when `selectedProvider === 'azure_openai'`
- [x] 7.7 `isKeySetForProvider` already handles this generically — `azure_openai_api_key_set` added to `AISettings` interface covers it

## 8. Build & Deploy

- [x] 8.1 Rebuild Docker image (`docker-compose -f docker-compose.quickstart.yml build`)
- [x] 8.2 Restart containers (`docker-compose -f docker-compose.quickstart.yml up --force-recreate -d`) — migration runs automatically on startup
- [ ] 8.3 Verify Azure OpenAI card appears in Settings → AI tab
- [ ] 8.4 Save test credentials and confirm "Key configured" badge appears
- [ ] 8.5 Run "Test Connection" and confirm success/failure toasts work correctly
