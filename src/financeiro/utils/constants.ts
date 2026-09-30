import { Categoria, ConfiguracoesGerais } from '../types';

export const CATEGORIAS_PADRAO: Categoria[] = [
  // 1. Receitas
  {
    id: 'cat_rec_branding',
    grupo: 'Receitas',
    subcategoria: 'Branding',
    tipo: 'receita',
    cor: '#10b981', // emerald-500
    ordem: 1,
    ativa: true,
  },
  {
    id: 'cat_rec_trafego',
    grupo: 'Receitas',
    subcategoria: 'Tráfego Pago',
    tipo: 'receita',
    cor: '#059669', // emerald-600
    ordem: 2,
    ativa: true,
  },
  {
    id: 'cat_rec_social',
    grupo: 'Receitas',
    subcategoria: 'Social Media',
    tipo: 'receita',
    cor: '#14b8a6', // teal-500
    ordem: 3,
    ativa: true,
  },
  {
    id: 'cat_rec_sites',
    grupo: 'Receitas',
    subcategoria: 'Sites/Desenvolvimento',
    tipo: 'receita',
    cor: '#0d9488', // teal-600
    ordem: 4,
    ativa: true,
  },
  {
    id: 'cat_rec_outras',
    grupo: 'Receitas',
    subcategoria: 'Outras Receitas',
    tipo: 'receita',
    cor: '#2dd4bf', // teal-400
    ordem: 5,
    ativa: true,
  },

  // 2. Despesas – Equipe PJ
  {
    id: 'cat_desp_eq_comercial',
    grupo: 'Despesas – Equipe PJ',
    subcategoria: 'Comercial',
    tipo: 'despesa',
    cor: '#f97316', // orange-500
    ordem: 6,
    ativa: true,
  },
  {
    id: 'cat_desp_eq_marketing',
    grupo: 'Despesas – Equipe PJ',
    subcategoria: 'Marketing',
    tipo: 'despesa',
    cor: '#ea580c', // orange-600
    ordem: 7,
    ativa: true,
  },
  {
    id: 'cat_desp_eq_designer',
    grupo: 'Despesas – Equipe PJ',
    subcategoria: 'Designer',
    tipo: 'despesa',
    cor: '#fb923c', // orange-400
    ordem: 8,
    ativa: true,
  },
  {
    id: 'cat_desp_eq_dev',
    grupo: 'Despesas – Equipe PJ',
    subcategoria: 'Desenvolvimento',
    tipo: 'despesa',
    cor: '#e11d48', // rose-600
    ordem: 9,
    ativa: true,
  },
  {
    id: 'cat_desp_eq_gestor',
    grupo: 'Despesas – Equipe PJ',
    subcategoria: 'Gestor de Tráfego',
    tipo: 'despesa',
    cor: '#d97706', // amber-600
    ordem: 10,
    ativa: true,
  },
  {
    id: 'cat_desp_eq_financeiro',
    grupo: 'Despesas – Equipe PJ',
    subcategoria: 'Financeiro',
    tipo: 'despesa',
    cor: '#b45309', // amber-700
    ordem: 11,
    ativa: true,
  },

  // 3. Despesas Operacionais
  {
    id: 'cat_desp_op_impostos',
    grupo: 'Despesas Operacionais',
    subcategoria: 'Impostos',
    tipo: 'despesa',
    cor: '#ef4444', // red-500
    ordem: 12,
    ativa: true,
  },
  {
    id: 'cat_desp_op_softwares',
    grupo: 'Despesas Operacionais',
    subcategoria: 'Aplicativos/Softwares',
    tipo: 'despesa',
    cor: '#6366f1', // indigo-500
    ordem: 13,
    ativa: true,
  },
  {
    id: 'cat_desp_op_equip',
    grupo: 'Despesas Operacionais',
    subcategoria: 'Equipamentos',
    tipo: 'despesa',
    cor: '#8b5cf6', // purple-500
    ordem: 14,
    ativa: true,
  },
  {
    id: 'cat_desp_op_reembolsos',
    grupo: 'Despesas Operacionais',
    subcategoria: 'Reembolsos',
    tipo: 'despesa',
    cor: '#ec4899', // pink-500
    ordem: 15,
    ativa: true,
  },
  {
    id: 'cat_desp_op_taxas',
    grupo: 'Despesas Operacionais',
    subcategoria: 'Taxas Bancárias',
    tipo: 'despesa',
    cor: '#dc2626', // red-600
    ordem: 16,
    ativa: true,
  },
  {
    id: 'cat_desp_op_transporte',
    grupo: 'Despesas Operacionais',
    subcategoria: 'Transporte',
    tipo: 'despesa',
    cor: '#9333ea', // purple-600
    ordem: 17,
    ativa: true,
  },
  {
    id: 'cat_desp_op_servicos',
    grupo: 'Despesas Operacionais',
    subcategoria: 'Serviços',
    tipo: 'despesa',
    cor: '#4f46e5', // indigo-600
    ordem: 18,
    ativa: true,
  },
  {
    id: 'cat_desp_op_outras',
    grupo: 'Despesas Operacionais',
    subcategoria: 'Outras Despesas',
    tipo: 'despesa',
    cor: '#64748b', // slate-500
    ordem: 19,
    ativa: true,
  },

  // 4. Cartão de Crédito
  {
    id: 'cat_desp_cartao_fatura',
    grupo: 'Cartão de Crédito',
    subcategoria: 'Fatura de cartão',
    tipo: 'despesa',
    cor: '#3b82f6', // blue-500
    ordem: 20,
    ativa: true,
  },
];

export const CONFIG_PADRAO: ConfiguracoesGerais = {
  horizonteProjecao: 24,
  toleranciaDivergenciaPct: 5,
  saldoMinimoSegurancaCents: 1000000, // R$ 10.000,00
  impostoPadraoPct: 6, // 6% Simples Nacional
  dadosEmpresa: {
    nome: 'Agência Digital Ltda',
    cnpj: '',
  },
  tagsDisponiveis: ['Fixa', 'Variável', 'Urgente', 'Revisar', 'Contrato Anual', 'Fee Mensal', 'Setup'],
};
