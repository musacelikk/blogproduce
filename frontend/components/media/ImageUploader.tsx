'use client';

import { useCallback, useRef, useState } from 'react';
import { AlertCircle, ImagePlus, Loader2, UploadCloud, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { uploadAsset, type Asset } from '@/lib/api';

/** Kept in step with the backend's magic-byte allow-list (assets/file-type.util.ts). */
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_BYTES = 10 * 1024 * 1024;

const EXTENSION_LABEL = 'JPEG, PNG, WebP, GIF veya AVIF · en fazla 10MB';

function humanSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * Drag-and-drop image upload to S3.
 *
 * Validation is duplicated here on purpose: the server is the authority (it
 * checks magic bytes, not the file's claimed type), but rejecting a 40MB file
 * before it is uploaded saves the user a long wait for a failure that was
 * knowable up front.
 */
export function ImageUploader({
  workspaceId,
  onUploaded,
  defaultAlt,
}: {
  workspaceId: string;
  onUploaded: (asset: Asset) => void;
  defaultAlt?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string; size: number } | null>(null);
  const [alt, setAlt] = useState(defaultAlt ?? '');

  const reject = (message: string) => {
    setError(message);
    setPreview(null);
  };

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED.includes(file.type)) {
        reject(`Bu dosya türü desteklenmiyor. ${EXTENSION_LABEL}.`);
        return;
      }
      if (file.size > MAX_BYTES) {
        reject(`Dosya çok büyük (${humanSize(file.size)}). En fazla 10MB yükleyebilirsiniz.`);
        return;
      }

      // Local preview so the user sees what they picked before committing.
      const url = URL.createObjectURL(file);
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return { url, name: file.name, size: file.size };
      });

      void upload(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceId, alt],
  );

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const asset = await uploadAsset(workspaceId, file, alt.trim() || file.name);
      onUploaded(asset);
    } catch (err) {
      reject(
        err instanceof Error
          ? err.message
          : 'Görsel yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.',
      );
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clearPreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="gorsel-alt" className="mb-1.5 block text-sm font-medium text-foreground">
          Alternatif metin
        </label>
        <input
          id="gorsel-alt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Görselde ne olduğunu kısaca yazın"
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Ekran okuyucular ve arama motorları için önemlidir. Boş bırakırsanız dosya adı kullanılır.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Görsel yükle"
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-fast ease-out-quart focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          dragging
            ? 'border-primary bg-accent'
            : 'border-border bg-secondary hover:border-primary/50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm font-medium text-foreground-strong">Yükleniyor…</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Görsel depolama alanına aktarılıyor
            </p>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card">
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground-strong">
              Görseli buraya sürükleyin
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              veya tıklayıp bilgisayarınızdan seçin
            </p>
            <p className="mt-3 text-xs text-muted-foreground">{EXTENSION_LABEL}</p>
          </>
        )}
      </div>

      {preview && !uploading && (
        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
          {/* Local blob preview — next/image cannot optimise an object URL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.url}
            alt="Seçilen görselin önizlemesi"
            className="h-14 w-14 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground-strong">{preview.name}</p>
            <p className="text-xs text-muted-foreground">{humanSize(preview.size)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearPreview} aria-label="Seçimi temizle">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-destructive-muted p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

/** Small trigger used where a full drop zone would not fit. */
export function ImageUploadButton({
  workspaceId,
  onUploaded,
  label = 'Görsel yükle',
}: {
  workspaceId: string;
  onUploaded: (asset: Asset) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (file: File) => {
    setUploading(true);
    try {
      onUploaded(await uploadAsset(workspaceId, file, file.name));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Görsel yüklenemedi');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void pick(file);
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
        {uploading ? 'Yükleniyor…' : label}
      </Button>
    </>
  );
}
