# Demonstra??o para entrevista
Objetivo: remover dados reais e integra??o API Asaas do projeto solicitado.
Arquitetura: React/Express existentes, dados fict?cios locais e migra??o ?nica do cache. Nenhuma hidrata??o de dados de produ??o.
- [x] Testar substitui??o de cache antigo e preserva??o de edi??es fict?cias.
- [x] Remover prestadores reais, contatos e documentos dos dados e testes.
- [x] Carregar demonstra??o completa e extrato; remover API Asaas e configura??es.
- [x] Verificar banco local, testes, TypeScript, build e HTTP.
Riscos a verificar: cache antigo, persist?ncia remota, importa??o autom?tica, c?digos de pagamento e afirma??es de conex?o real.

Verificado: banco local gestao_integrada sem tabelas publicas; nao havia registros a apagar. Persistencia remota desativada para impedir recuperacao de outro banco. Migracao local coberta por teste. Execucao no projeto solicitado, sem criar copia com dados reais.

Resultado: 21 testes aprovados, TypeScript sem erros, build gerado. HTTP 200 para app/health; estado remoto vazio; PUT de persistencia 410; antigas rotas Asaas 404. Revisao independente encontrou conciliacao inconsistente e cartoes vazios: corrigidos com testes de regressao. Inspecao visual nao realizada: permissao de depuracao do Chrome ficou pendente.
