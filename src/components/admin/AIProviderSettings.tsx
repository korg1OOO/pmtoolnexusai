import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Settings2,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  logo: React.ReactNode;
  models: { id: string; name: string; description: string }[];
  requiresApiKey: boolean;
  isConfigured: boolean;
  isActive: boolean;
}

const defaultProviders: AIProvider[] = [
  {
    id: 'lovable',
    name: 'Lovable AI',
    description: 'Built-in AI powered by Google Gemini. No API key required.',
    logo: <Sparkles className="h-5 w-5 text-primary" />,
    models: [
      { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Fast, efficient responses' },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Advanced reasoning' },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Balanced performance' },
    ],
    requiresApiKey: false,
    isConfigured: true,
    isActive: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models for advanced language understanding and generation.',
    logo: <Bot className="h-5 w-5" />,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and efficient' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High performance' },
    ],
    requiresApiKey: true,
    isConfigured: false,
    isActive: false,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude models known for safety and helpfulness.',
    logo: <Bot className="h-5 w-5" />,
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Best balance of speed and capability' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most powerful reasoning' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fastest responses' },
    ],
    requiresApiKey: true,
    isConfigured: false,
    isActive: false,
  },
  {
    id: 'google',
    name: 'Google Gemini',
    description: 'Direct Google AI API access for Gemini models.',
    logo: <Zap className="h-5 w-5" />,
    models: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced multimodal' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast processing' },
      { id: 'gemini-pro', name: 'Gemini Pro', description: 'Standard capability' },
    ],
    requiresApiKey: true,
    isConfigured: false,
    isActive: false,
  },
];

interface AIProviderSettingsProps {
  onSave?: (settings: AISettings) => void;
}

export interface AISettings {
  activeProvider: string;
  selectedModel: string;
  apiKeys: Record<string, string>;
  fallbackEnabled: boolean;
  fallbackProvider: string;
}

export function AIProviderSettings({ onSave }: AIProviderSettingsProps) {
  const [providers, setProviders] = useState<AIProvider[]>(defaultProviders);
  const [activeProvider, setActiveProvider] = useState('lovable');
  const [selectedModel, setSelectedModel] = useState('google/gemini-3-flash-preview');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    openai: '',
    anthropic: '',
    google: '',
  });
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [fallbackProvider, setFallbackProvider] = useState('lovable');
  const [isSaving, setIsSaving] = useState(false);

  const currentProvider = providers.find((p) => p.id === activeProvider);

  const handleApiKeyChange = (providerId: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [providerId]: value }));
  };

  const toggleShowApiKey = (providerId: string) => {
    setShowApiKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleProviderSelect = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return;

    // If provider requires API key and isn't configured, show warning
    if (provider.requiresApiKey && !apiKeys[providerId]) {
      toast.warning(`Please configure API key for ${provider.name} first`);
      return;
    }

    setActiveProvider(providerId);
    // Set default model for the provider
    if (provider.models.length > 0) {
      setSelectedModel(provider.models[0].id);
    }
  };

  const handleSaveApiKey = (providerId: string) => {
    const key = apiKeys[providerId];
    if (!key || key.trim() === '') {
      toast.error('Please enter a valid API key');
      return;
    }

    // Update provider status
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId ? { ...p, isConfigured: true } : p
      )
    );

    toast.success(`${providers.find((p) => p.id === providerId)?.name} API key saved`);
  };

  const handleRemoveApiKey = (providerId: string) => {
    setApiKeys((prev) => ({ ...prev, [providerId]: '' }));
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId ? { ...p, isConfigured: false, isActive: false } : p
      )
    );

    // If this was the active provider, switch to Lovable AI
    if (activeProvider === providerId) {
      setActiveProvider('lovable');
      setSelectedModel('google/gemini-3-flash-preview');
    }

    toast.success('API key removed');
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const settings: AISettings = {
        activeProvider,
        selectedModel,
        apiKeys,
        fallbackEnabled,
        fallbackProvider,
      };

      // Store settings in localStorage for now (will be replaced with backend storage)
      localStorage.setItem('ai_provider_settings', JSON.stringify({
        activeProvider,
        selectedModel,
        fallbackEnabled,
        fallbackProvider,
      }));

      onSave?.(settings);
      toast.success('AI settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Active AI Provider
          </CardTitle>
          <CardDescription>
            Select which AI provider to use for the AI Assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={activeProvider}
            onValueChange={handleProviderSelect}
            className="grid gap-3"
          >
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={cn(
                  'flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer',
                  activeProvider === provider.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => handleProviderSelect(provider.id)}
              >
                <RadioGroupItem value={provider.id} id={provider.id} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {provider.logo}
                    <Label htmlFor={provider.id} className="font-medium cursor-pointer">
                      {provider.name}
                    </Label>
                    {provider.isConfigured && (
                      <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    )}
                    {!provider.requiresApiKey && (
                      <Badge variant="secondary">No API Key Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {provider.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Model Selection */}
      {currentProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Model Selection
            </CardTitle>
            <CardDescription>
              Choose the specific model for {currentProvider.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {currentProvider.models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span>{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            API Key Configuration
          </CardTitle>
          <CardDescription>
            Configure API keys for external AI providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers
            .filter((p) => p.requiresApiKey)
            .map((provider) => (
              <div key={provider.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    {provider.logo}
                    {provider.name} API Key
                  </Label>
                  {provider.isConfigured && (
                    <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showApiKeys[provider.id] ? 'text' : 'password'}
                      placeholder={`Enter ${provider.name} API key...`}
                      value={apiKeys[provider.id] || ''}
                      onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => toggleShowApiKey(provider.id)}
                    >
                      {showApiKeys[provider.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {apiKeys[provider.id] && !provider.isConfigured && (
                    <Button
                      variant="outline"
                      onClick={() => handleSaveApiKey(provider.id)}
                    >
                      Save
                    </Button>
                  )}
                  {provider.isConfigured && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveApiKey(provider.id)}
                    >
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {provider.id === 'openai' && 'Get your API key from platform.openai.com'}
                  {provider.id === 'anthropic' && 'Get your API key from console.anthropic.com'}
                  {provider.id === 'google' && 'Get your API key from ai.google.dev'}
                </p>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Fallback Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Fallback Configuration
          </CardTitle>
          <CardDescription>
            Configure a fallback provider if the primary fails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Enable Fallback</div>
              <div className="text-xs text-muted-foreground">
                Automatically switch to fallback if primary provider fails
              </div>
            </div>
            <Switch
              checked={fallbackEnabled}
              onCheckedChange={setFallbackEnabled}
            />
          </div>

          {fallbackEnabled && (
            <div className="space-y-2">
              <Label>Fallback Provider</Label>
              <Select value={fallbackProvider} onValueChange={setFallbackProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fallback provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers
                    .filter((p) => p.id !== activeProvider && (p.isConfigured || !p.requiresApiKey))
                    .map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-2">
                          {provider.logo}
                          {provider.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save AI Settings'}
        </Button>
      </div>
    </div>
  );
}
