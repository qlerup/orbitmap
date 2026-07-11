CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enkelt-bruger system - der forventes kun én række i denne tabel.
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE roadmap_item_type     AS ENUM ('idea', 'bug', 'feature');
CREATE TYPE roadmap_item_status   AS ENUM ('backlog', 'planned', 'in_progress', 'done');
CREATE TYPE roadmap_item_priority AS ENUM ('low', 'medium', 'high');

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
