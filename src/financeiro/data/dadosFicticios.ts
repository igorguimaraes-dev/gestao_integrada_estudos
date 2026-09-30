import {
  ContaBancaria,
  Categoria,
  Cliente,
  Fornecedor,
  Lancamento,
  CartaoCredito,
  ReembolsoSocio,
  CenarioSimulacao,
  MetaOrcamento,
  RegraExtrato,
  ConfiguracoesGerais,
} from '../types';
import { CATEGORIAS_PADRAO } from '../utils/constants';

/**
 * Gerador de Dados Fictícios Realistas para Agência de Marketing Digital ("Nexus Growth")
 * Popula todas as telas com métricas, fluxo de caixa, DRE, conciliação e cartões.
 */
export function gerarDadosFicticios() {
  const dataHoje = new Date();
  const ano = dataHoje.getFullYear(); // 2026

  // Helper para formatar YYYY-MM
  const formatAnoMes = (mesNum: number): string => {
    return `${ano}-${String(mesNum).padStart(2, '0')}`;
  };

  // Helper para formatar YYYY-MM-DD
  const formatData = (mesNum: number, diaNum: number): string => {
    return `${ano}-${String(mesNum).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
  };

  // 1. Contas Bancárias
  const contas: ContaBancaria[] = [
    {
      id: 'conta_itau',
      nome: 'Itaú Empresas - CC Principal',
      banco: 'Itaú Unibanco (341)',
      tipo: 'corrente',
      saldoInicial: 4850000, // R$ 48.500,00
      dataSaldoInicial: `${ano}-01-01`,
      cor: '#f97316',
      corHex: '#f97316',
      ativa: true,
      saldoRealBancoMensal: {
        [formatAnoMes(8)]: 5824000, // R$ 58.240,00
        [formatAnoMes(9)]: 5412000, // R$ 54.120,00
      },
    },
    {
      id: 'conta_nubank',
      nome: 'Nubank PJ - Movimentações & Pix',
      banco: 'Nu Pagamentos (260)',
      tipo: 'corrente',
      saldoInicial: 1825000, // R$ 18.250,00
      dataSaldoInicial: `${ano}-01-01`,
      cor: '#8b5cf6',
      corHex: '#8b5cf6',
      ativa: true,
      saldoRealBancoMensal: {
        [formatAnoMes(8)]: 2140000,
        [formatAnoMes(9)]: 1980000,
      },
    },
    {
      id: 'conta_inter',
      nome: 'Inter PJ - Reserva de Emergência 100% CDI',
      banco: 'Banco Inter (077)',
      tipo: 'investimento',
      saldoInicial: 4500000, // R$ 45.000,00
      dataSaldoInicial: `${ano}-01-01`,
      cor: '#f59e0b',
      corHex: '#f59e0b',
      ativa: true,
      saldoRealBancoMensal: {
        [formatAnoMes(8)]: 4835000,
        [formatAnoMes(9)]: 4910000,
      },
    },
  ];

  // 2. Cartões de Crédito Corporativos
  const cartoes: CartaoCredito[] = [
    {
      id: 'cartao_nubank_pj',
      nome: 'Nubank PJ Mastercard Black',
      bandeira: 'Mastercard',
      limite: 3000000, // R$ 30.000,00
      limiteTotal: 3000000,
      diaFechamento: 3,
      diaVencimento: 10,
      contaPagamentoId: 'conta_nubank',
      ativa: true,
    },
    {
      id: 'cartao_itau_corp',
      nome: 'Itaú Corporate Visa Platinum',
      bandeira: 'Visa',
      limite: 5000000, // R$ 50.000,00
      limiteTotal: 5000000,
      diaFechamento: 15,
      diaVencimento: 22,
      contaPagamentoId: 'conta_itau',
      ativa: true,
    },
  ];

  // 3. Clientes (Contratos de Agência / Retainers Mensais)
  const clientes: Cliente[] = [
    {
      id: 'cli_vanguarda',
      nomeRazaoSocial: 'Vanguarda Cosméticos & Skincare Ltda',
      nomeFantasia: 'Vanguarda Cosméticos',
      cnpjCpf: '28.492.184/0001-92',
      contato: 'Renata Faria',
      contatoResponsavel: 'Renata Faria (Head de Marketing)',
      email: 'renata@vanguardacosmeticos.com.br',
      emailFinanceiro: 'financeiro@vanguardacosmeticos.com.br',
      telefone: '(11) 98123-4567',
      planoServico: 'Gestão de Tráfego Pago + Social Media',
      valorMensal: 1250000, // R$ 12.500,00
      diaVencimento: 10,
      dataInicio: `${ano - 1}-03-10`,
      status: 'ativo',
      indiceReajuste: 'IPCA',
      mesReajuste: 3,
      percentualReajuste: 4.5,
      renovacaoAutomatica: true,
      observacoes: 'Contrato com fee fixo mensal e reunião quinzenal de alinhamento de ROAS.',
    },
    {
      id: 'cli_horizonte',
      nomeRazaoSocial: 'Horizonte Real Estate & Incorporações SA',
      nomeFantasia: 'Construtora Horizonte',
      cnpjCpf: '19.340.581/0001-44',
      contato: 'Eduardo Antunes',
      contatoResponsavel: 'Eduardo Antunes (Diretor Comercial)',
      email: 'eduardo@horizonterealestate.com.br',
      emailFinanceiro: 'contasapagar@horizonterealestate.com.br',
      telefone: '(11) 99345-6789',
      planoServico: 'Full Marketing: Branding, Tráfego e Landing Pages',
      valorMensal: 1800000, // R$ 18.000,00
      diaVencimento: 15,
      dataInicio: `${ano - 1}-06-15`,
      status: 'ativo',
      indiceReajuste: 'IGP-M',
      mesReajuste: 6,
      percentualReajuste: 5.0,
      renovacaoAutomatica: true,
      observacoes: 'Maior conta da agência. Lançamentos imobiliários de alto padrão.',
    },
    {
      id: 'cli_techpulse',
      nomeRazaoSocial: 'TechPulse Soluções SaaS & Cloud Ltda',
      nomeFantasia: 'TechPulse SaaS',
      cnpjCpf: '34.502.918/0001-10',
      contato: 'Guilherme Baccaro',
      contatoResponsavel: 'Guilherme Baccaro (CEO)',
      email: 'guilherme@techpulse.io',
      emailFinanceiro: 'billing@techpulse.io',
      telefone: '(11) 97722-1100',
      planoServico: 'Aquisição B2B & Otimização de Conversão (CRO)',
      valorMensal: 980000, // R$ 9.800,00
      diaVencimento: 5,
      dataInicio: `${ano}-02-05`,
      status: 'ativo',
      indiceReajuste: 'IPCA',
      mesReajuste: 2,
      renovacaoAutomatica: true,
    },
    {
      id: 'cli_odontoprime',
      nomeRazaoSocial: 'OdontoPrime Clínica Integrada e Estética ME',
      nomeFantasia: 'Clínica OdontoPrime',
      cnpjCpf: '41.982.330/0001-78',
      contato: 'Dra. Patrícia Meireles',
      contatoResponsavel: 'Dra. Patrícia Meireles',
      email: 'patricia@odontoprime.com.br',
      emailFinanceiro: 'financeiro@odontoprime.com.br',
      telefone: '(11) 98456-1234',
      planoServico: 'Tráfego Pago Local & Captação de Pacientes',
      valorMensal: 550000, // R$ 5.500,00
      diaVencimento: 20,
      dataInicio: `${ano - 1}-09-20`,
      status: 'ativo',
      indiceReajuste: 'IPCA',
      renovacaoAutomatica: true,
    },
    {
      id: 'cli_graonobre',
      nomeRazaoSocial: 'Grão Nobre Cafés Especiais Franquia Ltda',
      nomeFantasia: 'Café Grão Nobre',
      cnpjCpf: '50.123.456/0001-32',
      contato: 'Marcelo Rossi',
      contatoResponsavel: 'Marcelo Rossi (Sócio)',
      email: 'marcelo@graonobre.com.br',
      emailFinanceiro: 'adm@graonobre.com.br',
      telefone: '(11) 99112-3344',
      planoServico: 'Social Media, Reels & Branding',
      valorMensal: 420000, // R$ 4.200,00
      diaVencimento: 25,
      dataInicio: `${ano - 1}-11-25`,
      status: 'ativo',
      indiceReajuste: 'IPCA',
      renovacaoAutomatica: true,
    },
    {
      id: 'cli_lumina',
      nomeRazaoSocial: 'Lúmina Fashion & Acessórios Eireli',
      nomeFantasia: 'Lúmina Moda',
      cnpjCpf: '38.771.290/0001-05',
      contato: 'Fernanda Lins',
      contatoResponsavel: 'Fernanda Lins',
      email: 'fernanda@luminamoda.com.br',
      emailFinanceiro: 'financeiro@luminamoda.com.br',
      telefone: '(21) 98877-6655',
      planoServico: 'E-commerce & Mídia Paga',
      valorMensal: 700000, // R$ 7.000,00
      diaVencimento: 8,
      dataInicio: `${ano - 2}-10-08`,
      status: 'pausado',
      observacoes: 'Contrato pausado temporariamente durante reformulação de fornecedores.',
    },
  ];

  // 4. Fornecedores / Prestadores PJ (Equipe da Agência)
  const fornecedores: Fornecedor[] = [
    {
      id: 'forn_lucas',
      nome: 'Lucas Mendonça',
      razaoSocial: 'Lucas Mendonça Design & UI ME',
      cnpjCpf: '31.456.789/0001-22',
      funcao: 'Designer',
      chavePix: 'lucas.designer@gmail.com',
      tipoChavePix: 'email',
      banco: 'Nubank (260)',
      agencia: '0001',
      conta: '1234567-8',
      email: 'lucas.designer@gmail.com',
      telefone: '(11) 98765-4321',
      valorMensalCombinado: 550000, // R$ 5.500,00
      valorPadrao: 550000,
      diaPagamento: 5,
      diaPagamentoPadrao: 5,
      tipoRemuneracao: 'mensal',
      status: 'ativo',
      ativo: true,
      observacoes: 'Designer sênior responsável pela identidade visual e criativos.',
    },
    {
      id: 'forn_mariana',
      nome: 'Mariana Duarte',
      razaoSocial: 'MD Performance & Growth Ltda',
      cnpjCpf: '42.110.987/0001-65',
      funcao: 'Gestor de Tráfego',
      chavePix: 'mariana.traffic@growth.io',
      tipoChavePix: 'email',
      banco: 'Banco Inter (077)',
      agencia: '0001',
      conta: '987654-3',
      email: 'mariana.traffic@growth.io',
      telefone: '(11) 97654-3210',
      valorMensalCombinado: 620000, // R$ 6.200,00
      valorPadrao: 620000,
      diaPagamento: 5,
      diaPagamentoPadrao: 5,
      tipoRemuneracao: 'mensal',
      status: 'ativo',
      ativo: true,
      observacoes: 'Gestão direta de contas de anúncios Meta Ads, Google Ads e TikTok.',
    },
    {
      id: 'forn_rafael',
      nome: 'Rafael Silveira',
      razaoSocial: 'Silveira Web Development ME',
      cnpjCpf: '29.876.543/0001-11',
      funcao: 'Desenvolvimento',
      chavePix: '29.876.543/0001-11',
      tipoChavePix: 'cnpj',
      banco: 'Itaú (341)',
      agencia: '1420',
      conta: '55432-1',
      email: 'rafael@silveira.dev',
      telefone: '(11) 96543-2109',
      valorMensalCombinado: 480000, // R$ 4.800,00
      valorPadrao: 480000,
      diaPagamento: 10,
      diaPagamentoPadrao: 10,
      tipoRemuneracao: 'mensal',
      status: 'ativo',
      ativo: true,
      observacoes: 'Desenvolvimento e manutenção de Landing Pages no Webflow e Next.js.',
    },
    {
      id: 'forn_camila',
      nome: 'Camila Siqueira',
      razaoSocial: 'CS Copy & Content Ltda',
      cnpjCpf: '36.222.111/0001-99',
      funcao: 'Marketing',
      chavePix: 'camila.copywriter@gmail.com',
      tipoChavePix: 'email',
      banco: 'C6 Bank (336)',
      agencia: '0001',
      conta: '887766-5',
      email: 'camila.copywriter@gmail.com',
      telefone: '(11) 95432-1098',
      valorMensalCombinado: 400000, // R$ 4.000,00
      valorPadrao: 400000,
      diaPagamento: 5,
      diaPagamentoPadrao: 5,
      tipoRemuneracao: 'mensal',
      status: 'ativo',
      ativo: true,
      observacoes: 'Redação de copies para criativos, e-mails de nutrição e roteiros de vídeo.',
    },
    {
      id: 'forn_studio_apex',
      nome: 'Studio Apex Audiovisual',
      razaoSocial: 'Apex Filmes & Produção ME',
      cnpjCpf: '18.333.444/0001-55',
      funcao: 'Marketing',
      chavePix: '18.333.444/0001-55',
      tipoChavePix: 'cnpj',
      banco: 'Bradesco (237)',
      valorMensalCombinado: 250000, // R$ 2.500,00
      valorPadrao: 250000,
      diaPagamento: 15,
      diaPagamentoPadrao: 15,
      tipoRemuneracao: 'projeto',
      status: 'ativo',
      ativo: true,
      observacoes: 'Captação e edição profissional de vídeos e podcasts para clientes.',
    },
  ];

  // 5. Reembolsos e Empréstimos de Sócios
  const reembolsos: ReembolsoSocio[] = [
    {
      id: 'reemb_socio_rodrigo',
      credor: 'Rodrigo Guimarães (Sócio-Diretor)',
      socioNome: 'Rodrigo Guimarães (Sócio-Diretor)',
      descricao: 'Aporte de Capital de Giro Inicial da Agência',
      valorInvestido: 3000000, // R$ 30.000,00
      valor: 3000000,
      data: `${ano - 1}-06-01`,
      tipo: 'emprestimo_socio',
      status: 'em_aberto',
      saldoReembolsar: 1800000, // Restam R$ 18.000,00
      planoDevolucao: {
        parcelas: 10,
        valorParcela: 300000, // R$ 3.000,00
        dataInicio: `${ano - 1}-07-10`,
      },
      devolucoesPagas: [
        { id: 'dev_1', data: `${ano - 1}-07-10`, valor: 300000, contaBancariaId: 'conta_itau' },
        { id: 'dev_2', data: `${ano - 1}-08-10`, valor: 300000, contaBancariaId: 'conta_itau' },
        { id: 'dev_3', data: `${ano - 1}-09-10`, valor: 300000, contaBancariaId: 'conta_itau' },
        { id: 'dev_4', data: `${ano - 1}-10-10`, valor: 300000, contaBancariaId: 'conta_itau' },
      ],
    },
    {
      id: 'reemb_socia_juliana',
      credor: 'Juliana Prado (Sócia de Operações)',
      socioNome: 'Juliana Prado (Sócia de Operações)',
      descricao: 'Compra de 2 Monitores 4K Dell para Estação de Criação',
      valorInvestido: 349000, // R$ 3.490,00
      valor: 349000,
      data: formatData(8, 14),
      tipo: 'reembolso',
      status: 'pago',
      dataLiquidacao: formatData(8, 20),
      comprovanteNome: 'nf_dell_monitores.pdf',
    },
    {
      id: 'reemb_rd_summit',
      credor: 'Rodrigo Guimarães (Sócio-Diretor)',
      socioNome: 'Rodrigo Guimarães (Sócio-Diretor)',
      descricao: 'Passagens e Hospedagem - Evento RD Summit',
      valorInvestido: 215000, // R$ 2.150,00
      valor: 215000,
      data: formatData(9, 2),
      tipo: 'reembolso',
      status: 'pendente',
      comprovanteNome: 'recibo_latam_hotel.pdf',
    },
  ];

  // 6. Metas Orçamentárias
  const metas: MetaOrcamento[] = [
    {
      id: 'meta_rec_branding',
      categoriaId: 'cat_rec_branding',
      subcategoria: 'Branding',
      mes: 'global',
      tetoCents: 1800000,
      valorOrcado: 1800000,
    },
    {
      id: 'meta_rec_trafego',
      categoriaId: 'cat_rec_trafego',
      subcategoria: 'Tráfego Pago',
      mes: 'global',
      tetoCents: 2800000,
      valorOrcado: 2800000,
    },
    {
      id: 'meta_rec_social',
      categoriaId: 'cat_rec_social',
      subcategoria: 'Social Media',
      mes: 'global',
      tetoCents: 1500000,
      valorOrcado: 1500000,
    },
    {
      id: 'meta_desp_equipe',
      categoriaId: 'cat_desp_eq_marketing',
      subcategoria: 'Marketing',
      mes: 'global',
      tetoCents: 2300000,
      valorOrcado: 2300000,
    },
    {
      id: 'meta_desp_softwares',
      categoriaId: 'cat_desp_op_softwares',
      subcategoria: 'Aplicativos/Softwares',
      mes: 'global',
      tetoCents: 350000,
      valorOrcado: 350000,
    },
  ];

  // 7. Cenário de Simulação ("What-If")
  const cenarios: CenarioSimulacao[] = [
    {
      id: 'cenario_expansao_q4',
      nome: 'Expansão Q4: 2 Contratos Enterprise + Head de Performance',
      horizonte: 12,
      premissas: {
        crescimentoReceitaMensalPct: 15,
        reajusteDespesasPct: 5,
        inadimplenciaPct: 2,
        impostoEstimadoPct: 6,
        churnPct: 1,
      },
      itensHipoteticos: [
        {
          id: 'item_hip_1',
          tipo: 'novo_cliente',
          descricao: 'Novo Cliente Enterprise - Rede Farmacêutica (Fee R$ 15k/mês)',
          valorMensalCents: 1500000,
          mesInicioRelativo: 1,
          aplicado: true,
        },
        {
          id: 'item_hip_2',
          tipo: 'novo_cliente',
          descricao: 'Novo Cliente - Indústria de Alimentos (Fee R$ 10k/mês)',
          valorMensalCents: 1000000,
          mesInicioRelativo: 2,
          aplicado: true,
        },
        {
          id: 'item_hip_3',
          tipo: 'contratar_prestador',
          descricao: 'Contratação Head de Performance & Tráfego Sênior',
          valorMensalCents: 850000,
          mesInicioRelativo: 1,
          aplicado: true,
        },
      ],
      createdAt: `${ano}-08-15`,
    },
  ];

  // 8. Regras de Extrato Bancário
  const regrasExtrato: RegraExtrato[] = [
    {
      id: 'regra_notion',
      textoContem: 'NOTION LABS',
      categoriaId: 'cat_desp_op_softwares',
      subcategoria: 'Aplicativos/Softwares',
      tipo: 'despesa',
    },
    {
      id: 'regra_google',
      textoContem: 'GOOGLE CLOUD',
      categoriaId: 'cat_desp_op_softwares',
      subcategoria: 'Aplicativos/Softwares',
      tipo: 'despesa',
    },
    {
      id: 'regra_pix_mariana',
      textoContem: 'MARIANA DUARTE',
      categoriaId: 'cat_desp_eq_gestor',
      subcategoria: 'Gestor de Tráfego',
      tipo: 'despesa',
    },
    {
      id: 'regra_simples',
      textoContem: 'SIMPLES NACIONAL',
      categoriaId: 'cat_desp_op_impostos',
      subcategoria: 'Impostos',
      tipo: 'despesa',
    },
  ];

  // 9. Configurações Gerais
  const configuracoes: ConfiguracoesGerais = {
    horizonteProjecao: 24,
    toleranciaDivergenciaPct: 5,
    saldoMinimoSegurancaCents: 2000000, // R$ 20.000,00
    impostoPadraoPct: 6,
    dadosEmpresa: {
      nome: 'Nexus Growth & Marketing Digital Ltda',
      cnpj: '32.145.890/0001-40',
      razaoSocial: 'Nexus Growth Agência de Publicidade Ltda',
      email: 'contato@nexusgrowth.com.br',
      telefone: '(11) 3450-8800',
    },
    tagsDisponiveis: [
      'Fee Mensal',
      'Contrato Anual',
      'Equipe PJ',
      'Softwares',
      'Impostos',
      'Fixa',
      'Variável',
      'Fatura de Cartão',
      'Reembolso de Sócio',
      'Setup',
    ],
  };

  // 10. Gerar Lançamentos Mensais (Julho, Agosto, Setembro [mês atual], Outubro, Novembro, Dezembro)
  const lancamentos: Lancamento[] = [];
  const mesesHistorico = [7, 8];
  const mesAtual = 9; // Setembro
  const mesesFuturos = [10, 11, 12];

  // Função auxiliar para injetar lançamentos recorrentes
  const gerarCicloMes = (mesNum: number, isHistorico: boolean, isAtual: boolean) => {
    const comp = formatAnoMes(mesNum);

    // --- RECEITAS DE CLIENTES ---
    // 1. Vanguarda Cosméticos (R$ 12.500) - Dia 10
    const vencVang = formatData(mesNum, 10);
    const pagoVang = isHistorico || (isAtual && dataHoje.getDate() >= 10);
    lancamentos.push({
      id: `lanc_rec_vang_${mesNum}`,
      tipo: 'receita',
      descricao: 'Mensalidade Fee: Vanguarda Cosméticos (Tráfego + Social)',
      categoriaId: 'cat_rec_trafego',
      subcategoria: 'Tráfego Pago',
      grupo: 'Receitas',
      clienteId: 'cli_vanguarda',
      contaBancariaId: 'conta_itau',
      mesCompetencia: comp,
      dataVencimento: vencVang,
      dataPagamento: pagoVang ? vencVang : undefined,
      valorOrcado: 1250000,
      valorRealizado: pagoVang ? 1250000 : undefined,
      formaPagamento: 'pix',
      status: pagoVang ? 'realizado' : 'previsto',
      conciliado: pagoVang,
      tags: ['Fee Mensal', 'Contrato Anual'],
    });

    // 2. Construtora Horizonte (R$ 18.000) - Dia 15
    const vencHoriz = formatData(mesNum, 15);
    const pagoHoriz = isHistorico || (isAtual && dataHoje.getDate() >= 15);
    lancamentos.push({
      id: `lanc_rec_horiz_${mesNum}`,
      tipo: 'receita',
      descricao: 'Mensalidade Fee: Construtora Horizonte (Full Marketing)',
      categoriaId: 'cat_rec_branding',
      subcategoria: 'Branding',
      grupo: 'Receitas',
      clienteId: 'cli_horizonte',
      contaBancariaId: 'conta_itau',
      mesCompetencia: comp,
      dataVencimento: vencHoriz,
      dataPagamento: pagoHoriz ? vencHoriz : undefined,
      valorOrcado: 1800000,
      valorRealizado: pagoHoriz ? 1800000 : undefined,
      formaPagamento: 'transferencia',
      status: pagoHoriz ? 'realizado' : 'previsto',
      conciliado: pagoHoriz,
      tags: ['Fee Mensal', 'Contrato Anual'],
    });

    // 3. TechPulse SaaS (R$ 9.800) - Dia 05
    const vencTech = formatData(mesNum, 5);
    const pagoTech = isHistorico || (isAtual && dataHoje.getDate() >= 5);
    lancamentos.push({
      id: `lanc_rec_tech_${mesNum}`,
      tipo: 'receita',
      descricao: 'Mensalidade Fee: TechPulse SaaS (Aquisição & CRO)',
      categoriaId: 'cat_rec_trafego',
      subcategoria: 'Tráfego Pago',
      grupo: 'Receitas',
      clienteId: 'cli_techpulse',
      contaBancariaId: 'conta_nubank',
      mesCompetencia: comp,
      dataVencimento: vencTech,
      dataPagamento: pagoTech ? vencTech : undefined,
      valorOrcado: 980000,
      valorRealizado: pagoTech ? 980000 : undefined,
      formaPagamento: 'pix',
      status: pagoTech ? 'realizado' : 'previsto',
      conciliado: pagoTech,
      tags: ['Fee Mensal'],
    });

    // 4. Clínica OdontoPrime (R$ 5.500) - Dia 20
    const vencOdonto = formatData(mesNum, 20);
    const pagoOdonto = isHistorico || (isAtual && dataHoje.getDate() >= 20);
    lancamentos.push({
      id: `lanc_rec_odonto_${mesNum}`,
      tipo: 'receita',
      descricao: 'Mensalidade Fee: Clínica OdontoPrime (Marketing Local)',
      categoriaId: 'cat_rec_social',
      subcategoria: 'Social Media',
      grupo: 'Receitas',
      clienteId: 'cli_odontoprime',
      contaBancariaId: 'conta_nubank',
      mesCompetencia: comp,
      dataVencimento: vencOdonto,
      dataPagamento: pagoOdonto ? vencOdonto : undefined,
      valorOrcado: 550000,
      valorRealizado: pagoOdonto ? 550000 : undefined,
      formaPagamento: 'boleto',
      status: pagoOdonto ? 'realizado' : 'previsto',
      conciliado: pagoOdonto,
      tags: ['Fee Mensal'],
    });

    // 5. Café Grão Nobre (R$ 4.200) - Dia 25
    const vencGrao = formatData(mesNum, 25);
    const pagoGrao = isHistorico || (isAtual && dataHoje.getDate() >= 25);
    lancamentos.push({
      id: `lanc_rec_grao_${mesNum}`,
      tipo: 'receita',
      descricao: 'Mensalidade Fee: Café Grão Nobre (Reels & Conteúdo)',
      categoriaId: 'cat_rec_social',
      subcategoria: 'Social Media',
      grupo: 'Receitas',
      clienteId: 'cli_graonobre',
      contaBancariaId: 'conta_nubank',
      mesCompetencia: comp,
      dataVencimento: vencGrao,
      dataPagamento: pagoGrao ? vencGrao : undefined,
      valorOrcado: 420000,
      valorRealizado: pagoGrao ? 420000 : undefined,
      formaPagamento: 'pix',
      status: pagoGrao ? 'realizado' : 'previsto',
      conciliado: pagoGrao,
      tags: ['Fee Mensal'],
    });

    // --- CUSTOS COM EQUIPE PJ & PRESTADORES ---
    // Lucas (Designer - R$ 5.500) - Dia 05
    const vencLucas = formatData(mesNum, 5);
    const pagoLucas = isHistorico || (isAtual && dataHoje.getDate() >= 5);
    lancamentos.push({
      id: `lanc_desp_lucas_${mesNum}`,
      tipo: 'despesa',
      descricao: 'Honorários PJ: Lucas Mendonça (Designer Sênior & UI)',
      categoriaId: 'cat_desp_eq_designer',
      subcategoria: 'Designer',
      grupo: 'Despesas – Equipe PJ',
      fornecedorId: 'forn_lucas',
      contaBancariaId: 'conta_itau',
      mesCompetencia: comp,
      dataVencimento: vencLucas,
      dataPagamento: pagoLucas ? vencLucas : undefined,
      valorOrcado: 550000,
      valorRealizado: pagoLucas ? 550000 : undefined,
      formaPagamento: 'pix',
      status: pagoLucas ? 'realizado' : 'previsto',
      conciliado: pagoLucas,
      nfRecebida: true,
      tags: ['Equipe PJ', 'Fixa'],
    });

    // Mariana (Tráfego - R$ 6.200) - Dia 05
    const vencMariana = formatData(mesNum, 5);
    const pagoMariana = isHistorico || (isAtual && dataHoje.getDate() >= 5);
    lancamentos.push({
      id: `lanc_desp_mariana_${mesNum}`,
      tipo: 'despesa',
      descricao: 'Honorários PJ: Mariana Duarte (Gestora de Tráfego)',
      categoriaId: 'cat_desp_eq_gestor',
      subcategoria: 'Gestor de Tráfego',
      grupo: 'Despesas – Equipe PJ',
      fornecedorId: 'forn_mariana',
      contaBancariaId: 'conta_itau',
      mesCompetencia: comp,
      dataVencimento: vencMariana,
      dataPagamento: pagoMariana ? vencMariana : undefined,
      valorOrcado: 620000,
      valorRealizado: pagoMariana ? 620000 : undefined,
      formaPagamento: 'pix',
      status: pagoMariana ? 'realizado' : 'previsto',
      conciliado: pagoMariana,
      nfRecebida: true,
      tags: ['Equipe PJ', 'Fixa'],
    });

    // Rafael (Dev Web - R$ 4.800) - Dia 10
    const vencRafael = formatData(mesNum, 10);
    const pagoRafael = isHistorico || (isAtual && dataHoje.getDate() >= 10);
    lancamentos.push({
      id: `lanc_desp_rafael_${mesNum}`,
      tipo: 'despesa',
      descricao: 'Honorários PJ: Rafael Silveira (Dev Landing Pages)',
      categoriaId: 'cat_desp_eq_dev',
      subcategoria: 'Desenvolvimento',
      grupo: 'Despesas – Equipe PJ',
      fornecedorId: 'forn_rafael',
      contaBancariaId: 'conta_itau',
      mesCompetencia: comp,
      dataVencimento: vencRafael,
      dataPagamento: pagoRafael ? vencRafael : undefined,
      valorOrcado: 480000,
      valorRealizado: pagoRafael ? 480000 : undefined,
      formaPagamento: 'pix',
      status: pagoRafael ? 'realizado' : 'previsto',
      conciliado: pagoRafael,
      nfRecebida: true,
      tags: ['Equipe PJ', 'Fixa'],
    });

    // Camila (Copywriter - R$ 4.000) - Dia 05
    const vencCamila = formatData(mesNum, 5);
    const pagoCamila = isHistorico || (isAtual && dataHoje.getDate() >= 5);
    lancamentos.push({
      id: `lanc_desp_camila_${mesNum}`,
      tipo: 'despesa',
      descricao: 'Honorários PJ: Camila Siqueira (Copywriting & Conteúdo)',
      categoriaId: 'cat_desp_eq_marketing',
      subcategoria: 'Marketing',
      grupo: 'Despesas – Equipe PJ',
      fornecedorId: 'forn_camila',
      contaBancariaId: 'conta_itau',
      mesCompetencia: comp,
      dataVencimento: vencCamila,
      dataPagamento: pagoCamila ? vencCamila : undefined,
      valorOrcado: 400000,
      valorRealizado: pagoCamila ? 400000 : undefined,
      formaPagamento: 'pix',
      status: pagoCamila ? 'realizado' : 'previsto',
      conciliado: pagoCamila,
      nfRecebida: true,
      tags: ['Equipe PJ', 'Fixa'],
    });

    // Studio Apex (Audiovisual - R$ 2.500) - Dia 15
    const vencApex = formatData(mesNum, 15);
    const pagoApex = isHistorico || (isAtual && dataHoje.getDate() >= 15);
    lancamentos.push({
      id: `lanc_desp_apex_${mesNum}`,
      tipo: 'despesa',
      descricao: 'Produção Audiovisual: Studio Apex (Captação Vídeos)',
      categoriaId: 'cat_desp_op_servicos',
      subcategoria: 'Serviços',
      grupo: 'Despesas Operacionais',
      fornecedorId: 'forn_studio_apex',
      contaBancariaId: 'conta_nubank',
      mesCompetencia: comp,
      dataVencimento: vencApex,
      dataPagamento: pagoApex ? vencApex : undefined,
      valorOrcado: 250000,
      valorRealizado: pagoApex ? 250000 : undefined,
      formaPagamento: 'pix',
      status: pagoApex ? 'realizado' : 'previsto',
      conciliado: pagoApex,
      nfRecebida: true,
      tags: ['Variável'],
    });

    // --- DESPESAS OPERACIONAIS & SOFTWARES ---
    // Google Workspace & Nuvem (R$ 380,00) - Dia 08
    const vencGoogle = formatData(mesNum, 8);
    const pagoGoogle = isHistorico || (isAtual && dataHoje.getDate() >= 8);
    lancamentos.push({
      id: `lanc_desp_google_${mesNum}`,
      tipo: 'despesa',
      descricao: 'Google Workspace (E-mails e Drive Corporativo)',
      categoriaId: 'cat_desp_op_softwares',
      subcategoria: 'Aplicativos/Softwares',
      grupo: 'Despesas Operacionais',
      contaBancariaId: 'conta_nubank',
      mesCompetencia: comp,
      dataVencimento: vencGoogle,
      dataPagamento: pagoGoogle ? vencGoogle : undefined,
      valorOrcado: 38000,
      valorRealizado: pagoGoogle ? 38000 : undefined,
      formaPagamento: 'cartao',
      cartaoCreditoId: 'cartao_nubank_pj',
      status: pagoGoogle ? 'realizado' : 'previsto',
      conciliado: pagoGoogle,
      tags: ['Softwares', 'Fixa'],
    });

    // Notion Labs & IA (R$ 290,00) - Dia 12
    const vencNotion = formatData(mesNum, 12);
    const pagoNotion = isHistorico || (isAtual && dataHoje.getDate() >= 12);
    lancamentos.push({
      id: `lanc_desp_notion_${mesNum}`,
      tipo: 'despesa',
      descricao: 'Notion Plus Workspace & Gestão de Projetos',
      categoriaId: 'cat_desp_op_softwares',
      subcategoria: 'Aplicativos/Softwares',
      grupo: 'Despesas Operacionais',
      contaBancariaId: 'conta_nubank',
      mesCompetencia: comp,
      dataVencimento: vencNotion,
      dataPagamento: pagoNotion ? vencNotion : undefined,
      valorOrcado: 29000,
      valorRealizado: pagoNotion ? 29000 : undefined,
      formaPagamento: 'cartao',
      cartaoCreditoId: 'cartao_nubank_pj',
      status: pagoNotion ? 'realizado' : 'previsto',
      conciliado: pagoNotion,
      tags: ['Softwares', 'Fixa'],
    });

    // Semrush & Ferramentas SEO (R$ 1.150,00) - Dia 18
    const vencSemrush = formatData(mesNum, 18);
    const pagoSemrush = isHistorico || (isAtual && dataHoje.getDate() >= 18);
    lancamentos.push({
      id: `lanc_desp_semrush_${mesNum}`,
      tipo: 'despesa',
      descricao: 'Semrush Guru: Análise de Palavras-Chave e Concorrentes',
      categoriaId: 'cat_desp_op_softwares',
      subcategoria: 'Aplicativos/Softwares',
      grupo: 'Despesas Operacionais',
      contaBancariaId: 'conta_itau',
      mesCompetencia: comp,
      dataVencimento: vencSemrush,
      dataPagamento: pagoSemrush ? vencSemrush : undefined,
      valorOrcado: 115000,
      valorRealizado: pagoSemrush ? 115000 : undefined,
      formaPagamento: 'cartao',
      cartaoCreditoId: 'cartao_itau_corp',
      status: pagoSemrush ? 'realizado' : 'previsto',
      conciliado: pagoSemrush,
      tags: ['Softwares', 'Fixa'],
    });

    // Figma Professional (R$ 320,00) - Dia 22
    const vencFigma = formatData(mesNum, 22);
    const pagoFigma = isHistorico || (isAtual && dataHoje.getDate() >= 22);
    lancamentos.push({
      id: `lanc_desp_figma_${mesNum}`,
      tipo: 'despesa',
      descricao: 'Figma Organization (Equipe de Design & Protótipos)',
      categoriaId: 'cat_desp_op_softwares',
      subcategoria: 'Aplicativos/Softwares',
      grupo: 'Despesas Operacionais',
      contaBancariaId: 'conta_nubank',
      mesCompetencia: comp,
      dataVencimento: vencFigma,
      dataPagamento: pagoFigma ? vencFigma : undefined,
      valorOrcado: 32000,
      valorRealizado: pagoFigma ? 32000 : undefined,
      formaPagamento: 'cartao',
      cartaoCreditoId: 'cartao_nubank_pj',
      status: pagoFigma ? 'realizado' : 'previsto',
      conciliado: pagoFigma,
      tags: ['Softwares', 'Fixa'],
    });

    // Imposto Simples Nacional DAS (R$ 3.000,00 aprox. 6%) - Dia 20
    const vencDas = formatData(mesNum, 20);
    const pagoDas = isHistorico || (isAtual && dataHoje.getDate() >= 20);
    lancamentos.push({
      id: `lanc_desp_das_${mesNum}`,
      tipo: 'despesa',
      descricao: `Guia DAS: Simples Nacional (${comp})`,
      categoriaId: 'cat_desp_op_impostos',
      subcategoria: 'Impostos',
      grupo: 'Despesas Operacionais',
      contaBancariaId: 'conta_itau',
      mesCompetencia: comp,
      dataVencimento: vencDas,
      dataPagamento: pagoDas ? vencDas : undefined,
      valorOrcado: 300000,
      valorRealizado: pagoDas ? 300000 : undefined,
      formaPagamento: 'boleto',
      status: pagoDas ? 'realizado' : 'previsto',
      conciliado: pagoDas,
      tags: ['Impostos', 'Fixa'],
    });

    // Pró-labore Sócios (R$ 14.000,00 total = R$ 7.000 Rodrigo + R$ 7.000 Juliana) - Dia 05
    const vencProlabore = formatData(mesNum, 5);
    const pagoProlabore = isHistorico || (isAtual && dataHoje.getDate() >= 5);
    lancamentos.push({
      id: `lanc_desp_prolabore_rodrigo_${mesNum}`,
      tipo: 'despesa',
      descricao: 'Pró-labore: Rodrigo Guimarães (Sócio-Diretor)',
      categoriaId: 'cat_desp_op_outras',
      subcategoria: 'Pró-labore e Sócios',
      grupo: 'Despesas Operacionais',
      contaBancariaId: 'conta_itau',
      mesCompetencia: comp,
      dataVencimento: vencProlabore,
      dataPagamento: pagoProlabore ? vencProlabore : undefined,
      valorOrcado: 700000,
      valorRealizado: pagoProlabore ? 700000 : undefined,
      formaPagamento: 'transferencia',
      status: pagoProlabore ? 'realizado' : 'previsto',
      conciliado: pagoProlabore,
      tags: ['Fixa'],
    });
    lancamentos.push({
      id: `lanc_desp_prolabore_juliana_${mesNum}`,
      tipo: 'despesa',
      descricao: 'Pró-labore: Juliana Prado (Sócia de Operações)',
      categoriaId: 'cat_desp_op_outras',
      subcategoria: 'Pró-labore e Sócios',
      grupo: 'Despesas Operacionais',
      contaBancariaId: 'conta_itau',
      mesCompetencia: comp,
      dataVencimento: vencProlabore,
      dataPagamento: pagoProlabore ? vencProlabore : undefined,
      valorOrcado: 700000,
      valorRealizado: pagoProlabore ? 700000 : undefined,
      formaPagamento: 'transferencia',
      status: pagoProlabore ? 'realizado' : 'previsto',
      conciliado: pagoProlabore,
      tags: ['Fixa'],
    });

    // Amortização Empréstimo Sócio (R$ 3.000) - Dia 10
    const vencAmort = formatData(mesNum, 10);
    const pagoAmort = isHistorico || (isAtual && dataHoje.getDate() >= 10);
    lancamentos.push({
      id: `lanc_desp_amort_socio_${mesNum}`,
      tipo: 'despesa',
      descricao: 'Devolução de Empréstimo de Capital de Giro ao Sócio Rodrigo',
      categoriaId: 'cat_desp_op_reembolsos',
      subcategoria: 'Reembolsos',
      grupo: 'Despesas Operacionais',
      contaBancariaId: 'conta_itau',
      mesCompetencia: comp,
      dataVencimento: vencAmort,
      dataPagamento: pagoAmort ? vencAmort : undefined,
      valorOrcado: 300000,
      valorRealizado: pagoAmort ? 300000 : undefined,
      formaPagamento: 'pix',
      status: pagoAmort ? 'realizado' : 'previsto',
      conciliado: pagoAmort,
      tags: ['Reembolso de Sócio'],
    });
  };

  // Gerar para os meses
  mesesHistorico.forEach((m) => gerarCicloMes(m, true, false));
  gerarCicloMes(mesAtual, false, true);
  mesesFuturos.forEach((m) => gerarCicloMes(m, false, false));

  // Lançamentos pontuais adicionais para enriquecer a experiência
  // 1. Projeto Setup de Branding (Receita extraordinária em Agosto)
  lancamentos.push({
    id: `lanc_rec_extra_branding_ago`,
    tipo: 'receita',
    descricao: 'Setup e Redesign Completo de Marca: Grupo BioVida',
    categoriaId: 'cat_rec_branding',
    subcategoria: 'Branding',
    grupo: 'Receitas',
    contaBancariaId: 'conta_itau',
    mesCompetencia: formatAnoMes(8),
    dataVencimento: formatData(8, 18),
    dataPagamento: formatData(8, 18),
    valorOrcado: 1400000, // R$ 14.000,00
    valorRealizado: 1400000,
    formaPagamento: 'pix',
    status: 'realizado',
    conciliado: true,
    tags: ['Setup', 'Variável'],
  });

  // 2. Compra de Equipamento (Câmera Sony Alpha para o estúdio em Julho)
  lancamentos.push({
    id: `lanc_desp_extra_camera_jul`,
    tipo: 'despesa',
    descricao: 'Câmera Sony A7 IV + Lente 24-70mm Estúdio da Agência',
    categoriaId: 'cat_desp_op_equip',
    subcategoria: 'Equipamentos',
    grupo: 'Despesas Operacionais',
    contaBancariaId: 'conta_itau',
    mesCompetencia: formatAnoMes(7),
    dataVencimento: formatData(7, 12),
    dataPagamento: formatData(7, 12),
    valorOrcado: 1850000, // R$ 18.500,00
    valorRealizado: 1850000,
    formaPagamento: 'cartao',
    cartaoCreditoId: 'cartao_itau_corp',
    status: 'realizado',
    conciliado: true,
    tags: ['Variável'],
  });

  return {
    contas,
    cartoes,
    clientes,
    fornecedores,
    reembolsos,
    metas,
    cenarios,
    regrasExtrato,
    configuracoes,
    lancamentos,
    categorias: CATEGORIAS_PADRAO,
  };
}
