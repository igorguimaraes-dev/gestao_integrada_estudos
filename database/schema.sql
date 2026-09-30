CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS app_state (
  workspace_id TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  version BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_secret (
  workspace_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, provider)
);

CREATE TABLE IF NOT EXISTS integration_sync (
  workspace_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  payload JSONB NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, provider)
);

CREATE TABLE IF NOT EXISTS audit_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_event_workspace_created_idx
  ON audit_event (workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS semantic_document (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  source TEXT NOT NULL,
  external_id TEXT,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(768) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS semantic_document_workspace_idx
  ON semantic_document (workspace_id, source);

CREATE INDEX IF NOT EXISTS semantic_document_embedding_idx
  ON semantic_document USING hnsw (embedding vector_cosine_ops);
