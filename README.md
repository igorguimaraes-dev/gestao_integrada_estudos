# Gestão Integrada — Estudos

Aplicação de gestão financeira para estudo, construída com dados fictícios. Não usa chaves, webhooks ou chamadas à API de produção do Asaas.

## Início rápido

```bash
npm install
docker compose up -d
npm run dev
```

Abra `http://localhost:3000`.

Para validar o projeto:

```bash
npm run lint
npm test
npm run build
```

## Arquitetura

```text
React + Vite (src/)
        │
        ├── interface, dashboards e módulos financeiros
        ├── armazenamento local do navegador
        └── dados fictícios para cobranças
        │
Express (server.ts)
        │
        ├── API HTTP e assistente de IA
        ├── integração demonstrativa local
        └── persistência opcional
        │
PostgreSQL + pgvector (database/)
        └── estado financeiro, auditoria e busca semântica
```

| Área | Responsabilidade |
| --- | --- |
| `src/` | Frontend React, telas e regras de negócio do cliente. |
| `server.ts` | API Express e entrega do frontend. |
| `server/asaasDemo.ts` | Dados fictícios usados na demonstração de cobranças. |
| `server/database.ts` | Acesso ao PostgreSQL. |
| `database/schema.sql` | Schema do banco e extensão pgvector. |
| `docker-compose.yml` | PostgreSQL local para desenvolvimento. |

## Configuração opcional

Copie `.env.example` para `.env.local` caso queira habilitar PostgreSQL ou recursos de IA. Nunca publique esse arquivo.

Sem `DATABASE_URL`, o sistema continua funcionando com armazenamento local no navegador.
