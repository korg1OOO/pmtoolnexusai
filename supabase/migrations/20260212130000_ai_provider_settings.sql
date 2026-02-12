-- ai_provider_settings.sql: AI provider configuration storage
-- Create ai_provider_settings table for storing AI configuration per organization/user
CREATE TABLE IF NOT EXISTS ai_provider_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Active provider configuration
    active_provider VARCHAR(50) NOT NULL DEFAULT 'lovable' CHECK (active_provider IN ('lovable', 'openai', 'anthropic', 'google')),
    selected_model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
    
    -- Fallback configuration
    fallback_enabled BOOLEAN DEFAULT TRUE,
    fallback_provider VARCHAR(50) DEFAULT 'lovable' CHECK (fallback_provider IN ('lovable', 'openai', 'anthropic', 'google')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one settings record per user or organization
    UNIQUE(user_id),
    UNIQUE(organization_id),
    CHECK ((user_id IS NOT NULL AND organization_id IS NULL) OR (user_id IS NULL AND organization_id IS NOT NULL))
);

-- Create ai_provider_api_keys table for storing encrypted API keys
CREATE TABLE IF NOT EXISTS ai_provider_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    provider_id VARCHAR(50) NOT NULL CHECK (provider_id IN ('openai', 'anthropic', 'google')),
    encrypted_api_key TEXT NOT NULL,  -- Should be encrypted at application level
    is_configured BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One key per provider per user/org
    UNIQUE(user_id, provider_id),
    UNIQUE(organization_id, provider_id),
    CHECK ((user_id IS NOT NULL AND organization_id IS NULL) OR (user_id IS NULL AND organization_id IS NOT NULL))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_settings_user ON ai_provider_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_settings_org ON ai_provider_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_keys_user ON ai_provider_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_keys_org ON ai_provider_api_keys(organization_id);

-- Enable Row Level Security
ALTER TABLE ai_provider_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_provider_settings

-- Users can view their own settings
CREATE POLICY "Users can view own AI settings"
    ON ai_provider_settings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can create own AI settings"
    ON ai_provider_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own AI settings"
    ON ai_provider_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for ai_provider_api_keys

-- Users can view their own API keys
CREATE POLICY "Users can view own API keys"
    ON ai_provider_api_keys
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own API keys
CREATE POLICY "Users can create own API keys"
    ON ai_provider_api_keys
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update own API keys"
    ON ai_provider_api_keys
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete own API keys"
    ON ai_provider_api_keys
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER handle_updated_at_ai_settings
    BEFORE UPDATE ON ai_provider_settings
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_ai_keys
    BEFORE UPDATE ON ai_provider_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Add comments
COMMENT ON TABLE ai_provider_settings IS 'User/Organization AI provider configuration and preferences';
COMMENT ON TABLE ai_provider_api_keys IS 'Encrypted API keys for external AI providers (OpenAI, Anthropic, Google)';
