'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, Copy, Key, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  getWorkspaces,
  createWorkspaceApiKey,
  listWorkspaceApiKeys,
  revokeWorkspaceApiKey,
  type Workspace,
  type ApiKey,
} from '@/lib/api';

/**
 * Self-service API key management: pick a workspace, create a key
 * (secret shown once), list and revoke existing keys.
 */
export function ApiKeysPanel() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    getWorkspaces()
      .then((list) => {
        setWorkspaces(list);
        if (list.length > 0) setSelectedWorkspace(list[0].id);
      })
      .catch(() => setError('Workspace listesi yüklenemedi.'));
  }, []);

  const loadKeys = useCallback(async (workspaceId: string) => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listWorkspaceApiKeys(workspaceId);
      setKeys(Array.isArray(list) ? list : []);
    } catch {
      setError('API anahtarları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedWorkspace) loadKeys(selectedWorkspace);
  }, [selectedWorkspace, loadKeys]);

  const handleCreate = async () => {
    if (!selectedWorkspace) return;
    setCreating(true);
    setError(null);
    try {
      const key = await createWorkspaceApiKey(selectedWorkspace, {
        name: newKeyName || 'API Key',
      });
      setCreatedKey(key);
      setNewKeyName('');
      await loadKeys(selectedWorkspace);
    } catch {
      setError('API anahtarı oluşturulamadı.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!selectedWorkspace) return;
    if (!window.confirm('Bu anahtarı iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      await revokeWorkspaceApiKey(selectedWorkspace, keyId);
      await loadKeys(selectedWorkspace);
    } catch {
      setError('Anahtar iptal edilemedi.');
    }
  };

  const copyValue = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Key className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-foreground">API Anahtarların</h3>
          <p className="text-sm text-muted-foreground">
            Anahtarlar workspace&apos;e bağlıdır. Secret anahtar yalnızca oluşturulduğu anda gösterilir.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-[var(--destructive-muted)] px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <select
          value={selectedWorkspace}
          onChange={(e) => setSelectedWorkspace(e.target.value)}
          aria-label="Workspace seç"
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {workspaces.length === 0 && <option value="">Workspace bulunamadı</option>}
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
        <Input
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Anahtar adı (örn. production)"
          className="sm:max-w-xs"
        />
        <Button onClick={handleCreate} disabled={creating || !selectedWorkspace}>
          <Plus className="h-4 w-4" />
          {creating ? 'Oluşturuluyor…' : 'Yeni Anahtar'}
        </Button>
      </div>

      {createdKey?.apiKey && (
        <div className="mb-4 space-y-3 rounded-xl border border-warning/30 bg-warning-muted p-4">
          <p className="text-sm font-semibold text-foreground">
            Anahtar oluşturuldu — secret&apos;ı ŞİMDİ kaydedin, bir daha gösterilmeyecek.
          </p>
          <SecretRow
            label="Secret key (Authorization: Bearer …)"
            value={createdKey.apiKey}
            copied={copiedField === 'secret'}
            onCopy={() => copyValue(createdKey.apiKey!, 'secret')}
          />
          {createdKey.clientId && (
            <SecretRow
              label="Client ID (salt-okunur/kimlik amaçlı)"
              value={createdKey.clientId}
              copied={copiedField === 'clientId'}
              onCopy={() => copyValue(createdKey.clientId, 'clientId')}
            />
          )}
          <Button variant="outline" size="sm" onClick={() => setCreatedKey(null)}>
            Kaydettim, kapat
          </Button>
        </div>
      )}

      <div className="divide-y divide-border rounded-xl border border-border">
        {loading && <div className="px-4 py-6 text-sm text-muted-foreground">Yükleniyor…</div>}
        {!loading && keys.length === 0 && (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            Bu workspace için henüz API anahtarı yok.
          </div>
        )}
        {!loading &&
          keys.map((key) => (
            <div key={key.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{key.name}</span>
                  {key.active ? <Badge variant="success">Aktif</Badge> : <Badge variant="outline">Pasif</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {key.keyPreview || 'bg_secret_…'} · Oluşturma:{' '}
                  {new Date(key.createdAt).toLocaleDateString('tr-TR')}
                  {key.lastUsedAt &&
                    ` · Son kullanım: ${new Date(key.lastUsedAt).toLocaleDateString('tr-TR')}`}
                </p>
              </div>
              {key.active && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevoke(key.id)}
                  className="text-destructive hover:bg-[var(--destructive-muted)] hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  İptal et
                </Button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

function SecretRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-foreground">
          {value}
        </code>
        <Button variant="outline" size="icon" onClick={onCopy} aria-label={`${label} kopyala`}>
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
