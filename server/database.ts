import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { readFile } from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Este módulo é avaliado antes do servidor principal; carrega a configuração aqui
// para que o pool enxergue DATABASE_URL na primeira inicialização.
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const DEFAULT_WORKSPACE = 'default';

const workspaceId = (value: unknown): string =>
  typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value) ? value : DEFAULT_WORKSPACE;

const vectorLiteral = (embedding: number[]): string => `[${embedding.join(',')}]`;

export class DatabaseService {
  private readonly pool: Pool | null;
  private initialized = false;

  constructor() {
    this.pool = process.env.DATABASE_URL
      ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined })
      : null;
  }

  get enabled(): boolean {
    return this.pool !== null;
  }

  async initialize(): Promise<void> {
    if (!this.pool || this.initialized) return;
    const schema = await readFile(path.resolve(process.cwd(), 'database/schema.sql'), 'utf-8');
    await this.pool.query(schema);
    this.initialized = true;
  }

  async getState(workspace: unknown): Promise<Record<string, unknown> | null> {
    if (!this.pool) return null;
    await this.initialize();
    const result = await this.pool.query<{ state: Record<string, unknown> }>(
      'SELECT state FROM app_state WHERE workspace_id = $1', [workspaceId(workspace)]
    );
    return result.rows[0]?.state || null;
  }

  async saveState(workspace: unknown, state: Record<string, unknown>): Promise<void> {
    if (!this.pool) throw new Error('Banco de dados não configurado.');
    await this.initialize();
    const id = workspaceId(workspace);
    await this.pool.query(
      `INSERT INTO app_state (workspace_id, state) VALUES ($1, $2::jsonb)
       ON CONFLICT (workspace_id) DO UPDATE SET state = app_state.state || EXCLUDED.state, version = app_state.version + 1, updated_at = now()`,
      [id, JSON.stringify(state)]
    );
    await this.audit(id, 'state.persisted', { keys: Object.keys(state).length });
  }

  private encryptionKey(): Buffer {
    const secret = process.env.APP_ENCRYPTION_KEY;
    if (!secret || secret.length < 32) {
      throw new Error('APP_ENCRYPTION_KEY deve ter pelo menos 32 caracteres para armazenar credenciais.');
    }
    return createHash('sha256').update(secret).digest();
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${encrypted.toString('base64')}`;
  }

  private decrypt(value: string): string {
    const [iv, authTag, encrypted] = value.split('.');
    if (!iv || !authTag || !encrypted) throw new Error('Credencial criptografada inválida.');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString('utf8');
  }

  async saveSecret(workspace: unknown, provider: string, secret: string): Promise<void> {
    if (!this.pool) throw new Error('Banco de dados não configurado.');
    await this.initialize();
    const id = workspaceId(workspace);
    await this.pool.query(
      `INSERT INTO integration_secret (workspace_id, provider, ciphertext) VALUES ($1, $2, $3)
       ON CONFLICT (workspace_id, provider) DO UPDATE SET ciphertext = EXCLUDED.ciphertext, updated_at = now()`,
      [id, provider, this.encrypt(secret)]
    );
    await this.audit(id, 'integration.secret_saved', { provider });
  }

  async getSecret(workspace: unknown, provider: string): Promise<string | null> {
    if (!this.pool) return null;
    await this.initialize();
    const result = await this.pool.query<{ ciphertext: string }>(
      'SELECT ciphertext FROM integration_secret WHERE workspace_id = $1 AND provider = $2',
      [workspaceId(workspace), provider]
    );
    return result.rows[0] ? this.decrypt(result.rows[0].ciphertext) : null;
  }

  async saveIntegrationSnapshot(workspace: unknown, provider: string, payload: unknown): Promise<void> {
    if (!this.pool) return;
    await this.initialize();
    const id = workspaceId(workspace);
    await this.pool.query(
      `INSERT INTO integration_sync (workspace_id, provider, payload) VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (workspace_id, provider) DO UPDATE SET payload = EXCLUDED.payload, synced_at = now()`,
      [id, provider, JSON.stringify(payload)]
    );
    await this.audit(id, 'integration.synced', { provider });
  }

  async upsertSemanticDocument(workspace: unknown, document: { source: string; externalId?: string; content: string; metadata?: Record<string, unknown>; embedding: number[] }): Promise<void> {
    if (!this.pool) throw new Error('Banco de dados não configurado.');
    if (document.embedding.length !== 768 || document.embedding.some((value) => !Number.isFinite(value))) {
      throw new Error('O embedding deve conter 768 números finitos.');
    }
    await this.initialize();
    await this.pool.query(
      `INSERT INTO semantic_document (workspace_id, source, external_id, content, metadata, embedding)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::vector)
       ON CONFLICT (workspace_id, source, external_id) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata, embedding = EXCLUDED.embedding, updated_at = now()`,
      [workspaceId(workspace), document.source, document.externalId || null, document.content, JSON.stringify(document.metadata || {}), vectorLiteral(document.embedding)]
    );
  }

  async searchSemanticDocuments(workspace: unknown, embedding: number[], limit = 8): Promise<Array<{ content: string; metadata: Record<string, unknown>; similarity: number }>> {
    if (!this.pool) throw new Error('Banco de dados não configurado.');
    if (embedding.length !== 768 || embedding.some((value) => !Number.isFinite(value))) throw new Error('Embedding inválido.');
    await this.initialize();
    const result = await this.pool.query<{ content: string; metadata: Record<string, unknown>; similarity: number }>(
      `SELECT content, metadata, 1 - (embedding <=> $2::vector) AS similarity
       FROM semantic_document WHERE workspace_id = $1
       ORDER BY embedding <=> $2::vector LIMIT $3`,
      [workspaceId(workspace), vectorLiteral(embedding), Math.min(Math.max(limit, 1), 20)]
    );
    return result.rows;
  }

  private async audit(workspace: string, eventType: string, metadata: Record<string, unknown>): Promise<void> {
    if (!this.pool) return;
    await this.pool.query(
      'INSERT INTO audit_event (workspace_id, event_type, metadata) VALUES ($1, $2, $3::jsonb)',
      [workspace, eventType, JSON.stringify(metadata)]
    );
  }
}

export const database = new DatabaseService();
