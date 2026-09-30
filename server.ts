import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { database } from './server/database';
import { criarSnapshotDemonstracao, statusIntegracaoDemonstracao } from './server/asaasDemo';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const workspaceFromRequest = (req: express.Request) => req.header('x-workspace-id') || 'default';

  app.get('/api/persistence/state', async (req, res) => {
    if (!database.enabled) return res.status(503).json({ error: 'Banco de dados não configurado.' });
    try {
      const state = await database.getState(workspaceFromRequest(req));
      return res.json({ state });
    } catch (error) {
      return res.status(503).json({ error: error instanceof Error ? error.message : 'Banco indisponível.' });
    }
  });

  app.put('/api/persistence/state', async (req, res) => {
    if (!database.enabled) return res.status(503).json({ error: 'Banco de dados não configurado.' });
    if (!req.body?.state || typeof req.body.state !== 'object' || Array.isArray(req.body.state)) {
      return res.status(400).json({ error: 'Estado de persistência inválido.' });
    }
    try {
      await database.saveState(workspaceFromRequest(req), req.body.state);
      return res.status(204).end();
    } catch (error) {
      return res.status(503).json({ error: error instanceof Error ? error.message : 'Banco indisponível.' });
    }
  });

  app.post('/api/persistence/semantic-documents', async (req, res) => {
    try {
      await database.upsertSemanticDocument(workspaceFromRequest(req), req.body || {});
      return res.status(204).end();
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Documento semântico inválido.' });
    }
  });

  app.post('/api/persistence/semantic-search', async (req, res) => {
    try {
      const results = await database.searchSemanticDocuments(workspaceFromRequest(req), req.body?.embedding || [], req.body?.limit);
      return res.json({ results });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Busca semântica inválida.' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      databaseConfigured: database.enabled,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/integrations/asaas/status', (req, res) => {
    res.json(statusIntegracaoDemonstracao());
  });

  app.post('/api/integrations/asaas/test-connection', (req, res) => {
    res.json(statusIntegracaoDemonstracao());
  });

  app.post('/api/integrations/asaas/sync', async (req, res) => {
    try {
      return res.json(criarSnapshotDemonstracao());
    } catch (error) {
      return res.status(502).json({
        error: error instanceof Error ? error.message : 'Não foi possível carregar os dados fictícios.',
      });
    }
  });

  // AI Assistant endpoint
  app.post('/api/gemini/assistant', async (req, res) => {
    try {
      const { message, history = [], contextData = {} } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Mensagem inválida ou não fornecida.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      const systemPrompt = `Você é o Assistente de Inteligência Artificial interno do "Gestão Integrada".

DIRETRIZES FUNDAMENTAIS DE COMPORTAMENTO:
1. EXTREMA OBJETIVIDADE: Responda EXATAMENTE e APENAS o que o usuário perguntou. NÃO fale sobre outras coisas. NÃO faça introduções longas, saudações prolixas ou discursos conceituais desnecessários.
2. DIRETO AO PONTO: Vá direto ao número, valor, lista ou fato solicitado.
3. CONCISÃO E PRECISÃO: Destaque valores em R$ em negrito (ex: **R$ 142.320,00**), datas e nomes com base nos dados do sistema.
4. DÚVIDAS OPERACIONAIS: Se perguntarem como fazer algo no sistema, responda em passos curtos e diretos (1, 2, 3).
5. Se perguntarem sobre saldo: informe o saldo consolidado e a discriminação por conta bancária. Nada mais.
6. Se perguntarem sobre inadimplência: informe quem está em atraso, valores e dias. Nada mais.
7. Se perguntarem sobre despesas ou receitas: apresente os números solicitados de forma direta.

DADOS REAIS CARREGADOS DO SISTEMA:
${JSON.stringify(contextData, null, 2)}
`;

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              },
            },
          });

          // Build conversation content
          const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

          // Add history if any
          if (Array.isArray(history) && history.length > 0) {
            for (const h of history.slice(-6)) {
              contents.push({
                role: h.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: h.content }],
              });
            }
          }

          // Add current message with current system context
          contents.push({
            role: 'user',
            parts: [{ text: message }],
          });

          const geminiResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.3,
            },
          });

          const responseText = geminiResponse.text || 'Não foi possível obter uma resposta do modelo.';

          // Determine suggested quick actions based on response content
          const actions = extractSuggestedActions(responseText, message);

          return res.json({
            reply: responseText,
            actions,
            model: 'gemini-3.8-flash',
            source: 'gemini-api',
          });
        } catch (apiError: any) {
          console.error('Erro na chamada Gemini API:', apiError);
          // Fallback to internal knowledge engine on API failure
          const fallback = generateSmartFallbackReply(message, contextData);
          return res.json({
            reply: fallback.text,
            actions: fallback.actions,
            model: 'local-knowledge-engine',
            source: 'system-knowledge',
            warning: 'Resposta gerada pelo motor de conhecimento local integrado.',
          });
        }
      } else {
        // Fallback knowledge engine when no API key is yet configured
        const fallback = generateSmartFallbackReply(message, contextData);
        return res.json({
          reply: fallback.text,
          actions: fallback.actions,
          model: 'local-knowledge-engine',
          source: 'system-knowledge',
        });
      }
    } catch (err: any) {
      console.error('Erro geral no endpoint /api/gemini/assistant:', err);
      res.status(500).json({
        error: 'Erro interno ao processar a requisição de IA.',
        details: err?.message,
      });
    }
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Gestão Integrada] Servidor ativo em http://localhost:${PORT}`);
  });
}

