import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle,
  Copy,
  Calendar,
  List,
  Layers,
  Trash2,
  Edit2,
  FileText,
  Paperclip,
  Plus,
  ArrowRightLeft,
  XCircle,
  CheckSquare,
  Square,
  AlertCircle,
  ChevronDown,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/common/EmptyState';
import {
  Lancamento,
  TipoLancamento,
  StatusLancamento,
  FormaPagamento,
} from '../types';
import {
  formatarMoeda,
  formatarDataBR,
  formatarMesCompetencia,
  getDataHojeISO,
} from '../utils/formatters';

export const LancamentosView: React.FC = () => {
  const {
    lancamentos,
    contas,
    categorias,
    clientes,
    fornecedores,
    abrirModalNovoLancamento,
    salvarLancamento,
    salvarLancamentosEmLote,
    excluirLancamento,
    marcarComoRealizadoRapido,
    duplicarLancamento,
    cancelarLancamento,
    showToast,
    openConfirm,
    isLancamentoNoPeriodo,
  } = useApp();

  // Visões alternativas: lista, calendario, agrupado (contas a pagar/receber)
  const [visao, setVisao] = useState<'lista' | 'calendario' | 'agrupado'>('lista');

  // Filtros combináveis
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [filtroConta, setFiltroConta] = useState<string>('todas');
  const [filtroConciliado, setFiltroConciliado] = useState<string>('todos');

  // Ordenação
  const [ordenarPor, setOrdenarPor] = useState<'vencimento' | 'descricao' | 'valor' | 'status'>('vencimento');
  const [ordemDesc, setOrdemDesc] = useState<boolean>(false);

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;

  // Seleção múltipla para ações em massa
  const [selecionados, setSelecionados] = useState<string[]>([]);

  // Modal rápido de pagamento parcial
  const [pagamentoParcialModal, setPagamentoParcialModal] = useState<{
    aberto: boolean;
    lancamento?: Lancamento;
    valorRealizadoCents: number;
    dataPagamento: string;
  }>({
    aberto: false,
    valorRealizadoCents: 0,
    dataPagamento: getDataHojeISO(),
  });

  // Modal para exibir comprovante
  const [comprovanteVisualizar, setComprovanteVisualizar] = useState<{
    nome: string;
    base64: string;
    tipo: string;
  } | null>(null);

  // Filtragem dos lançamentos
  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((l) => {
      // Filtro global de período (topo)
      if (!isLancamentoNoPeriodo(l)) return false;

      // Busca textual (descrição, categoria, cliente, fornecedor, observações)
      if (busca) {
        const termo = busca.toLowerCase();
        const cliNome = clientes.find((c) => c.id === l.clienteId)?.nomeRazaoSocial.toLowerCase() || '';
        const fornNome = fornecedores.find((f) => f.id === l.fornecedorId)?.nome.toLowerCase() || '';
        const match =
          l.descricao.toLowerCase().includes(termo) ||
          l.subcategoria.toLowerCase().includes(termo) ||
          l.grupo.toLowerCase().includes(termo) ||
          cliNome.includes(termo) ||
          fornNome.includes(termo) ||
          (l.observacoes && l.observacoes.toLowerCase().includes(termo));
        if (!match) return false;
      }

      // Filtro Tipo
      if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false;

      // Filtro Status
      if (filtroStatus !== 'todos' && l.status !== filtroStatus) return false;

      // Filtro Categoria
      if (filtroCategoria !== 'todas' && l.categoriaId !== filtroCategoria) return false;

      // Filtro Conta
      if (filtroConta !== 'todas' && l.contaBancariaId !== filtroConta && l.contaDestinoId !== filtroConta) return false;

      // Filtro Conciliado
      if (filtroConciliado === 'sim' && !l.conciliado) return false;
      if (filtroConciliado === 'nao' && l.conciliado) return false;

      return true;
    });
  }, [
    lancamentos,
    isLancamentoNoPeriodo,
    busca,
    filtroTipo,
    filtroStatus,
    filtroCategoria,
    filtroConta,
    filtroConciliado,
    clientes,
    fornecedores,
  ]);

  // Ordenação
  const lancamentosOrdenados = useMemo(() => {
    return [...lancamentosFiltrados].sort((a, b) => {
      let resultado = 0;
      if (ordenarPor === 'vencimento') {
        resultado = a.dataVencimento.localeCompare(b.dataVencimento);
      } else if (ordenarPor === 'descricao') {
        resultado = a.descricao.localeCompare(b.descricao);
      } else if (ordenarPor === 'valor') {
        resultado = a.valorOrcado - b.valorOrcado;
      } else if (ordenarPor === 'status') {
        resultado = a.status.localeCompare(b.status);
      }
      return ordemDesc ? -resultado : resultado;
    });
  }, [lancamentosFiltrados, ordenarPor, ordemDesc]);

  // Totais do rodapé que respeitam os filtros
  const totaisRodape = useMemo(() => {
    let orcadoReceitas = 0;
    let orcadoDespesas = 0;
    let realizadoReceitas = 0;
    let realizadoDespesas = 0;

    lancamentosFiltrados.forEach((l) => {
      if (l.status === 'cancelado' || l.tipo === 'transferencia') return;
      const realizado = l.valorRealizado !== undefined ? l.valorRealizado : (l.status === 'realizado' ? l.valorOrcado : 0);

      if (l.tipo === 'receita') {
        orcadoReceitas += l.valorOrcado;
        realizadoReceitas += realizado;
      } else if (l.tipo === 'despesa') {
        orcadoDespesas += l.valorOrcado;
        realizadoDespesas += realizado;
      }
    });

    const saldoOrcado = orcadoReceitas - orcadoDespesas;
    const saldoRealizado = realizadoReceitas - realizadoDespesas;
    const diferenca = saldoRealizado - saldoOrcado;

    return {
      orcadoReceitas,
      orcadoDespesas,
      realizadoReceitas,
      realizadoDespesas,
      saldoOrcado,
      saldoRealizado,
      diferenca,
    };
  }, [lancamentosFiltrados]);

  // Paginação
  const totalPaginas = Math.ceil(lancamentosOrdenados.length / itensPorPagina) || 1;
  const lancamentosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return lancamentosOrdenados.slice(inicio, inicio + itensPorPagina);
  }, [lancamentosOrdenados, paginaAtual, itensPorPagina]);

  // Ações de seleção múltipla
  const selecionarTodos = () => {
    if (selecionados.length === lancamentosPaginados.length) {
      setSelecionados([]);
    } else {
      setSelecionados(lancamentosPaginados.map((l) => l.id));
    }
  };

  const toggleSelecionado = (id: string) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter((item) => item !== id));
    } else {
      setSelecionados([...selecionados, id]);
    }
  };

  // Ações em massa
  const handleAcaoEmMassaRealizar = () => {
    if (selecionados.length === 0) return;
    const hoje = getDataHojeISO();
    const atualizados = lancamentos.map((l) => {
      if (selecionados.includes(l.id)) {
        return {
          ...l,
          valorRealizado: l.valorRealizado || l.valorOrcado,
          dataPagamento: l.dataPagamento || hoje,
          status: 'realizado' as StatusLancamento,
        };
      }
      return l;
    });
    salvarLancamentosEmLote(atualizados);
    setSelecionados([]);
    showToast(`${selecionados.length} lançamentos marcados como realizados!`);
  };

  const handleAcaoEmMassaExcluir = () => {
    if (selecionados.length === 0) return;
    openConfirm({
      titulo: 'Excluir múltiplos lançamentos',
      mensagem: `Tem certeza que deseja excluir os ${selecionados.length} lançamentos selecionados?`,
      confirmTexto: 'Excluir todos',
      perigo: true,
      onConfirm: () => {
        selecionados.forEach((id) => excluirLancamento(id, 'somente_esta'));
        setSelecionados([]);
        showToast(`${selecionados.length} lançamentos excluídos com sucesso.`);
      },
    });
  };

  // Copiar Chave PIX do Fornecedor
  const handleCopiarPix = (fornecedorId?: string) => {
    if (!fornecedorId) return;
    const f = fornecedores.find((item) => item.id === fornecedorId);
    if (!f || !f.chavePix) {
      showToast('Nenhuma chave PIX cadastrada para este prestador.', 'erro');
      return;
    }
    navigator.clipboard.writeText(f.chavePix);
    showToast(`Chave PIX de ${f.nome} copiada para a área de transferência!`);
  };

  // Status visual badge
  const renderStatusBadge = (status: StatusLancamento) => {
    const configs: Record<StatusLancamento, { label: string; bg: string; text: string }> = {
      previsto: {
        label: 'Previsto',
        bg: 'bg-fundo-sutil dark:bg-superficie-dark',
        text: 'text-texto-medio dark:text-texto-medio-dark',
      },
      vencido: {
        label: 'Vencido',
        bg: 'bg-perigo-suave dark:bg-superficie-dark/70',
        text: 'text-perigo dark:text-texto-forte-dark font-semibold',
      },
      parcial: {
        label: 'Parcial',
        bg: 'bg-alerta-suave dark:bg-superficie-dark/70',
        text: 'text-alerta dark:text-texto-forte-dark',
      },
      realizado: {
        label: 'Realizado',
        bg: 'bg-sucesso-suave dark:bg-superficie-dark/70',
        text: 'text-sucesso dark:text-texto-forte-dark font-semibold',
      },
      divergente: {
        label: 'Divergente',
        bg: 'bg-primaria-suave dark:bg-navy-claro/70',
        text: 'text-primaria dark:text-primaria-clara',
      },
      cancelado: {
        label: 'Cancelado',
        bg: 'bg-fundo-sutil dark:bg-superficie-dark/50',
        text: 'text-texto-medio line-through',
      },
    };

    const cfg = configs[status] || configs.previsto;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
    );
  };

  // Agrupamento de Contas a Pagar / Receber por Vencimento
  const agrupadosPorVencimento = useMemo(() => {
    const hoje = getDataHojeISO();
    const dataFimSemana = new Date();
    dataFimSemana.setDate(dataFimSemana.getDate() + 7);
    const fimSemanaStr = dataFimSemana.toISOString().split('T')[0];

    const dataFimMes = new Date();
    dataFimMes.setMonth(dataFimMes.getMonth() + 1, 0);
    const fimMesStr = dataFimMes.toISOString().split('T')[0];

    const grupos: Record<string, Lancamento[]> = {
      vencidos: [],
      hoje: [],
      esta_semana: [],
      este_mes: [],
      futuros: [],
    };

    lancamentosFiltrados.forEach((l) => {
      if (l.status === 'cancelado' || l.status === 'realizado') return;
      const v = l.dataVencimento;
      if (v < hoje) grupos.vencidos.push(l);
      else if (v === hoje) grupos.hoje.push(l);
      else if (v <= fimSemanaStr) grupos.esta_semana.push(l);
      else if (v <= fimMesStr) grupos.este_mes.push(l);
      else grupos.futuros.push(l);
    });

    return grupos;
  }, [lancamentosFiltrados]);

  // Se não houver nenhum lançamento no sistema
  if (lancamentos.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
              Lançamentos Financeiros
            </h2>
            <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
              Gerencie receitas, despesas, parcelamentos e transferências.
            </p>
          </div>
        </div>

        <EmptyState
          titulo="Nenhum lançamento ainda"
          descricao="Você ainda não possui nenhum lançamento cadastrado. Crie um lançamento único, configure despesas recorrentes da agência ou cadastre parcelamentos."
          acaoTexto="Criar primeiro lançamento"
          onAcao={() => abrirModalNovoLancamento('despesa')}
          secundariaTexto="Nova Receita de Cliente"
          onSecundaria={() => abrirModalNovoLancamento('receita')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Barra de Ações do Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Lançamentos Financeiros
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            {lancamentosFiltrados.length} lançamentos encontrados no período selecionado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Alternância de Visões: Lista / Calendário / Agrupado */}
          <div className="inline-flex p-0.5 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark text-xs">
            <button
              type="button"
              onClick={() => setVisao('lista')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 cursor-pointer ${
                visao === 'lista'
                  ? 'bg-superficie dark:bg-superficie-dark text-primaria dark:text-primaria-clara shadow-sutil font-semibold'
                  : 'text-texto-medio dark:text-texto-medio-dark'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setVisao('agrupado')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 cursor-pointer ${
                visao === 'agrupado'
                  ? 'bg-superficie dark:bg-superficie-dark text-primaria dark:text-primaria-clara shadow-sutil font-semibold'
                  : 'text-texto-medio dark:text-texto-medio-dark'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>A Pagar / Receber</span>
            </button>
            <button
              type="button"
              onClick={() => setVisao('calendario')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 cursor-pointer ${
                visao === 'calendario'
                  ? 'bg-superficie dark:bg-superficie-dark text-primaria dark:text-primaria-clara shadow-sutil font-semibold'
                  : 'text-texto-medio dark:text-texto-medio-dark'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendário</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => abrirModalNovoLancamento('despesa')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primaria hover:bg-primaria-hover text-white text-xs font-semibold rounded-[var(--radius-controle)] shadow-card cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Novo lançamento</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Busca */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-texto-medio absolute left-3 top-2.5" />
            <input
              type="text"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPaginaAtual(1);
              }}
              placeholder="Buscar por descrição, cliente, prestador..."
              className="w-full pl-9 pr-3 py-2 rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy text-texto-medio dark:text-texto-medio-dark placeholder-slate-400 focus:ring-1 focus:ring-primaria focus:outline-hidden"
            />
          </div>

          {/* Tipo */}
          <div>
            <select
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full px-3 py-2 rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="receita">Apenas Receitas</option>
              <option value="despesa">Apenas Despesas</option>
              <option value="transferencia">Apenas Transferências</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={filtroStatus}
              onChange={(e) => {
                setFiltroStatus(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full px-3 py-2 rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
            >
              <option value="todos">Todos os Status</option>
              <option value="previsto">Previsto</option>
              <option value="vencido">Vencido</option>
              <option value="realizado">Realizado</option>
              <option value="parcial">Parcial</option>
              <option value="divergente">Divergente</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Conta Bancária */}
          <div>
            <select
              value={filtroConta}
              onChange={(e) => {
                setFiltroConta(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full px-3 py-2 rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
            >
              <option value="todas">Todas as Contas</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ações em Massa (quando há itens selecionados) */}
        {selecionados.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-[var(--radius-controle)] bg-primaria-suave dark:bg-navy-claro/60 border border-primaria dark:border-borda-dark text-xs">
            <span className="font-semibold text-primaria dark:text-primaria-clara">
              {selecionados.length} lançamento(s) selecionado(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAcaoEmMassaRealizar}
                className="px-3 py-1 bg-sucesso-suave hover:bg-sucesso-suave text-white font-medium rounded-md cursor-pointer transition-colors"
              >
                Marcar como Realizado
              </button>
              <button
                type="button"
                onClick={handleAcaoEmMassaExcluir}
                className="px-3 py-1 bg-perigo-suave hover:bg-perigo-suave text-white font-medium rounded-md cursor-pointer transition-colors"
              >
                Excluir Selecionados
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VISÃO 1: TABELA DE LISTA */}
      {visao === 'lista' && (
        <div className="bg-superficie dark:bg-navy rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-sutil overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-fundo-sutil dark:bg-superficie-dark/80 border-b border-borda dark:border-borda-dark text-texto-medio dark:text-texto-medio-dark uppercase font-semibold text-[10px] tracking-wider">
                  <th className="p-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={selecionarTodos}
                      className="cursor-pointer text-texto-medio hover:text-texto-medio"
                    >
                      {selecionados.length === lancamentosPaginados.length && lancamentosPaginados.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primaria" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Status</th>
                  <th
                    className="p-3 cursor-pointer hover:text-texto-medio dark:hover:text-texto-medio"
                    onClick={() => {
                      setOrdenarPor('vencimento');
                      setOrdemDesc(!ordemDesc);
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Vencimento</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer hover:text-texto-medio dark:hover:text-texto-medio"
                    onClick={() => {
                      setOrdenarPor('descricao');
                      setOrdemDesc(!ordemDesc);
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Descrição / Categoria</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3">Conta / Pagto</th>
                  <th
                    className="p-3 text-right cursor-pointer hover:text-texto-medio dark:hover:text-texto-medio"
                    onClick={() => {
                      setOrdenarPor('valor');
                      setOrdemDesc(!ordemDesc);
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Orçado</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 text-right">Realizado</th>
                  <th className="p-3 text-center w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {lancamentosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-texto-medio">
                      Nenhum lançamento corresponde aos filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  lancamentosPaginados.map((l) => {
                    const conta = contas.find((c) => c.id === l.contaBancariaId);
                    const fornecedor = fornecedores.find((f) => f.id === l.fornecedorId);
                    const isSelected = selecionados.includes(l.id);

                    return (
                      <tr
                        key={l.id}
                        className={`hover:bg-fundo-sutil/80 dark:hover:bg-fundo-sutil/40 transition-colors ${
                          isSelected ? 'bg-primaria-suave/40 dark:bg-navy-claro/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelecionado(l.id)}
                            className="cursor-pointer text-texto-medio hover:text-texto-medio"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-primaria" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Status */}
                        <td className="p-3">{renderStatusBadge(l.status)}</td>

                        {/* Vencimento / Competência */}
                        <td className="p-3 tabular-nums">
                          <span className="font-semibold text-texto-medio dark:text-texto-medio-dark block">
                            {formatarDataBR(l.dataVencimento)}
                          </span>
                          <span className="text-[10px] text-texto-medio">
                            {formatarMesCompetencia(l.mesCompetencia, 'ref')}
                          </span>
                        </td>

                        {/* Descrição & Categoria */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-texto-medio dark:text-texto-medio-dark">
                              {l.descricao}
                            </span>
                            {l.comprovante && (
                              <button
                                type="button"
                                onClick={() => setComprovanteVisualizar(l.comprovante!)}
                                title="Visualizar comprovante anexado"
                                className="text-primaria hover:text-primaria cursor-pointer"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-texto-medio dark:text-texto-medio-dark mt-0.5">
                            <span className="font-medium">{l.subcategoria || l.grupo}</span>
                            {l.tags && l.tags.length > 0 && (
                              <span className="text-texto-medio">• {l.tags.join(', ')}</span>
                            )}
                          </div>
                        </td>

                        {/* Conta / Pagto */}
                        <td className="p-3 text-texto-medio dark:text-texto-medio-dark">
                          <span className="block font-medium truncate max-w-28">
                            {conta ? conta.nome : '-'}
                          </span>
                          <span className="text-[10px] text-texto-medio uppercase">
                            {l.formaPagamento}
                          </span>
                        </td>

                        {/* Orçado */}
                        <td className="p-3 text-right tabular-nums font-semibold text-texto-medio dark:text-texto-medio-dark">
                          {formatarMoeda(l.valorOrcado)}
                        </td>

                        {/* Realizado */}
                        <td className="p-3 text-right tabular-nums">
                          {l.valorRealizado !== undefined ? (
                            <span
                              className={`font-bold ${
                                l.tipo === 'receita'
                                  ? 'text-sucesso dark:text-texto-forte-dark'
                                  : 'text-perigo dark:text-texto-forte-dark'
                              }`}
                            >
                              {formatarMoeda(l.valorRealizado)}
                            </span>
                          ) : (
                            <span className="text-texto-medio text-[11px]">-</span>
                          )}
                        </td>

                        {/* Ações Rápidas por linha */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Marcar como Realizado Rápido */}
                            {l.status !== 'realizado' && (
                              <button
                                type="button"
                                onClick={() => marcarComoRealizadoRapido(l.id)}
                                title="Dar baixa rápida (valor integral com data de hoje)"
                                className="p-1 text-sucesso hover:bg-sucesso-suave dark:hover:bg-sucesso-suave/60 rounded cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Copiar Chave PIX do fornecedor se houver */}
                            {fornecedor && fornecedor.chavePix && (
                              <button
                                type="button"
                                onClick={() => handleCopiarPix(fornecedor.id)}
                                title="Copiar chave PIX do prestador"
                                className="p-1 text-primaria hover:bg-primaria-suave dark:hover:bg-primaria-suave/60 rounded cursor-pointer"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}

                            {/* Editar */}
                            <button
                              type="button"
                              onClick={() => abrirModalNovoLancamento(l.tipo, undefined, l)}
                              title="Editar lançamento"
                              className="p-1 text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Duplicar */}
                            <button
                              type="button"
                              onClick={() => duplicarLancamento(l)}
                              title="Duplicar"
                              className="p-1 text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Excluir */}
                            <button
                              type="button"
                              onClick={() => excluirLancamento(l.id)}
                              title="Excluir"
                              className="p-1 text-perigo hover:bg-perigo-suave dark:hover:bg-perigo-suave/60 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé Totalizador & Paginação */}
          <div className="p-4 bg-fundo-sutil dark:bg-superficie-dark/80 border-t border-borda dark:border-borda-dark flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            {/* Totais do Rodapé */}
            <div className="flex flex-wrap items-center gap-4 text-texto-medio dark:text-texto-medio-dark font-medium">
              <div>
                <span>Total Orçado: </span>
                <span className="font-bold text-texto-medio dark:text-texto-medio-dark tabular-nums">
                  {formatarMoeda(totaisRodape.saldoOrcado)}
                </span>
              </div>
              <div>
                <span>Total Realizado: </span>
                <span
                  className={`font-bold tabular-nums ${
                    totaisRodape.saldoRealizado >= 0
                      ? 'text-sucesso dark:text-texto-forte-dark'
                      : 'text-perigo dark:text-texto-forte-dark'
                  }`}
                >
                  {formatarMoeda(totaisRodape.saldoRealizado)}
                </span>
              </div>
              <div>
                <span>Diferença: </span>
                <span
                  className={`font-bold tabular-nums ${
                    totaisRodape.diferenca >= 0
                      ? 'text-sucesso dark:text-texto-forte-dark'
                      : 'text-perigo dark:text-texto-forte-dark'
                  }`}
                >
                  {formatarMoeda(totaisRodape.diferenca)}
                </span>
              </div>
            </div>

            {/* Controles de Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={paginaAtual <= 1}
                  onClick={() => setPaginaAtual(paginaAtual - 1)}
                  className="px-2.5 py-1 rounded bg-superficie dark:bg-navy border border-borda dark:border-borda-dark disabled:opacity-50 cursor-pointer"
                >
                  Anterior
                </button>
                <span className="text-texto-medio">
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <button
                  type="button"
                  disabled={paginaAtual >= totalPaginas}
                  onClick={() => setPaginaAtual(paginaAtual + 1)}
                  className="px-2.5 py-1 rounded bg-superficie dark:bg-navy border border-borda dark:border-borda-dark disabled:opacity-50 cursor-pointer"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISÃO 2: CONTAS A PAGAR / A RECEBER AGRUPADAS POR VENCIMENTO */}
      {visao === 'agrupado' && (
        <div className="space-y-6">
          {(
            [
              { chave: 'vencidos', titulo: 'Lançamentos Vencidos (Requer Ação)', cor: 'border-perigo' },
              { chave: 'hoje', titulo: 'Vencendo Hoje', cor: 'border-alerta' },
              { chave: 'esta_semana', titulo: 'Vencendo Esta Semana', cor: 'border-primaria' },
              { chave: 'este_mes', titulo: 'Vencendo no Restante do Mês', cor: 'border-primaria' },
              { chave: 'futuros', titulo: 'Vencimentos Futuros', cor: 'border-borda' },
            ] as const
          ).map((grupo) => {
            const itens = agrupadosPorVencimento[grupo.chave] || [];
            if (itens.length === 0) return null;

            return (
              <div
                key={grupo.chave}
                className={`p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil border-l-4 ${grupo.cor} space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
                    {grupo.titulo}
                  </h3>
                  <span className="text-xs text-texto-medio font-semibold">{itens.length} itens</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {itens.map((l) => (
                    <div
                      key={l.id}
                      className="p-3 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark/60 border border-borda dark:border-borda-dark flex flex-col justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-texto-medio dark:text-texto-medio-dark truncate">
                            {l.descricao}
                          </span>
                          {renderStatusBadge(l.status)}
                        </div>
                        <span className="text-[11px] text-texto-medio block mt-0.5">
                          Venc: {formatarDataBR(l.dataVencimento)} • {l.subcategoria}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-borda/60 dark:border-borda-dark/60">
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            l.tipo === 'receita'
                              ? 'text-sucesso dark:text-texto-forte-dark'
                              : 'text-perigo dark:text-texto-forte-dark'
                          }`}
                        >
                          {formatarMoeda(l.valorOrcado)}
                        </span>
                        <button
                          type="button"
                          onClick={() => marcarComoRealizadoRapido(l.id)}
                          className="px-2.5 py-1 bg-primaria hover:bg-primaria-hover text-white rounded text-[11px] font-semibold cursor-pointer"
                        >
                          Dar Baixa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISÃO 3: CALENDÁRIO MENSAL */}
      {visao === 'calendario' && (
        <div className="p-5 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
              Calendário Mensal de Vencimentos
            </h3>
            <span className="text-xs text-texto-medio">
              Lançamentos distribuídos pelas datas de vencimento previstas
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-texto-medio py-2 border-b border-borda dark:border-borda-dark">
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          <div className="space-y-2">
            {lancamentosFiltrados.slice(0, 30).map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between p-2 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark/60 border border-borda dark:border-borda-dark text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded bg-primaria-suave dark:bg-navy-claro font-bold text-primaria dark:text-primaria-clara tabular-nums">
                    {formatarDataBR(l.dataVencimento)}
                  </span>
                  <span className="font-semibold text-texto-medio dark:text-texto-medio-dark">
                    {l.descricao}
                  </span>
                  <span className="text-[11px] text-texto-medio">({l.subcategoria})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold tabular-nums ${
                      l.tipo === 'receita'
                        ? 'text-sucesso dark:text-texto-forte-dark'
                        : 'text-perigo dark:text-texto-forte-dark'
                    }`}
                  >
                    {formatarMoeda(l.valorOrcado)}
                  </span>
                  {renderStatusBadge(l.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Visualizador de Comprovante */}
      {comprovanteVisualizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="bg-superficie dark:bg-navy border border-borda dark:border-borda-dark rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
                Comprovante: {comprovanteVisualizar.nome}
              </h3>
              <button
                type="button"
                onClick={() => setComprovanteVisualizar(null)}
                className="text-texto-medio hover:text-texto-medio cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto flex items-center justify-center bg-fundo-sutil dark:bg-superficie-dark rounded-[var(--radius-card)] p-2">
              {comprovanteVisualizar.tipo.startsWith('image/') ? (
                <img
                  src={comprovanteVisualizar.base64}
                  alt={comprovanteVisualizar.nome}
                  className="max-h-80 object-contain rounded-[var(--radius-controle)]"
                />
              ) : (
                <iframe
                  src={comprovanteVisualizar.base64}
                  title={comprovanteVisualizar.nome}
                  className="w-full h-80 rounded-[var(--radius-controle)]"
                />
              )}
            </div>

            <div className="flex justify-end">
              <a
                href={comprovanteVisualizar.base64}
                download={comprovanteVisualizar.nome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primaria text-white rounded-[var(--radius-controle)] text-xs font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>Baixar arquivo</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
