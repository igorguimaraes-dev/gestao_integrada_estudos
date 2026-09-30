import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Calendar,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  Mail,
  Phone,
  CheckCircle2,
  Trash2,
  Edit2,
  Search,
  X,
  Play,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/common/EmptyState';
import { Cliente, StatusCliente, Lancamento } from '../types';
import {
  formatarMoeda,
  formatarDataBR,
  formatarCNPJouCPF,
  getDataHojeISO,
  getMesAtualISO,
} from '../utils/formatters';
import { CurrencyInput } from '../components/common/CurrencyInput';

export const ClientesView: React.FC = () => {
  const {
    clientes,
    salvarCliente,
    excluirCliente,
    lancamentos,
    contas,
    salvarLancamento,
    showToast,
    openConfirm,
    mesSelecionado,
  } = useApp();

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [clienteDetalhes, setClienteDetalhes] = useState<Cliente | null>(null);

  // Modal de Novo / Editar Cliente
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  // Campos do formulário
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [emailFinanceiro, setEmailFinanceiro] = useState('');
  const [telefone, setTelefone] = useState('');
  const [contatoResponsavel, setContatoResponsavel] = useState('');
  const [valorMensalCents, setValorMensalCents] = useState(0);
  const [planoServico, setPlanoServico] = useState('Fee Mensal Performance');
  const [diaVencimento, setDiaVencimento] = useState(10);
  const [dataInicio, setDataInicio] = useState(getDataHojeISO());
  const [dataFim, setDataFim] = useState('');
  const [renovacaoAutomatica, setRenovacaoAutomatica] = useState(true);
  const [indiceReajuste, setIndiceReajuste] = useState('IPCA');
  const [percentualReajuste, setPercentualReajuste] = useState(0);
  const [statusCliente, setStatusCliente] = useState<StatusCliente>('ativo');

  const hoje = getDataHojeISO();

  // Clientes filtrados
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false;
      if (busca) {
        const termo = busca.toLowerCase();
        const match =
          c.nomeRazaoSocial.toLowerCase().includes(termo) ||
          (c.nomeFantasia && c.nomeFantasia.toLowerCase().includes(termo)) ||
          (c.cnpjCpf && c.cnpjCpf.includes(termo)) ||
          (c.planoServico && c.planoServico.toLowerCase().includes(termo));
        if (!match) return false;
      }
      return true;
    });
  }, [clientes, busca, filtroStatus]);

  // Alerta de contratos perto do vencimento (30 e 60 dias)
  const contratosPertoFim = useMemo(() => {
    const data60 = new Date();
    data60.setDate(data60.getDate() + 60);
    const data60Str = data60.toISOString().split('T')[0];

    return clientes.filter((c) => {
      if (c.status !== 'ativo' || !c.dataFim) return false;
      return c.dataFim >= hoje && c.dataFim <= data60Str;
    });
  }, [clientes, hoje]);

  // Histórico financeiro do cliente selecionado para detalhes
  const historicoCliente = useMemo(() => {
    if (!clienteDetalhes) return { faturado: 0, inadimplente: 0, receitasMensais: [] };

    const lances = lancamentos.filter((l) => l.clienteId === clienteDetalhes.id && l.status !== 'cancelado');
    let faturado = 0;
    let inadimplente = 0;
    const mapaMeses: Record<string, number> = {};

    lances.forEach((l) => {
      const val = l.valorRealizado !== undefined ? l.valorRealizado : l.valorOrcado;
      if (l.status === 'realizado') {
        faturado += val;
      } else if (l.status === 'vencido') {
        inadimplente += l.valorOrcado;
      }
      mapaMeses[l.mesCompetencia] = (mapaMeses[l.mesCompetencia] || 0) + val / 100;
    });

    const receitasMensais = Object.entries(mapaMeses).map(([mes, valor]) => ({
      mes: mes.split('-')[1] + '/' + mes.split('-')[0].slice(2),
      valor,
    }));

    return { faturado, inadimplente, receitasMensais, lancamentos: lances };
  }, [clienteDetalhes, lancamentos]);

  // Handler: Abrir modal de criação ou edição
  const handleAbrirModal = (c?: Cliente) => {
    if (c) {
      setClienteEditando(c);
      setRazaoSocial(c.nomeRazaoSocial);
      setNomeFantasia(c.nomeFantasia || '');
      setCnpjCpf(c.cnpjCpf || '');
      setEmailFinanceiro(c.emailFinanceiro || '');
      setTelefone(c.telefone || '');
      setContatoResponsavel(c.contatoResponsavel || '');
      setValorMensalCents(c.valorMensal);
      setPlanoServico(c.planoServico);
      setDiaVencimento(c.diaVencimento);
      setDataInicio(c.dataInicio);
      setDataFim(c.dataFim || '');
      setRenovacaoAutomatica(c.renovacaoAutomatica);
      setIndiceReajuste(c.indiceReajuste || 'IPCA');
      setPercentualReajuste(c.percentualReajuste || 0);
      setStatusCliente(c.status);
    } else {
      setClienteEditando(null);
      setRazaoSocial('');
      setNomeFantasia('');
      setCnpjCpf('');
      setEmailFinanceiro('');
      setTelefone('');
      setContatoResponsavel('');
      setValorMensalCents(0);
      setPlanoServico('Fee Mensal Retainer');
      setDiaVencimento(10);
      setDataInicio(getDataHojeISO());
      setDataFim('');
      setRenovacaoAutomatica(true);
      setIndiceReajuste('IPCA');
      setPercentualReajuste(0);
      setStatusCliente('ativo');
    }
    setModalAberto(true);
  };

  // Handler: Salvar Cliente
  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial) return;

    const novo: Cliente = {
      id: clienteEditando ? clienteEditando.id : `cli_${Date.now()}`,
      nomeRazaoSocial: razaoSocial,
      nomeFantasia,
      cnpjCpf,
      emailFinanceiro,
      telefone,
      contatoResponsavel,
      valorMensal: valorMensalCents,
      planoServico,
      diaVencimento,
      dataInicio,
      dataFim: dataFim || undefined,
      renovacaoAutomatica,
      indiceReajuste,
      percentualReajuste,
      status: statusCliente,
    };

    salvarCliente(novo);
    setModalAberto(false);
    showToast(`Cliente ${novo.nomeRazaoSocial} salvo com sucesso!`);
  };

  // Ação 'Gerar faturamento do mês': cria os lançamentos de receita de todos os clientes ativos com 1 clique
  const handleGerarFaturamentoMes = () => {
    const clientesAtivos = clientes.filter((c) => c.status === 'ativo');
    if (clientesAtivos.length === 0) {
      showToast('Nenhum cliente ativo para faturar.', 'info');
      return;
    }

    const mesRef = mesSelecionado || getMesAtualISO();
    const [anoStr, mesStr] = mesRef.split('-');

    let gerados = 0;
    clientesAtivos.forEach((c) => {
      // Verifica se já existe faturamento para este cliente no mês
      const jaExiste = lancamentos.some(
        (l) => l.clienteId === c.id && l.mesCompetencia === mesRef && l.tipo === 'receita'
      );
      if (!jaExiste) {
        const dia = String(Math.min(28, c.diaVencimento)).padStart(2, '0');
        const dataVenc = `${anoStr}-${mesStr}-${dia}`;

        let valorFinal = c.valorMensal;
        if (c.percentualReajuste && c.percentualReajuste > 0) {
          valorFinal = Math.round(valorFinal * (1 + c.percentualReajuste / 100));
        }

        const novoLanc: Lancamento = {
          id: `lanc_fat_cli_${c.id}_${mesRef}`,
          tipo: 'receita',
          descricao: `Mensalidade ${c.nomeFantasia || c.nomeRazaoSocial} - ${mesStr}/${anoStr}`,
          categoriaId: '',
          subcategoria: 'Fee Mensal',
          grupo: 'Receitas Operacionais',
          clienteId: c.id,
          contaBancariaId: contas[0]?.id || '',
          mesCompetencia: mesRef,
          dataVencimento: dataVenc,
          valorOrcado: valorFinal,
          formaPagamento: 'pix',
          status: 'previsto',
          conciliado: false,
          tags: ['Faturamento em Lote'],
        };
        salvarLancamento(novoLanc);
        gerados++;
      }
    });

    if (gerados > 0) {
      showToast(`Faturamento em lote gerado: ${gerados} lançamentos de clientes criados para ${mesRef}!`);
    } else {
      showToast('Todos os clientes ativos já possuem faturamento lançado para este mês.', 'info');
    }
  };

  // Se nenhum cliente cadastrado
  if (clientes.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Clientes e Contratos (CRM Financeiro)
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Controle de retenção mensal (fee), prazos de vigência, reajustes e inadimplência.
          </p>
        </div>

        <EmptyState
          titulo="Nenhum cliente cadastrado ainda"
          descricao="Cadastre sua carteira de clientes de marketing para acompanhar contratos, MRR, gerar faturamento automático e monitorar renovações contratuais."
          acaoTexto="Cadastrar primeiro cliente"
          onAcao={() => handleAbrirModal()}
        />

        {modalAberto && renderModal()}
      </div>
    );
  }

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-superficie dark:bg-navy border border-borda dark:border-borda-dark rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
          <div className="flex items-center justify-between border-b border-borda dark:border-borda-dark pb-3">
            <h3 className="text-base font-bold text-texto-medio dark:text-texto-medio-dark">
              {clienteEditando ? 'Editar Cliente' : 'Novo Cliente & Contrato'}
            </h3>
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="text-texto-medio hover:text-texto-medio cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSalvar} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  Razão Social / Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Ex: Alpha Comunicação Ltda"
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                />
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  Nome Fantasia (Marca)
                </label>
                <input
                  type="text"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Ex: Alpha Tech"
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  CNPJ ou CPF
                </label>
                <input
                  type="text"
                  value={cnpjCpf}
                  onChange={(e) => setCnpjCpf(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                />
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  E-mail Financeiro
                </label>
                <input
                  type="email"
                  value={emailFinanceiro}
                  onChange={(e) => setEmailFinanceiro(e.target.value)}
                  placeholder="financeiro@cliente.com"
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                />
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                />
              </div>
            </div>

            {/* Dados Contratuais */}
            <div className="p-3.5 rounded-[var(--radius-card)] bg-fundo-sutil dark:bg-superficie-dark/60 border border-borda dark:border-borda-dark space-y-3">
              <span className="font-bold text-texto-medio dark:text-texto-medio-dark block uppercase text-[11px] tracking-wider">
                Parâmetros do Contrato (Retainer)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Valor Mensal (Fee) *
                  </label>
                  <CurrencyInput
                    valueCents={valorMensalCents}
                    onChangeCents={setValorMensalCents}
                    required
                  />
                </div>

                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Escopo / Plano
                  </label>
                  <input
                    type="text"
                    value={planoServico}
                    onChange={(e) => setPlanoServico(e.target.value)}
                    placeholder="Ex: Gestão de Tráfego + Redes"
                    className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Dia Vencimento (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={diaVencimento}
                    onChange={(e) => setDiaVencimento(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Início do Contrato
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Término (Opcional)
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Status do Cliente
                  </label>
                  <select
                    value={statusCliente}
                    onChange={(e) => setStatusCliente(e.target.value as StatusCliente)}
                    className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 font-semibold"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="pausado">Pausado</option>
                    <option value="em_negociacao">Em Negociação</option>
                    <option value="cancelado">Cancelado (Churn)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-texto-medio dark:text-texto-medio-dark">
                  <input
                    type="checkbox"
                    checked={renovacaoAutomatica}
                    onChange={(e) => setRenovacaoAutomatica(e.target.checked)}
                    className="rounded text-primaria focus:ring-primaria"
                  />
                  <span>Renovação automática de contrato</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-texto-medio dark:text-texto-medio-dark">Índice:</span>
                  <select
                    value={indiceReajuste}
                    onChange={(e) => setIndiceReajuste(e.target.value)}
                    className="rounded border border-borda-forte dark:border-borda-dark px-2 py-1 bg-superficie dark:bg-navy"
                  >
                    <option value="IPCA">IPCA</option>
                    <option value="IGP-M">IGP-M</option>
                    <option value="Fixo">Fixo</option>
                  </select>
                </div>
              </div>
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
                {clienteEditando ? 'Salvar Alterações' : 'Cadastrar Cliente'}
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
            Clientes & Contratos
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Gestão de retainers mensais, contratos vigentes e histórico financeiro.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Ação 'Gerar faturamento do mês' com 1 clique */}
          <button
            type="button"
            onClick={handleGerarFaturamentoMes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sucesso-suave hover:bg-sucesso-suave text-white rounded-[var(--radius-controle)] text-xs font-semibold shadow-sutil cursor-pointer"
            title="Lança todas as mensalidades dos clientes ativos para o mês com um clique"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Gerar Faturamento do Mês</span>
          </button>

          <button
            type="button"
            onClick={() => handleAbrirModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-xs font-semibold shadow-sutil cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Alerta de Contratos perto do vencimento */}
      {contratosPertoFim.length > 0 && (
        <div className="p-3.5 rounded-[var(--radius-card)] bg-alerta-suave dark:bg-superficie-dark/40 border border-alerta dark:border-borda-dark/60 flex items-center gap-3 text-xs text-alerta dark:text-texto-forte-dark">
          <AlertTriangle className="w-4 h-4 shrink-0 text-alerta" />
          <span>
            <strong>Atenção:</strong> {contratosPertoFim.length} contrato(s) de clientes estão finalizando nos próximos 60 dias:{' '}
            {contratosPertoFim.map((c) => c.nomeRazaoSocial).join(', ')}.
          </span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-texto-medio absolute left-3 top-2.5" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por razão social, nome fantasia, plano..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy"
          />
        </div>

        <div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativo">Apenas Ativos</option>
            <option value="pausado">Pausados</option>
            <option value="em_negociacao">Em Negociação</option>
            <option value="cancelado">Cancelados (Churn)</option>
          </select>
        </div>
      </div>

      {/* Cards de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesFiltrados.map((c) => (
          <div
            key={c.id}
            className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil flex flex-col justify-between gap-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark leading-snug">
                    {c.nomeFantasia || c.nomeRazaoSocial}
                  </h3>
                  {c.nomeFantasia && (
                    <span className="text-[10px] text-texto-medio block">{c.nomeRazaoSocial}</span>
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    c.status === 'ativo'
                      ? 'bg-sucesso-suave dark:bg-superficie-dark text-sucesso dark:text-texto-forte-dark'
                      : c.status === 'cancelado'
                      ? 'bg-perigo-suave dark:bg-superficie-dark text-perigo dark:text-texto-forte-dark'
                      : 'bg-alerta-suave dark:bg-superficie-dark text-alerta dark:text-texto-forte-dark'
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div className="mt-2.5 space-y-1 text-xs text-texto-medio dark:text-texto-medio-dark">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-texto-medio">Valor Contratado:</span>
                  <span className="text-primaria dark:text-primaria-clara text-sm font-bold tabular-nums">
                    {formatarMoeda(c.valorMensal)}/mês
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-texto-medio">Escopo:</span>
                  <span className="truncate max-w-36">{c.planoServico}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-texto-medio">Vencimento:</span>
                  <span>Todo dia {c.diaVencimento}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-borda dark:border-borda-dark text-xs">
              <button
                type="button"
                onClick={() => setClienteDetalhes(c)}
                className="text-primaria dark:text-primaria-clara hover:underline font-semibold cursor-pointer"
              >
                Ver Histórico
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAbrirModal(c)}
                  className="p-1 text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openConfirm({
                      titulo: 'Excluir Cliente',
                      mensagem: `Deseja excluir o cliente ${c.nomeRazaoSocial}? Lançamentos históricos serão mantidos.`,
                      confirmTexto: 'Excluir',
                      perigo: true,
                      onConfirm: () => {
                        excluirCliente(c.id);
                        showToast('Cliente excluído com sucesso.');
                      },
                    });
                  }}
                  className="p-1 text-perigo hover:text-perigo cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Histórico Financeiro do Cliente */}
      {clienteDetalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="bg-superficie dark:bg-navy border border-borda dark:border-borda-dark rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-borda dark:border-borda-dark pb-3">
              <div>
                <h3 className="text-base font-bold text-texto-medio dark:text-texto-medio-dark">
                  Histórico Financeiro: {clienteDetalhes.nomeRazaoSocial}
                </h3>
                <span className="text-xs text-texto-medio">
                  CNPJ/CPF: {clienteDetalhes.cnpjCpf || 'Não informado'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setClienteDetalhes(null)}
                className="text-texto-medio hover:text-texto-medio cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Métricas do Cliente */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark/60 border border-borda dark:border-borda-dark">
                <span className="text-texto-medio uppercase text-[10px] font-semibold block">Total Faturado Histórico</span>
                <span className="text-lg font-bold text-sucesso dark:text-texto-forte-dark tabular-nums">
                  {formatarMoeda(historicoCliente.faturado)}
                </span>
              </div>
              <div className="p-3 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark/60 border border-borda dark:border-borda-dark">
                <span className="text-texto-medio uppercase text-[10px] font-semibold block">Inadimplência / Atraso</span>
                <span className="text-lg font-bold text-perigo dark:text-texto-forte-dark tabular-nums">
                  {formatarMoeda(historicoCliente.inadimplente)}
                </span>
              </div>
            </div>

            {/* Gráfico de Receita Mês a Mês do Cliente */}
            {historicoCliente.receitasMensais.length > 0 && (
              <div className="h-44 w-full pt-2">
                <span className="text-xs font-semibold text-texto-medio dark:text-texto-medio-dark block mb-1">
                  Evolução do Faturamento Mensal (R$)
                </span>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicoCliente.receitasMensais}>
                    <XAxis dataKey="mes" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      formatter={(val: any) => formatarMoeda(Number(val) * 100)}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                    />
                    <Bar dataKey="valor" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-borda dark:border-borda-dark">
              <button
                type="button"
                onClick={() => setClienteDetalhes(null)}
                className="px-4 py-2 bg-fundo-sutil dark:bg-superficie-dark text-xs font-semibold rounded-[var(--radius-controle)]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      {modalAberto && renderModal()}
    </div>
  );
};