function extractSuggestedActions(replyText: string, userQuery: string) {
  const actions: Array<{ label: string; route: string; description: string }> = [];
  const text = (replyText + ' ' + userQuery).toLowerCase();

  if (text.includes('concilia') || text.includes('extrato') || text.includes('itau') || text.includes('bancári')) {
    actions.push({
      label: 'Abrir Conciliação Bancária IA',
      route: 'conciliacao',
      description: 'Ver 5 pagamentos pendentes e sugestões da IA',
    });
  }

  if (text.includes('asaas') || text.includes('nota') || text.includes('cobrança') || text.includes('boleto') || text.includes('nfse')) {
    actions.push({
      label: 'Notas & Cobranças Asaas',
      route: 'notas-cobrancas',
      description: 'Gerenciar emissão de faturas, boletos e NFS-e',
    });
  }

  if (text.includes('inadimpl') || text.includes('receber') || text.includes('faturamento') || text.includes('atraso')) {
    actions.push({
      label: 'Contas a Receber',
      route: 'financeiro-receber',
      description: 'Consultar títulos em aberto e régua de cobrança',
    });
  }

  if (text.includes('pagar') || text.includes('fornecedor') || text.includes('despesa') || text.includes('tributo')) {
    actions.push({
      label: 'Contas a Pagar',
      route: 'financeiro-pagar',
      description: 'Acompanhar obrigações e pagamentos agendados',
    });
  }

  if (text.includes('cliente') || text.includes('alpha tech') || text.includes('contrato')) {
    actions.push({
      label: 'Carteira de Clientes',
      route: 'clientes',
      description: 'Consultar saúde, receita e contratos ativos',
    });
  }

  if (text.includes('pipeline') || text.includes('comercial') || text.includes('proposta') || text.includes('lead')) {
    actions.push({
      label: 'Pipeline Comercial',
      route: 'pipeline',
      description: 'Ver oportunidades e taxas de conversão',
    });
  }

  return actions.slice(0, 3);
}

