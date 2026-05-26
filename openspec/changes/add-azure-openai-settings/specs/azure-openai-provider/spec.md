## ADDED Requirements

### Requirement: Azure OpenAI provider card in Settings UI
The Settings AI tab SHALL display an "Azure OpenAI" provider card in the provider selection grid alongside existing providers. The card SHALL show the name "Azure OpenAI (Microsoft)" and a brief description. When the card is selected, a "Key configured" badge SHALL appear if credentials are saved.

#### Scenario: Azure OpenAI card is visible
- **WHEN** user navigates to `/settings?tab=ai`
- **THEN** an "Azure OpenAI (Microsoft)" card appears in the provider grid

#### Scenario: Key configured badge shows when credentials saved
- **WHEN** user has previously saved Azure OpenAI credentials
- **THEN** the Azure OpenAI card shows a "Key configured" badge

### Requirement: Extra configuration fields for Azure OpenAI
When Azure OpenAI is selected as the active provider, the Settings UI SHALL display three input fields: API Key, Endpoint URL, and Deployment Name. These fields SHALL NOT appear when any other provider is selected.

#### Scenario: Extra fields appear on Azure selection
- **WHEN** user selects the Azure OpenAI provider card
- **THEN** an "Endpoint URL" input and a "Deployment Name" input appear below the API Key field

#### Scenario: Extra fields hidden for other providers
- **WHEN** user selects any provider other than Azure OpenAI
- **THEN** no Endpoint URL or Deployment Name inputs are shown

#### Scenario: Endpoint pre-populated from saved settings
- **WHEN** user has a saved Azure endpoint and opens Settings
- **THEN** the Endpoint URL field shows the saved value

### Requirement: Save Azure OpenAI credentials
The system SHALL save the Azure OpenAI API key (encrypted at rest), endpoint URL, and deployment name when the user clicks Save Settings. All three values SHALL be persisted. Saving SHALL NOT affect other providers' stored keys.

#### Scenario: All three values saved together
- **WHEN** user enters API key, endpoint URL, and deployment name and clicks Save
- **THEN** all three are persisted; subsequent page load pre-fills endpoint and deployment

#### Scenario: Partial save — key only
- **WHEN** user enters only an API key (no endpoint/deployment) and saves
- **THEN** the key is saved; endpoint and deployment remain at their previous values

### Requirement: Test Connection for Azure OpenAI
The "Test Connection" button SHALL make a minimal chat completions call to the configured Azure endpoint using the stored key and deployment. A success toast SHALL show the deployment name and latency. A failure toast SHALL show the provider's error message.

#### Scenario: Successful test
- **WHEN** user has valid Azure credentials saved and clicks "Test Connection"
- **THEN** a success toast appears with deployment name and response latency

#### Scenario: Invalid endpoint URL
- **WHEN** user has saved an unreachable or malformed endpoint and tests
- **THEN** a failure toast appears with a descriptive error message

#### Scenario: Invalid API key
- **WHEN** user has saved an invalid API key and tests
- **THEN** a failure toast with "401" or "invalid key" indication appears

### Requirement: AI features route through Azure OpenAI
When Azure OpenAI is the configured (preferred) provider, ALL AI features — Quick Estimate, PDF Takeoff Analyze with AI, BOQ Smart Import, and AI Advisor — SHALL use the Azure OpenAI endpoint. The routing SHALL use the stored endpoint and deployment name.

#### Scenario: Quick Estimate uses Azure
- **WHEN** Azure OpenAI is the active provider and user runs Quick Estimate
- **THEN** the estimate request is sent to the Azure endpoint, not api.openai.com

#### Scenario: Fallback when Azure not configured
- **WHEN** Azure OpenAI is selected but endpoint or deployment is missing
- **THEN** an error is raised explaining which fields are missing

### Requirement: Azure OpenAI API key encrypted at rest
The Azure OpenAI API key SHALL be stored Fernet-encrypted in the `azure_openai_api_key` database column, using the same `encrypt_secret` / `decrypt_secret` pattern as all other provider keys.

#### Scenario: Key is not stored in plaintext
- **WHEN** Azure OpenAI API key is saved via PATCH /v1/ai/settings/
- **THEN** the value stored in `oe_ai_settings.azure_openai_api_key` is a Fernet ciphertext, not the raw key

#### Scenario: Rotated encryption key surfaces as re-entry prompt
- **WHEN** the backend JWT_SECRET has rotated since the Azure key was saved
- **THEN** the settings response shows `azure_openai_api_key_set: false` and the user is prompted to re-enter
