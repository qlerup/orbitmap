import pool from './db'

// Idempotent udgave af db/init.sql. init.sql kører kun når Postgres-volumen
// er helt frisk — hvis containeren er oprettet uden at init nåede at køre
// (f.eks. ved FjordHub-installation), mangler tabellerne, og alle ruter der
// rører databasen fejler. Dette sikrer skemaet ved hver serverstart.
const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    CREATE TYPE roadmap_item_type AS ENUM ('idea', 'bug', 'feature');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE roadmap_item_status AS ENUM ('backlog', 'planned', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE roadmap_item_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS apps (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    color       VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roadmap_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id      UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    type        roadmap_item_type NOT NULL DEFAULT 'idea',
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      roadmap_item_status NOT NULL DEFAULT 'backlog',
    priority    roadmap_item_priority NOT NULL DEFAULT 'medium',
    position    DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_items_app_status_position ON roadmap_items(app_id, status, position);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_app_id ON roadmap_items(app_id);
`

const ATTEMPTS = 5
const RETRY_DELAY_MS = 3000

export async function ensureSchema(): Promise<void> {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      await pool.query(SCHEMA_SQL)
      console.log('[schema] Databaseskema sikret')
      return
    } catch (error) {
      console.error(`[schema] Kunne ikke sikre skemaet (forsøg ${attempt}/${ATTEMPTS}):`, error)
      if (attempt < ATTEMPTS) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
    }
  }
  // Serveren starter alligevel — health-endpointet afslører at databasen mangler
}