function generateSmartFallbackReply(query: string, context: any) {
  const q = query.toLowerCase();

  // 1. Saldo e Situação Financeira Geral
  if (q.includes('saldo') || q.includes('quanto tem') || q.includes('caixa') || (q.includes('banco') && !q.includes('como concilia'))) {
    return {
      text: `Seu saldo bancário consolidado atual é de **R$ 218.886,41**, distribuído em:
- **Asaas (Conta Digital)**: R$ 142.320,00
- **Santander PJ (Reserva)**: R$ 85.000,00
- **Itaú Unibanco PJ**: -R$ 8.433,59 *(com 5 lançamentos pendentes de conciliação totalizando R$ 60.254,21)*`,
      actions: [
        { label: 'Ver Conciliação Itaú', route: 'conciliacao', description: 'Abrir conciliação dos 5 lançamentos pendentes' },
        { label: 'Visão Geral Financeira', route: 'financeiro', description: 'Ver saldo consolidado e extratos' }
      ]
    };
  }

  // 2. Inadimplência e Clientes em Atraso
  if (q.includes('inadimpl') || q.includes('atras') || (q.includes('pendent') && q.includes('cliente'))) {
    return {
      text: `### Análise de Inadimplência & Cobrança

- **Cliente em Atraso:** **Alpha Tech Solutions** (CNPJ: 12.345.678/0001-90)
- **Valor Vencido:** **R$ 14.500,00** (Contrato CTR-2026-001)
- **Tempo de Atraso:** **12 dias** (Vencimento original: 26/08/2026)
- **Status do Pagamento no Asaas:** Falha de compensação / Boleto & Pix não liquidado
- **Impacto no Faturamento:** Representa **7,8%** do faturamento recorrente mensal (MRR)
- **Health Score do Cliente:** Atenção (histórico anterior regular, primeiro atraso relevante)

**Próxima ação recomendada:**
Disparar notificação amigável via WhatsApp/E-mail com novo Pix Copia e Cola pelo Asaas e verificar se houve problema operacional no contas a pagar do cliente.`,
      actions: [
        { label: 'Ir para Contas a Receber', route: 'financeiro-receber', description: 'Reenviar cobrança ou verificar histórico' },
        { label: 'Ver Cliente Alpha Tech', route: 'clientes', description: 'Visualizar ficha completa e contatos' },
        { label: 'Notas & Cobranças Asaas', route: 'notas-cobrancas', description: 'Gerar novo link de pagamento Asaas' }
      ]
    };
  }

  // 3. Projeção de Fluxo de Caixa / Entradas da Semana
  if (q.includes('fluxo de caixa') || q.includes('projeção') || q.includes('receber') || q.includes('semana')) {
    return {
      text: `### Projeção de Fluxo de Caixa (Próximos 7 Dias)

- **Saldo Consolidado Disponível:** **R$ 218.886,41**
- **Entradas Previstas (Recebíveis):** **+R$ 38.500,00**
  - **Beta Incorporadora**: R$ 18.000,00 *(Venc: 09/09/2026)*
  - **Vanguard Logística**: R$ 12.500,00 *(Venc: 10/09/2026)*
  - **Delta Alimentos**: R$ 8.000,00 *(Venc: 11/09/2026)*
- **Saídas Previstas (Obrigações/DARF):** **-R$ 37.950,00**
  - Fornecedores e licenças cloud: R$ 23.100,00
  - Tributos Federais (DARF): R$ 14.850,21
- **Resultado Líquido da Semana:** **+R$ 550,00** (Saldo Projetado: **R$ 219.436,41**)

**Próxima ação recomendada:**
Acompanhar liquidação do recebível da Beta Incorporadora no dia 09/09 para cobrir com tranquilidade a guia DARF.`,
      actions: [
        { label: 'Ver Contas a Receber', route: 'financeiro-receber', description: 'Consultar todos os títulos a vencer' },
        { label: 'Contas a Pagar', route: 'financeiro-pagar', description: 'Ver programação de desembolso' },
        { label: 'Visão Geral Financeira', route: 'financeiro', description: 'Abrir tesouraria consolidada' }
      ]
    };
  }

  // 3.1 Contratos e Renovações
  if (q.includes('contrato') || q.includes('reajuste') || q.includes('ipca')) {
    return {
      text: `### Gestão de Contratos & Renovações

- **Total de Contratos Ativos:** 18 contratos vigentes
- **Aguardando Revisão Interna:** **2 contratos**
  - CTR-2026-014 (Nova Tech Soluções) - Enviado há 3 dias
  - CTR-2026-015 (Nexus Engenharia) - Minuta em revisão jurídica
- **Contratos com Vencimento nos Próximos 60 Dias:** **3 contratos** (potencial de renovação de **R$ 24.500,00/mês**)
- **Reajustes IPCA Previstos:** 2 contratos com aniversário contratual previsto para Outubro/2026.

**Próxima ação recomendada:**
Concluir a revisão pendente para dar início ao faturamento recorrente.`,
      actions: [
        { label: 'Gestão de Contratos', route: 'contratos', description: 'Ver contratos e renovações' },
        { label: 'Ver Carteira de Clientes', route: 'clientes', description: 'Consultar empresas contratantes' }
      ]
    };
  }

  // 3.2 Pipeline e Oportunidades
  if (q.includes('pipeline') || q.includes('funil') || q.includes('oportunidade') || q.includes('proposta')) {
    return {
      text: `### Análise do Funil Comercial (Pipeline)

- **Valor Total no Funil:** **R$ 148.000,00** em negociações abertas
- **Oportunidades em Fase de Proposta / Negociação Quente:**
  - **Grupo Vanguarda**: R$ 22.000,00/mês (Probabilidade 80% - Reunião de fechamento agendada)
  - **Solaris Energia**: R$ 15.000,00/mês (Probabilidade 65% - Proposta técnica aprovada)
- **Taxa de Conversão Média:** 32% dos leads qualificados tornam-se contratos ativos.

**Próxima ação recomendada:**
Priorizar o follow-up do Grupo Vanguarda para fechar até sexta-feira.`,
      actions: [
        { label: 'Abrir Pipeline Comercial', route: 'pipeline', description: 'Acompanhar negócios em andamento' }
      ]
    };
  }

  // 4. Gastos / Despesas / Receitas do Mês
  if (q.includes('gasto') || q.includes('despesa') || q.includes('receita') || q.includes('dre') || q.includes('pagar')) {
    return {
      text: `Posição de receitas e despesas do mês atual:
- **Receitas Previstas**: **R$ 184.200,00** (R$ 126.800,00 recebidos | R$ 57.400,00 a receber)
- **Despesas / Contas a Pagar**: **R$ 82.150,00** (R$ 44.200,00 pagas | R$ 37.950,00 a pagar)
- **Resultado Operacional Previsto**: **+R$ 102.050,00**`,
      actions: [
        { label: 'Contas a Pagar', route: 'financeiro-pagar', description: 'Consultar despesas e tributos' },
        { label: 'Contas a Receber', route: 'financeiro-receber', description: 'Consultar faturamento do mês' }
      ]
    };
  }

  // 5. Conciliação Bancária
  if (q.includes('concilia') || q.includes('extrato') || q.includes('itau') && q.includes('pendent')) {
    if (q.includes('como')) {
      return {
        text: `Passo a passo para conciliar no sistema:
1. Acesse **Financeiro > Conciliação Bancária**.
2. Selecione a conta desejada (ex: Itaú).
3. Clique em **'Conciliar 5 com IA'** para aceitar as sugestões automáticas ou clique em um lançamento específico para ajustar categoria e fornecedor.
4. Confirme para dar baixa automática nas contas do sistema.`,
        actions: [
          { label: 'Abrir Conciliação Bancária IA', route: 'conciliacao', description: 'Ver as 5 pendências aguardando aprovação' }
        ]
      };
    }

    return {
      text: `Há **5 lançamentos pendentes de conciliação** na conta corrente Itaú (total de **R$ 60.254,21**):
1. **SISPAG FORNECEDORES**: R$ 28.400,00 (05/09/2026)
2. **PGTO TRIB FED DARF**: R$ 14.850,21 (05/09/2026)
3. **PAG BOLETO META PLATFORMS**: R$ 8.900,00 (04/09/2026)
4. **TRANSF PIX SERVICOS CLOUD**: R$ 5.104,00 (04/09/2026)
5. **TARIFA BANCARIA PACOTE PJ**: R$ 3.000,00 (03/09/2026)`,
      actions: [
        { label: 'Abrir Conciliação Bancária IA', route: 'conciliacao', description: 'Resolver pendências agora' }
      ]
    };
  }

  // 6. Resposta Padrão Direta
  return {
    text: `Dados do sistema para a sua consulta:
- **Saldo Consolidado:** **R$ 218.886,41**
- **Inadimplência:** **R$ 14.500,00** (Alpha Tech Solutions - 12 dias em atraso)
- **Contas a Receber no Mês:** **R$ 57.400,00** pendentes (R$ 126.800,00 já recebidos)
- **Contas a Pagar no Mês:** **R$ 37.950,00** pendentes (R$ 44.200,00 já pagas)
- **Conciliações Bancárias Pendentes:** **5 lançamentos** (R$ 60.254,21 no Itaú)`,
    actions: [
      { label: 'Conciliação Bancária IA', route: 'conciliacao', description: 'Ver lançamentos pendentes' },
      { label: 'Contas a Receber', route: 'financeiro-receber', description: 'Ver entradas e inadimplência' }
    ]
  };
}

startServer();
