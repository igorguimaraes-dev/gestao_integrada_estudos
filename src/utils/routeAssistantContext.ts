import { RouteId } from '../types';

export interface RouteActionSuggestion {
  id: string;
  label: string;
  description: string;
  prompt: string;
  badge?: string;
  targetRoute?: RouteId;
  category: 'analise' | 'acao' | 'automacao';
}

export interface RouteAssistantConfig {
  route: RouteId;
  screenName: string;
  contextDescription: string;
  badge: string;
  primaryAction: RouteActionSuggestion;
  secondaryActions: RouteActionSuggestion[];
  quickChips: string[];
}

export const ROUTE_ASSISTANT_CONFIGS: Partial<Record<RouteId, RouteAssistantConfig>> = {
  financeiro: {
    route: 'financeiro',
    screenName: 'Visão Geral Financeira',
    contextDescription: 'Gestão de tesouraria, saldos consolidados e conciliação bancária',
    badge: 'Análise Financeira',
    primaryAction: {
      id: 'fin-inadimplencia',
      label: 'Analisar inadimplência',
      description: 'Verificar clientes em atraso (Alpha Tech: R$ 14.500,00) e impacto no caixa',
      prompt: 'Faça uma análise completa da inadimplência atual: quem está em atraso, impacto percentual no faturamento e recomendações de cobrança.',
      badge: 'Prioridade Alta',
      targetRoute: 'financeiro-receber',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'fin-conciliacao',
        label: 'Ver pendências de conciliação',
        description: '5 lançamentos pendentes no Itaú somando R$ 60.254,21',
        prompt: 'Quais são os lançamentos bancários pendentes de conciliação no Itaú e sugestões da IA?',
        targetRoute: 'conciliacao',
        category: 'acao',
      },
      {
        id: 'fin-fluxo-caixa',
        label: 'Projetar fluxo de caixa da semana',
        description: 'R$ 38.500,00 a receber vs R$ 37.950,00 a pagar',
        prompt: 'Como está a projeção de fluxo de caixa para os próximos 7 dias considerando contas a pagar e a receber?',
        category: 'analise',
      },
      {
        id: 'fin-saldo-bancos',
        label: 'Detalhar saldos por banco',
        description: 'Saldo consolidado de R$ 218.886,41 entre Asaas, Santander e Itaú',
        prompt: 'Qual a distribuição do saldo consolidado entre Asaas, Santander e Itaú?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Analisar inadimplência',
      'Extrato Itaú a conciliar',
      'Previsão de caixa da semana',
      'DRE e resultado do mês',
    ],
  },

  'financeiro-receber': {
    route: 'financeiro-receber',
    screenName: 'Contas a Receber',
    contextDescription: 'Controle de recebíveis, títulos a vencer e régua de cobrança',
    badge: 'Crédito & Cobrança',
    primaryAction: {
      id: 'rec-inadimplencia',
      label: 'Analisar inadimplência e clientes em atraso',
      description: 'Avaliar títulos vencidos e emitir alerta de régua de cobrança',
      prompt: 'Quais são as faturas vencidas no momento, valores, tempo de atraso e plano de ação sugerido?',
      badge: 'Alerta de Caixa',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'rec-entradas-semana',
        label: 'Cobranças a vencer esta semana',
        description: 'R$ 38.500,00 distribuídos entre Beta, Vanguard e Delta',
        prompt: 'Liste as faturas com vencimento previsto para os próximos 7 dias.',
        category: 'analise',
      },
      {
        id: 'rec-metodos',
        label: 'Verificar faturas Pix vs Boleto',
        description: 'Identificar taxa de liquidação de Pix vs Boleto no Asaas',
        prompt: 'Qual a proporção de recebimentos via Pix comparado a Boleto e Cartão?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Quem está inadimplente?',
      'Recebimentos desta semana',
      'Disparar lembrete de cobrança',
      'Faturas com vencimento hoje',
    ],
  },

  'financeiro-pagar': {
    route: 'financeiro-pagar',
    screenName: 'Contas a Pagar',
    contextDescription: 'Obrigações operacionais, tributos federais e fornecedores',
    badge: 'Despesas & Tributos',
    primaryAction: {
      id: 'pag-vencimentos',
      label: 'Analisar obrigações a vencer',
      description: 'R$ 37.950,00 pendentes no mês, incluindo DARF e fornecedores',
      prompt: 'Quais contas a pagar vencem nesta semana e há risco de saldo para cobertura?',
      badge: 'Tesouraria',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'pag-tributos',
        label: 'Identificar tributos e DARF',
        description: 'Conferir DARF e impostos federais provisionados',
        prompt: 'Quais impostos e tributos estão programados para pagamento no mês?',
        category: 'analise',
      },
      {
        id: 'pag-fornecedores',
        label: 'Maiores centros de custos',
        description: 'Distribuição de despesas operacionais vs tecnologia',
        prompt: 'Quais são as maiores despesas por categoria este mês?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Contas a pagar esta semana',
      'Ver tributos DARF pendentes',
      'Maiores despesas do mês',
      'Previsão de desembolso',
    ],
  },

  conciliacao: {
    route: 'conciliacao',
    screenName: 'Conciliação Bancária IA',
    contextDescription: 'Importação OFX, pareamento inteligente e baixa automática no Itaú',
    badge: 'Automação Contábil',
    primaryAction: {
      id: 'conc-auto',
      label: 'Conciliar 5 pendências com IA',
      description: 'R$ 60.254,21 em extratos do Itaú com sugestões prontas para baixa',
      prompt: 'Detalhe as 5 transações pendentes de conciliação no Itaú, as categorias sugeridas pela IA e a confiança do match.',
      badge: '95% Match IA',
      category: 'acao',
    },
    secondaryActions: [
      {
        id: 'conc-tarifas',
        label: 'Auditar tarifas bancárias',
        description: 'R$ 3.000,00 em pacote de tarifas PJ identificado no extrato',
        prompt: 'Qual o valor total de tarifas bancárias cobradas no período recente?',
        category: 'analise',
      },
      {
        id: 'conc-divergencias',
        label: 'Verificar divergências de valores',
        description: 'Checar se algum pagamento bancário difere da previsão de contas a pagar',
        prompt: 'Existe alguma divergência entre o extrato bancário e as contas cadastradas?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Como conciliar com IA?',
      'Detalhar 5 pendências Itaú',
      'Auditar tarifas bancárias',
      'Divergências no extrato',
    ],
  },

  clientes: {
    route: 'clientes',
    screenName: 'Carteira de Clientes',
    contextDescription: 'Controle de contas, contratos vinculados, saúde e inadimplência',
    badge: 'Relacionamento & MRR',
    primaryAction: {
      id: 'cli-risco',
      label: 'Identificar clientes em risco ou atraso',
      description: 'Verificar clientes com faturas em aberto e health score em atenção',
      prompt: 'Quais clientes da carteira estão inadimplentes ou com health score crítico, e qual o plano de retenção recomendado?',
      badge: 'Retenção',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'cli-mrr-ranking',
        label: 'Ranking dos maiores clientes por MRR',
        description: 'Visualizar concentração de receita e clientes estratégicos',
        prompt: 'Quais são os 5 maiores clientes em receita recorrente mensal (MRR)?',
        category: 'analise',
      },
      {
        id: 'cli-sem-contrato',
        label: 'Checar clientes sem contrato ativo',
        description: 'Auditar se há clientes com serviços sem contrato formalizado',
        prompt: 'Existe algum cliente ativo sem contrato vigente ou aguardando assinatura?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Quem está inadimplente?',
      'Top 5 clientes por MRR',
      'Clientes em risco de churn',
      'Contratos a renovar',
    ],
  },

  'cliente-detalhe': {
    route: 'cliente-detalhe',
    screenName: 'Detalhe do Cliente',
    contextDescription: 'Histórico financeiro, contratos ativos e comunicação com cliente',
    badge: 'Ficha da Conta',
    primaryAction: {
      id: 'clidet-situacao',
      label: 'Auditar saúde financeira do cliente',
      description: 'Checar histórico de pagamentos, faturas pendentes e pontualidade',
      prompt: 'Qual a situação financeira deste cliente, histórico de pagamentos e pendências no Asaas?',
      badge: 'Diagnóstico',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'clidet-contratos',
        label: 'Verificar vigência e reajuste contratual',
        description: 'Data de término do contrato e cláusula de reajuste IPCA',
        prompt: 'Quando vence o contrato deste cliente e quando ocorre o próximo reajuste?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Histórico de pagamentos',
      'Status no Asaas',
      'Vigência do contrato',
      'Reajuste contratual',
    ],
  },

  inadimplentes: {
    route: 'inadimplentes',
    screenName: 'Gestão de Inadimplência',
    contextDescription: 'Controle de títulos vencidos, régua de cobrança automática e acordos',
    badge: 'Cobrança & Recuperação',
    primaryAction: {
      id: 'inad-recuperacao',
      label: 'Estratégia de recuperação de crédito',
      description: 'Analisar títulos em aberto e recomendar ações de régua e acordos Pix',
      prompt: 'Qual o valor total inadimplente, quais contas são prioritárias para contato e quais canais de cobrança utilizar?',
      badge: 'Urgente',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'inad-regua-asaas',
        label: 'Ver status da régua no Asaas',
        description: 'Notificações via WhatsApp, SMS e e-mail disparadas pelo Asaas',
        prompt: 'Como está o status das notificações automáticas da régua do Asaas para os inadimplentes?',
        category: 'acao',
      },
    ],
    quickChips: [
      'Total em atraso',
      'Disparar régua Asaas',
      'Clientes críticos >30 dias',
      'Simular proposta de acordo',
    ],
  },

  contratos: {
    route: 'contratos',
    screenName: 'Gestão de Contratos',
    contextDescription: 'Controle de contratos e reajustes periódicos',
    badge: 'Jurídico & Receita',
    primaryAction: {
      id: 'ctr-vencendo',
      label: 'Auditar contratos prestes a vencer',
      description: 'Identificar contratos com término nos próximos 60 dias para renovação',
      prompt: 'Quais contratos estão próximos do vencimento e precisam de proposta de renovação?',
      badge: 'Renovação',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'ctr-assinatura',
        label: 'Contratos pendentes de revisão',
        description: 'Checar minutas enviadas que ainda não foram assinadas pelas partes',
        prompt: 'Quais contratos estão aguardando revisão e há quantos dias?',
        category: 'acao',
      },
      {
        id: 'ctr-reajuste',
        label: 'Calcular reajustes pelo IPCA',
        description: 'Contratos que completam 12 meses e exigem aplicação de índice',
        prompt: 'Quais contratos têm cláusula de reajuste anual por índice inflacionário?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Contratos a vencer em 60 dias',
      'Pendentes de revisão',
      'Reajustes IPCA previstos',
      'MRR total sob contrato',
    ],
  },

  'contrato-detalhe': {
    route: 'contrato-detalhe',
    screenName: 'Detalhe do Contrato',
    contextDescription: 'Cláusulas, assinaturas eletrônicas e emissão recorrente de faturas',
    badge: 'Contrato Ativo',
    primaryAction: {
      id: 'ctrdet-status',
      label: 'Checar status de assinatura e faturamento',
      description: 'Validar se a assinatura está concluída e se o Asaas está configurado',
      prompt: 'Este contrato está ativo e possui recorrência criada no Asaas?',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'ctrdet-renovacao',
        label: 'Verificar prazo de rescisão e aviso prévio',
        description: 'Cláusulas de fidelidade, multas e aviso prévio',
        prompt: 'Quais são as condições de renovação e rescisão deste contrato?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Status do contrato',
      'Cobrança recorrente Asaas',
      'Regra de reajuste',
      'Prazo de vigência',
    ],
  },

  pipeline: {
    route: 'pipeline',
    screenName: 'Pipeline de Oportunidades',
    contextDescription: 'Funil de vendas, propostas enviadas e previsão de novo faturamento',
    badge: 'Comercial & Vendas',
    primaryAction: {
      id: 'pip-priorizar',
      label: 'Qualificar oportunidades de maior valor',
      description: 'Identificar negócios em fase de proposta com alta probabilidade',
      prompt: 'Quais propostas comerciais no funil têm maior potencial de fechamento este mês e qual a receita esperada?',
      badge: 'Conversão',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'pip-conversao',
        label: 'Calcular taxa de conversão do funil',
        description: 'Desempenho de qualificação até fechamento de contrato',
        prompt: 'Qual o valor total ponderado do pipeline de vendas hoje e gargalos no funil?',
        category: 'analise',
      },
      {
        id: 'pip-estagnadas',
        label: 'Alertar sobre negócios sem contato',
        description: 'Propostas enviadas sem resposta há mais de 5 dias úteis',
        prompt: 'Há alguma oportunidade estagnada sem follow-up recente no pipeline?',
        category: 'acao',
      },
    ],
    quickChips: [
      'Oportunidades quentes',
      'Valor total do funil',
      'Propostas aguardando resposta',
      'Previsão de novo MRR',
    ],
  },

  'notas-cobrancas': {
    route: 'notas-cobrancas',
    screenName: 'Notas Fiscais & Cobranças Asaas',
    contextDescription: 'Emissão de NFS-e, boletos bancários, Pix cobrança e webhooks',
    badge: 'Faturamento Asaas',
    primaryAction: {
      id: 'not-inadimplencia',
      label: 'Auditar faturas Asaas vencidas',
      description: 'Identificar boletos/Pix em atraso e acionar régua de cobrança',
      prompt: 'Quais cobranças no Asaas estão com status VENCIDA ou com falha de pagamento?',
      badge: 'Recuperação',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'not-nfse-pendente',
        label: 'Verificar notas fiscais pendentes',
        description: 'Recebimentos confirmados que necessitam de emissão de NFS-e',
        prompt: 'Há alguma cobrança recebida que ainda não teve a respectiva NFS-e emitida?',
        category: 'acao',
      },
      {
        id: 'not-saldo-asaas',
        label: 'Verificar saldo disponível para saque',
        description: 'R$ 142.320,00 na conta digital Asaas prontos para transferência TED/PIX',
        prompt: 'Qual o saldo atual disponível na conta Asaas e previsão de repasses?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Cobranças Asaas vencidas',
      'NFS-e pendentes de emissão',
      'Saldo disponível no Asaas',
      'Simular antecipação de Pix',
    ],
  },

  dashboard: {
    route: 'dashboard',
    screenName: 'Painel Geral da Operação',
    contextDescription: 'Visão executiva integrada de clientes, finanças e contratos',
    badge: 'Painel Executivo',
    primaryAction: {
      id: 'dash-inadimplencia',
      label: 'Analisar inadimplência da operação',
      description: 'Avaliar R$ 14.500,00 em atraso (Alpha Tech) e impacto na saúde do negócio',
      prompt: 'Faça um resumo executivo da inadimplência atual e principais alertas operacionais do dia.',
      badge: 'Ação Recomendada',
      targetRoute: 'financeiro',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'dash-conciliacao',
        label: 'Resolver 5 conciliações pendentes',
        description: 'R$ 60.254,21 aguardando baixa no Itaú',
        prompt: 'Quais são as conciliações bancárias mais urgentes para fechar o caixa?',
        targetRoute: 'conciliacao',
        category: 'acao',
      },
      {
        id: 'dash-resumo-dia',
        label: 'Resumo executivo do dia',
        description: 'Saldos, recebíveis previstos e contratos aguardando assinatura',
        prompt: 'Apresente o resumo consolidado de saldos, faturamento previsto e principais pendências.',
        category: 'analise',
      },
    ],
    quickChips: [
      'Analisar inadimplência',
      'Extrato Itaú a conciliar',
      'Qual o saldo consolidado?',
      'Receitas da semana',
    ],
  },

  acoes: {
    route: 'acoes',
    screenName: 'Central de Ações',
    contextDescription: 'Fila unificada de tarefas pendentes, aprovações e pendências',
    badge: 'Fila de Trabalho',
    primaryAction: {
      id: 'act-prioridades',
      label: 'Organizar tarefas por impacto financeiro',
      description: 'Priorizar cobranças em atraso e conciliações pendentes',
      prompt: 'Quais são as 3 ações com maior impacto financeiro imediato para executar agora?',
      badge: 'Produtividade',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'act-cobrancas',
        label: 'Disparar régua para inadimplentes',
        description: 'Reenviar cobrança amigável para faturas com mais de 7 dias de atraso',
        prompt: 'Como disparar a régua de cobrança para os clientes em atraso?',
        category: 'acao',
      },
    ],
    quickChips: [
      'Top 3 prioridades do dia',
      'Cobranças em atraso',
      'Conciliações pendentes',
      'Contratos para assinar',
    ],
  },

  automacoes: {
    route: 'automacoes',
    screenName: 'Regras & Automações',
    contextDescription: 'Gatilhos automáticos de cobrança, conciliação e assinatura',
    badge: 'Workflows',
    primaryAction: {
      id: 'aut-regua',
      label: 'Auditar régua de cobrança automática',
      description: 'Verificar se os lembretes automáticos D-3, D0 e D+3 estão ativos',
      prompt: 'A régua de cobrança automática por WhatsApp e e-mail está configurada para todos os clientes?',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'aut-conciliacao-regra',
        label: 'Regras de conciliação com IA',
        description: 'Parametrização do índice de confiança para baixa automática',
        prompt: 'Como funciona o limiar de confiança da IA na conciliação bancária automática?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Status da régua de cobrança',
      'Regras ativas no sistema',
      'Automação de NFS-e',
      'Gatilhos de contratos',
    ],
  },

  integracoes: {
    route: 'integracoes',
    screenName: 'Central de Integrações',
    contextDescription: 'Conectores Asaas e Itaú Open Finance',
    badge: 'Conectores & APIs',
    primaryAction: {
      id: 'int-status',
      label: 'Checar saúde das integrações e webhooks',
      description: 'Validar conexão com Asaas e banco Itaú',
      prompt: 'Como está o status de comunicação das APIs do Asaas e Itaú?',
      badge: 'Conectividade',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'int-webhook-asaas',
        label: 'Verificar fila de webhooks Asaas',
        description: 'Auditar eventos de PAYMENT_RECEIVED e PAYMENT_OVERDUE',
        prompt: 'Os webhooks de baixa de pagamento do Asaas estão operando normalmente?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Status das integrações',
      'Webhooks do Asaas',
      'Conexão Asaas',
      'Open Finance Itaú',
    ],
  },

  'integracao-detalhe': {
    route: 'integracao-detalhe',
    screenName: 'Detalhe da Integração',
    contextDescription: 'Logs técnicos de requisições, chaves e credenciais seguras',
    badge: 'Diagnóstico de API',
    primaryAction: {
      id: 'intdet-testar',
      label: 'Testar conexão de endpoint',
      description: 'Executar ping de teste e validação de credencial',
      prompt: 'Esta integração está respondendo com código 200 e recebendo dados atualizados?',
      category: 'acao',
    },
    secondaryActions: [],
    quickChips: ['Testar conexão', 'Ver logs recentes', 'Webhooks recebidos'],
  },

  relatorios: {
    route: 'relatorios',
    screenName: 'Relatórios & DRE Gerencial',
    contextDescription: 'Demonstrativos de resultado, balancetes e indicadores de margem',
    badge: 'Inteligência Financeira',
    primaryAction: {
      id: 'rel-dre',
      label: 'Gerar análise de DRE do mês',
      description: 'Consolidar receitas faturadas, custos operacionais e margem líquida',
      prompt: 'Apresente uma análise resumida da DRE gerencial do mês atual com receitas, despesas e resultado operacional.',
      badge: 'DRE Consolidada',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'rel-inadimplencia-hist',
        label: 'Evolução da taxa de inadimplência',
        description: 'Comparativo de atrasos nos últimos 90 dias',
        prompt: 'Qual tem sido a taxa de inadimplência média da carteira nos últimos meses?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Resumo da DRE do mês',
      'Taxa de inadimplência',
      'Margem de lucro operacional',
      'Exportar demonstrativo',
    ],
  },

  'assistente-ia': {
    route: 'assistente-ia',
    screenName: 'Assistente IA',
    contextDescription: 'Consulta livre aos dados da operação e execução de comandos',
    badge: 'Copiloto Geral',
    primaryAction: {
      id: 'ast-saldo',
      label: 'Consultar saldo e situação consolidada',
      description: 'Saldo consolidado, inadimplência e conciliações em aberto',
      prompt: 'Qual o meu saldo do mês e quais são as principais pendências da empresa?',
      category: 'analise',
    },
    secondaryActions: [
      {
        id: 'ast-inadimpl',
        label: 'Quem está inadimplente?',
        description: 'Clientes em atraso e valores',
        prompt: 'Quem está inadimplente no momento?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Qual o meu saldo do mês?',
      'Quem está inadimplente?',
      'Quanto tenho a receber essa semana?',
      'Quais lançamentos estão pendentes de conciliação?',
    ],
  },

  configuracoes: {
    route: 'configuracoes',
    screenName: 'Configurações do Sistema',
    contextDescription: 'Preferências da empresa, dados cadastrais e permissões de usuários',
    badge: 'Administração',
    primaryAction: {
      id: 'cfg-alertas',
      label: 'Configurar limites de alerta de inadimplência',
      description: 'Definir tolerância de dias de atraso e notificações automáticas',
      prompt: 'Como configurar as notificações e regras de alerta de inadimplência no sistema?',
      category: 'acao',
    },
    secondaryActions: [
      {
        id: 'cfg-seguranca',
        label: 'Revisar chaves de integração e segurança',
        description: 'Checar se as variáveis de ambiente das APIs estão ativas',
        prompt: 'Quais chaves de API estão conectadas com segurança no sistema?',
        category: 'analise',
      },
    ],
    quickChips: [
      'Alertas de inadimplência',
      'Configurações de e-mail',
      'Chaves de API seguras',
      'Permissões de acesso',
    ],
  },
};

export function getRouteAssistantConfig(route: RouteId): RouteAssistantConfig {
  return ROUTE_ASSISTANT_CONFIGS[route] || ROUTE_ASSISTANT_CONFIGS.dashboard!;
}
