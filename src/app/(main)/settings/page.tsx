'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  ExternalLink,
  Check,
  Loader2,
  Key,
  Star,
  Zap,
  CircleAlert,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    placeholder: 'AIzaSy...',
    color: '#4285F4',
    helpUrl: 'https://aistudio.google.com/apikey',
    helpLabel: 'Google AI Studio',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    placeholder: 'sk-...',
    color: '#10A37F',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpLabel: 'OpenAI Platform',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    placeholder: 'sk-ant-...',
    color: '#D97706',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    helpLabel: 'Anthropic Console',
  },
];

interface ApiKeyItem {
  id: string;
  provider: string;
  label: string | null;
  maskedKey: string;
  isDefault: boolean;
  isValid: boolean | null;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [useSystemKey, setUseSystemKey] = useState(true);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newProvider, setNewProvider] = useState('gemini');
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);

  // Testing
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; error?: string }>>({});

  const loadKeys = async () => {
    const res = await fetch('/api/keys');
    const data = await res.json();
    setKeys(data);
  };

  useEffect(() => {
    Promise.all([
      loadKeys(),
      fetch('/api/settings').then((r) => r.json()).then((d) => setUseSystemKey(d.useSystemKey)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleToggleSystemKey = async (value: boolean) => {
    setUseSystemKey(value);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useSystemKey: value }),
    });
  };

  const handleAdd = async () => {
    if (!newKey.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: newProvider,
          apiKey: newKey,
          label: newLabel || null,
          setDefault: !keys.some((k) => k.isDefault),
        }),
      });
      if (res.ok) {
        setNewKey('');
        setNewLabel('');
        setShowAdd(false);
        await loadKeys();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    await loadKeys();
  };

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/keys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setDefault: true }),
    });
    await loadKeys();
  };

  const handleTest = async (keyItem: ApiKeyItem) => {
    setTestingId(keyItem.id);
    setTestResult((prev) => ({ ...prev, [keyItem.id]: undefined as unknown as { ok: boolean } }));
    try {
      const res = await fetch('/api/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: keyItem.provider, keyId: keyItem.id }),
      });
      const result = await res.json();
      setTestResult((prev) => ({ ...prev, [keyItem.id]: result }));
      await loadKeys();
    } finally {
      setTestingId(null);
    }
  };

  const selectedProvider = PROVIDERS.find((p) => p.id === newProvider)!;

  const groupedKeys = PROVIDERS.map((p) => ({
    provider: p,
    keys: keys.filter((k) => k.provider === p.id),
  })).filter((g) => g.keys.length > 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground mt-1">Quản lý API keys cho các dịch vụ AI</p>
      </div>

      {/* System Key Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Dùng key của hệ thống</Label>
                {useSystemKey && (
                  <Badge variant="secondary" className="bg-chart-3/20 text-chart-3 text-xs">
                    Đang dùng
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {useSystemKey
                  ? 'AI sẽ dùng key mặc định của hệ thống (Gemini). Tắt để dùng key cá nhân.'
                  : 'AI sẽ dùng key cá nhân bạn đã cài đặt bên dưới. Cần có ít nhất 1 key mặc định.'}
              </p>
            </div>
            <button
              onClick={() => handleToggleSystemKey(!useSystemKey)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                useSystemKey ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  useSystemKey ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Personal API Keys */}
      <Card className={useSystemKey ? 'opacity-50 pointer-events-none' : ''}>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key size={18} className="text-chart-4" />
            API Keys
            {keys.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {keys.length}
              </Badge>
            )}
          </CardTitle>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={14} /> Thêm key
          </Button>
        </CardHeader>

        {showAdd && (
          <CardContent className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Provider</Label>
                <Select value={newProvider} onValueChange={(v) => v && setNewProvider(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: p.color }}
                          />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Tên gợi nhớ (tùy chọn)</Label>
                <Input
                  placeholder="VD: Key cá nhân"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">API Key</Label>
              <Input
                type="password"
                placeholder={selectedProvider.placeholder}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <a
                href={selectedProvider.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink size={11} />
                Lấy key tại {selectedProvider.helpLabel}
              </a>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={!newKey.trim() || saving}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Thêm
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent className={showAdd ? 'border-t pt-4' : ''}>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 size={14} className="animate-spin" /> Đang tải...
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-6">
              <Key size={32} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Chưa có API key nào. Thêm key để sử dụng tính năng AI.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Nếu không thêm, hệ thống sẽ dùng key mặc định (có thể bị giới hạn).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedKeys.map(({ provider, keys: providerKeys }) => (
                <div key={provider.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: provider.color }}
                    />
                    <span className="text-sm font-medium">{provider.name}</span>
                  </div>
                  <div className="space-y-2">
                    {providerKeys.map((keyItem) => (
                      <div
                        key={keyItem.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          keyItem.isDefault
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        {/* Status indicator */}
                        <div className="shrink-0">
                          {keyItem.isValid === true ? (
                            <CheckCircle2 size={16} className="text-chart-3" />
                          ) : keyItem.isValid === false ? (
                            <XCircle size={16} className="text-destructive" />
                          ) : (
                            <CircleAlert size={16} className="text-muted-foreground" />
                          )}
                        </div>

                        {/* Key info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono truncate">
                              {keyItem.maskedKey}
                            </span>
                            {keyItem.isDefault && (
                              <Badge
                                variant="secondary"
                                className="bg-primary/20 text-primary text-xs shrink-0"
                              >
                                Mặc định
                              </Badge>
                            )}
                          </div>
                          {keyItem.label && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {keyItem.label}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Test */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleTest(keyItem)}
                            disabled={testingId === keyItem.id}
                            title="Test kết nối"
                          >
                            {testingId === keyItem.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : testResult[keyItem.id]?.ok ? (
                              <Check size={14} className="text-chart-3" />
                            ) : (
                              <Zap size={14} />
                            )}
                          </Button>

                          {/* Set default */}
                          {!keyItem.isDefault && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleSetDefault(keyItem.id)}
                              title="Đặt làm mặc định"
                            >
                              <Star size={14} />
                            </Button>
                          )}

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(keyItem.id)}
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Test result toast */}
              {Object.entries(testResult).map(([id, result]) =>
                result && !result.ok ? (
                  <div
                    key={id}
                    className="text-xs text-destructive bg-destructive/10 p-2 rounded-md"
                  >
                    Lỗi kết nối: {result.error}
                  </div>
                ) : null
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help */}
      <Card className={useSystemKey ? 'opacity-50 pointer-events-none' : ''}>
        <CardContent className="pt-6 space-y-2">
          <h3 className="text-sm font-medium">Lấy API key miễn phí</h3>
          <div className="space-y-1.5">
            {PROVIDERS.map((p) => (
              <a
                key={p.id}
                href={p.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1"
              >
                <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                <ExternalLink size={12} />
                {p.name} — {p.helpLabel}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
