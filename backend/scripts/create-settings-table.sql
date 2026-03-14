-- Settings tablosu (ana sayfa blog seçimleri vb. için)
-- synchronize: false kullanıyorsanız bu script'i çalıştırın: psql -U postgres -d YOUR_DB -f scripts/create-settings-table.sql

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE settings IS 'Uygulama ayarları (homepage_posts vb.)';
