# Gestao Integrada - Apresentacao

## Acesso de teste

- **Login:** `admin@example.com`
- **Senha:** `senha-segura`

Acesso demonstrativo: aceita qualquer e-mail válido e senha com pelo menos oito caracteres.

Aplicacao React/Express para demonstracao em entrevista, com clientes, contratos, fornecedores, contas, lancamentos, cartoes, reembolsos e extratos inteiramente ficticios.

## Executar

```sh
npm install
npm run dev
```

Abra http://localhost:3000 e utilize o acesso de teste informado no início deste documento.

## Dados da demonstracao

Na primeira abertura desta versao, o cache financeiro anterior e removido automaticamente e substituido por dados ficticios. As alteracoes posteriores ficam apenas no navegador. Em Configuracoes financeiras, o botao de dados ficticios restaura o conjunto de exemplo.

Os contatos usam example.com, documentos e contas bancarias usam zeros e os codigos de Pix/boleto sao textos DEMO sem valor de pagamento. A busca de CNPJ preenche somente um exemplo local. Lembretes de cobranca sao simulados, sem envio.

## Integracoes

A integracao API com Asaas foi removida: nao ha cliente HTTP, endpoints de sincronizacao, credenciais, webhooks ou recuperacao de snapshots. As telas de notas e cobrancas funcionam como simulacoes locais, sem emissao fiscal ou registro bancario. O servidor desta edicao nao acessa o PostgreSQL nem recupera dados de bases antigas.

O assistente funciona com respostas locais; GEMINI_API_KEY e opcional para respostas de IA. Nenhuma chave e necessaria para apresentar os modulos financeiros.

## Verificacao

```sh
npm test
npm run lint
npm run build
```

A pasta database/ e o Docker Compose permanecem como referencia arquitetural de PostgreSQL/pgvector; nao sao usados pela demonstracao. Para apresentar, basta Node.js 20 ou superior.
