# Gestão Integrada — Estudos

Aplicação web de gestão financeira com dashboards, fluxo de caixa, conciliação, relatórios e importação de faturas em PDF. Esta edição é voltada a estudo: a integração de cobranças usa somente dados fictícios locais, sem chaves, webhooks ou chamadas à API de produção do Asaas.

## Pré-requisitos

- Node.js 20 ou superior
- Docker Desktop, para executar o PostgreSQL local
- GNU Make, para usar os atalhos de desenvolvimento

No Windows, abra o projeto no PowerShell e execute `make help`. Caso o comando não exista, instale o GNU Make com Chocolatey (`choco install make`) ou use o ambiente de desenvolvimento da sua preferência. Em macOS e Linux, instale-o pelo gerenciador de pacotes do sistema.

## Início rápido

```bash
make help
```

`make help` apresenta os atalhos por etapa de trabalho. `make` continua como atalho para o mesmo guia.

| Comando | Ação |
| --- | --- |
| `make install` | Instala as dependências do projeto. |
| `make setup` | Instala as dependências e inicia o PostgreSQL local. |
| `make dev` | Inicia PostgreSQL/Docker e o ambiente local em `http://localhost:3000`. |
| `make open` | Inicia o ambiente e abre o sistema no navegador. |
| `make status` | Exibe o status da aplicação e do PostgreSQL. |
| `make logs` | Acompanha os logs dos serviços Docker. |
| `make check` | Executa a validação TypeScript e os testes. |
| `make build` | Gera o build local. |
| `make stop` | Encerra a aplicação local e executa `docker compose down`, sem apagar os dados do banco. |
| `make start` | Inicia o build local. |
| `make db-up` | Inicia apenas o PostgreSQL com pgvector. |
| `make db-status` | Exibe o status do banco de dados. |
| `make db-logs` | Acompanha os logs do PostgreSQL. |
| `make db-down` | Para o banco de dados sem remover seu volume. |
| `make clean` | Remove apenas os artefatos locais de build. |
| `make reset` | Recria dependências e o container PostgreSQL, preservando o volume de dados. |

## Configuração de ambiente

1. Copie `.env.example` para `.env.local`.
2. Configure `GEMINI_API_KEY` para habilitar os recursos de IA.
3. Para persistência no PostgreSQL, configure `DATABASE_URL` e uma `APP_ENCRYPTION_KEY` única, com ao menos 32 caracteres.
4. Inicie tudo com `make dev`.

Exemplo de conexão local:

```env
DATABASE_URL=postgres://gestao:gestao_local@localhost:5432/gestao_integrada
```

Nunca envie `.env.local` ou chaves de API ao repositório. Nesta edição, cobranças e sincronizações usam dados fictícios locais.

## Banco de dados e integrações

Quando `DATABASE_URL` está configurada, a aplicação aplica automaticamente o schema em `database/schema.sql`. O banco utiliza `pgvector` para documentos semânticos, além de persistir estado financeiro, eventos de auditoria e snapshots de integração.

Sem banco configurado, o sistema usa o cache local do navegador como alternativa offline. Credenciais de integrações não são gravadas no armazenamento do navegador. A integração demonstrativa de cobranças não aceita nem transmite credenciais.

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

| Camada | Responsabilidade |
| --- | --- |
| `src/` | Interface React, visualizações, módulos financeiros e regras executadas no cliente. |
| `server.ts` | API Express, rotas de persistência, assistente de IA e entrega da aplicação. |
| `server/asaasDemo.ts` | Fonte local de clientes, cobranças, saldo e transações fictícias. |
| `server/database.ts` | Pool PostgreSQL, inicialização do schema e serviços de persistência. |
| `database/schema.sql` | Tabelas da aplicação e extensão pgvector. |
| `docker-compose.yml` | PostgreSQL local com pgvector. |
| `scripts/` | Utilitários de inicialização, status e validação do ambiente. |

O fluxo principal é: a interface solicita dados à API Express; o backend devolve dados demonstrativos ou persiste no PostgreSQL quando configurado; a interface atualiza o armazenamento local e os dashboards. O modo demonstrativo evita qualquer comunicação com serviços de cobrança externos.

## Estrutura principal

```text
src/                 Interface React e módulos financeiros
server.ts            API Express e integrações de backend
server/              Acesso ao banco e dados demonstrativos
database/schema.sql  Schema PostgreSQL/pgvector
docker-compose.yml   PostgreSQL local
scripts/             Atalhos e verificações de desenvolvimento
Makefile             Ajuda e atalhos de desenvolvimento
```
