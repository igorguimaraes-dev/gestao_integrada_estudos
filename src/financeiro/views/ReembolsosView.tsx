import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  UserCheck,
  Calendar,
  DollarSign,
  FileCheck2,
  Trash2,
  CheckCircle2,
  X,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/common/EmptyState';
import { ReembolsoEmprestimo, Lancamento } from '../types';
import {
  formatarMoeda,
  formatarDataBR,
  getDataHojeISO,
  getMesAtualISO,
} from '../utils/formatters';
import { CurrencyInput } from '../components/common/CurrencyInput';

export const ReembolsosView: React.FC = () => {
  const {
    reembolsos,
    salvarReembolso,
    excluirReembolso,
    lancamentos,
    contas,
    salvarLancamento,
    showToast,
    openConfirm,
    mesSelecionado,
  } = useApp();

  const [modalAberto, setModalAberto] = useState(false);
  const [socioSelecionado, setSocioSelecionado] = useState<string>('todos');

  // Campos do formulário
  const [nomeSocio, setNomeSocio] = useState('Sócio Fundador');
  const [tipo, setTipo] = useState<'reembolso' | 'emprestimo_socio' | 'distribuicao_lucros'>('reembolso');
  const [descricao, setDescricao] = useState('');
  const [valorCents, setValorCents] = useState(0);
  const [data, setData] = useState(getDataHojeISO());
  const [comprovanteNome, setComprovanteNome] = useState('');

  // Lista única de nomes de sócios existentes
  const sociosDisponiveis = useMemo(() => {
    const setSocios = new Set<string>();
    reembolsos.forEach((r) => setSocios.add(r.socioNome));
    return Array.from(setSocios);
  }, [reembolsos]);

  // Reembolsos filtrados
  const reembolsosFiltrados = useMemo(() => {
    return reembolsos.filter((r) => {
      if (socioSelecionado !== 'todos' && r.socioNome !== socioSelecionado) return false;
      return true;
    });
  }, [reembolsos, socioSelecionado]);

  // Totais por Sócio
  const metricasSocios = useMemo(() => {
    let totalReembolsoPendente = 0;
    let totalAporteDevolver = 0;
    let totalDistribuicaoLucros = 0;

    reembolsos.forEach((r) => {
      if (socioSelecionado === 'todos' || r.socioNome === socioSelecionado) {
        if (r.tipo === 'reembolso' && r.status === 'pendente') {
          totalReembolsoPendente += r.valor;
        } else if (r.tipo === 'emprestimo_socio' && r.status === 'pendente') {
          totalAporteDevolver += r.valor;
        } else if (r.tipo === 'distribuicao_lucros') {
          totalDistribuicaoLucros += r.valor;
        }
      }
    });

    return { totalReembolsoPendente, totalAporteDevolver, totalDistribuicaoLucros };
  }, [reembolsos, socioSelecionado]);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || valorCents <= 0) return;

    const novo: ReembolsoEmprestimo = {
      id: `reemb_${Date.now()}`,
      credor: nomeSocio,
      socioNome: nomeSocio,
      tipo,
      descricao,
      valor: valorCents,
      valorInvestido: valorCents,
      data,
      status: 'pendente',
      comprovanteNome: comprovanteNome || undefined,
    };

    salvarReembolso(novo);
    setModalAberto(false);
    setDescricao('');
    setValorCents(0);
    setComprovanteNome('');
    showToast('Registro de sócio salvo com sucesso!');
  };

  // Liquidação / Pagamento do Reembolso pela Agência
  const handleLiquidar = (r: ReembolsoEmprestimo) => {
    if (contas.length === 0) {
      showToast('Cadastre uma conta bancária para efetivar a saída financeira.', 'erro');
      return;
    }

    const mesAtual = getMesAtualISO();
    const valorEfetivo = r.valor || r.valorInvestido || 0;
    const lancamentoDespesa: Lancamento = {
      id: `lanc_reemb_${r.id}`,
      tipo: 'despesa',
      descricao: `Reembolso ao sócio: ${r.socioNome || r.credor} (${r.descricao})`,
      categoriaId: '',
      subcategoria: 'Reembolso a Sócios',
      grupo: 'Despesas Operacionais',
      contaBancariaId: contas[0].id,
      mesCompetencia: mesAtual,
      dataVencimento: getDataHojeISO(),
      dataPagamento: getDataHojeISO(),
      valorOrcado: valorEfetivo,
      valorRealizado: valorEfetivo,
      formaPagamento: 'pix',
      status: 'realizado',
      conciliado: true,
      tags: ['Reembolso de Sócio'],
      observacoes: `Comprovante: ${r.comprovanteNome || 'Sem anexo'}`,
    };

    salvarLancamento(lancamentoDespesa);

    salvarReembolso({
      ...r,
      status: 'pago',
      dataLiquidacao: getDataHojeISO(),
    });

    showToast(`Reembolso de ${formatarMoeda(valorEfetivo)} pago ao sócio e lançado na conta!`);
  };

  if (reembolsos.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Reembolsos e Empréstimos de Sócios
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Separe as despesas da agência pagas do bolso dos fundadores, mútuos e distribuição de lucros.
          </p>
        </div>

        <EmptyState
          titulo="Nenhum reembolso ou aporte registrado"
          descricao="Registre despesas corporativas pagas pelos sócios para reembolso, aportes de capital de giro (mútuo) e distribuição de lucros isenta."
          acaoTexto="Criar primeiro registro de sócio"
          onAcao={() => setModalAberto(true)}
        />

        {modalAberto && renderModal()}
      </div>
    );
  }

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
        <div className="bg-superficie dark:bg-navy border border-borda dark:border-borda-dark rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-borda dark:border-borda-dark pb-3">
            <h3 className="text-base font-bold text-texto-medio dark:text-texto-medio-dark">
              Novo Registro de Sócio
            </h3>
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="text-texto-medio hover:text-texto-medio cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSalvar} className="space-y-3 text-xs">
            <div>
              <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                Nome do Sócio *
              </label>
              <input
                type="text"
                required
                value={nomeSocio}
                onChange={(e) => setNomeSocio(e.target.value)}
                placeholder="Ex: Carlos Mendes"
                className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                Tipo de Operação *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 font-semibold"
              >
                <option value="reembolso">Reembolso (Despesa paga do próprio bolso)</option>
                <option value="emprestimo_socio">Aporte / Empréstimo do Sócio para a Agência (Mútuo)</option>
                <option value="distribuicao_lucros">Distribuição de Lucros aos Sócios</option>
              </select>
            </div>

            <div>
              <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                Descrição do Item ou Finalidade *
              </label>
              <input
                type="text"
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Licença ChatGPT pessoal usada na agência, Almoço com cliente XPTO..."
                className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  Valor (R$) *
                </label>
                <CurrencyInput valueCents={valorCents} onChangeCents={setValorCents} required />
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  Data da Ocorrência
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                Nome do Comprovante / Cupom Fiscal (Opcional)
              </label>
              <input
                type="text"
                value={comprovanteNome}
                onChange={(e) => setComprovanteNome(e.target.value)}
                placeholder="Ex: NF-e 4598 ou cupom_uber.pdf"
                className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-borda dark:border-borda-dark">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 bg-fundo-sutil dark:bg-superficie-dark text-texto-medio dark:text-texto-medio-dark rounded-[var(--radius-controle)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] font-semibold cursor-pointer"
              >
                Salvar Registro
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Reembolsos & Empréstimos de Sócios
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Controle de reembolsos operacionais, mútuo e distribuição de lucros.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sociosDisponiveis.length > 0 && (
            <select
              value={socioSelecionado}
              onChange={(e) => setSocioSelecionado(e.target.value)}
              className="text-xs rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 font-semibold"
            >
              <option value="todos">Todos os Sócios</option>
              {sociosDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-xs font-semibold cursor-pointer shadow-sutil"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro</span>
          </button>
        </div>
      </div>

      {/* Painel por Sócio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-1">
          <span className="text-[10px] uppercase font-semibold text-alerta">
            Reembolsos Pendentes (A Pagar ao Sócio)
          </span>
          <span className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark block tabular-nums">
            {formatarMoeda(metricasSocios.totalReembolsoPendente)}
          </span>
          <span className="text-[11px] text-texto-medio">Despesas adiantadas do bolso do sócio</span>
        </div>

        <div className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-1">
          <span className="text-[10px] uppercase font-semibold text-primaria">
            Aportes / Mútuos Pendentes de Devolução
          </span>
          <span className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark block tabular-nums">
            {formatarMoeda(metricasSocios.totalAporteDevolver)}
          </span>
          <span className="text-[11px] text-texto-medio">Capital injetado pelo sócio na agência</span>
        </div>

        <div className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-1">
          <span className="text-[10px] uppercase font-semibold text-sucesso">
            Distribuição de Lucros Acumulada
          </span>
          <span className="text-xl font-bold text-sucesso dark:text-texto-forte-dark block tabular-nums">
            {formatarMoeda(metricasSocios.totalDistribuicaoLucros)}
          </span>
          <span className="text-[11px] text-texto-medio">Retiradas isentas do ano</span>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="bg-superficie dark:bg-navy rounded-[var(--radius-card)] border border-borda dark:border-borda-dark shadow-sutil overflow-hidden">
        <div className="p-4 border-b border-borda dark:border-borda-dark">
          <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
            Histórico de Reembolsos e Aportes
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {reembolsosFiltrados.map((r) => (
            <div
              key={r.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-fundo-sutil/50 dark:hover:bg-fundo-sutil/30 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-texto-medio dark:text-texto-medio-dark">{r.socioNome}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.tipo === 'reembolso'
                        ? 'bg-alerta-suave text-alerta'
                        : r.tipo === 'emprestimo_socio'
                        ? 'bg-primaria-suave text-primaria'
                        : 'bg-sucesso-suave text-sucesso'
                    }`}
                  >
                    {r.tipo === 'reembolso'
                      ? 'Reembolso'
                      : r.tipo === 'emprestimo_socio'
                      ? 'Aporte / Mútuo'
                      : 'Distribuição de Lucros'}
                  </span>
                </div>
                <p className="text-texto-medio dark:text-texto-medio-dark mt-1 font-medium">{r.descricao}</p>
                <div className="flex items-center gap-3 text-[10px] text-texto-medio mt-0.5">
                  <span>Data: {formatarDataBR(r.data)}</span>
                  {r.comprovanteNome && <span>Comprovante: {r.comprovanteNome}</span>}
                  {r.dataLiquidacao && <span>Liquidado em: {formatarDataBR(r.dataLiquidacao)}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-sm font-bold tabular-nums text-texto-medio dark:text-texto-medio-dark">
                  {formatarMoeda(r.valor)}
                </span>

                {r.status === 'pendente' ? (
                  <button
                    type="button"
                    onClick={() => handleLiquidar(r)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primaria hover:bg-primaria-hover text-white rounded text-xs font-semibold cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pagar / Liquidar</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-sucesso-suave text-sucesso text-[10px] font-bold uppercase">
                    Liquidado
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    openConfirm({
                      titulo: 'Excluir Registro',
                      mensagem: `Deseja remover este registro do sócio ${r.socioNome}?`,
                      confirmTexto: 'Excluir',
                      perigo: true,
                      onConfirm: () => {
                        excluirReembolso(r.id);
                        showToast('Registro excluído.');
                      },
                    });
                  }}
                  className="p-1 text-texto-medio hover:text-perigo cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalAberto && renderModal()}
    </div>
  );
};
