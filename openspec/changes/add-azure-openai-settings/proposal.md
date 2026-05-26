## Why

Azure OpenAI is the enterprise-preferred way to access GPT-4 models with data residency, VNet integration, and compliance guarantees. Construction firms using Azure already have approved Azure OpenAI deployments but cannot currently connect them to OpenEstimate — they are forced to use a consumer OpenAI key or a different provider.

## What Changes

- Add **Azure OpenAI** as a selectable AI provider in Settings → AI tab
- New provider card appears in the provider grid alongside existing cards
- When Azure OpenAI is selected, three extra fields appear: API Key, Endpoint URL, and Deployment Name
- Backend stores the API key encrypted (like all other providers) and stores endpoint + deployment in `metadata_`
- All AI features (Quick Estimate, PDF Takeoff Analyze, BOQ Smart Import, AI Advisor) route through Azure OpenAI when it is the active provider
- "Test Connection" verifies the Azure endpoint is reachable with the given key and deployment

## Capabilities

### New Capabilities

- `azure-openai-provider`: Full Azure OpenAI provider support — UI configuration (key, endpoint, deployment), backend client call, encryption-at-rest for key, routing through all AI features, and connection testing.

### Modified Capabilities

<!-- No existing spec-level behavior changes — all changes are additive. -->

## Impact

- **Frontend**: `frontend/src/features/ai/api.ts` (type union), `frontend/src/features/settings/SettingsPage.tsx` (provider card + extra fields)
- **Backend model**: `backend/app/modules/ai/models.py` — new `azure_openai_api_key` column
- **Backend migration**: new Alembic migration file to add the column
- **Backend schemas**: `backend/app/modules/ai/schemas.py` — new fields in update + response schemas
- **Backend service**: `backend/app/modules/ai/service.py` — key field list + response builder + metadata handling for endpoint/deployment
- **Backend AI client**: `backend/app/modules/ai/ai_client.py` — `call_azure_openai()`, dispatcher update, provider resolution
- **Backend router**: `backend/app/modules/ai/router.py` — valid providers list + providers list endpoint
- No new dependencies (Azure OpenAI uses the same OpenAI chat-completions wire format, already handled by `httpx`)
