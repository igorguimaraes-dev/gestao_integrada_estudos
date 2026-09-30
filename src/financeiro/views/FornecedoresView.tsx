import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  CheckCircle2,
  Copy,
  DollarSign,
  FileCheck,
  AlertCircle,
  FileText,
  Search,
  Trash2,
  Edit2,
  X,
  Layers,
  LayoutList,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/common/EmptyState';
import { Fornecedor, Lancamento } from '../types';
import {
  formatarMoeda,
  formatarDataBR,
  formatarPorcentagem,
  getDataHojeISO,
  getMesAtualISO,
} from '../utils/formatters';
import { CurrencyInput } from '../components/common/CurrencyInput';
import { normalizarTextoLegivel } from '../../utils/textoLegivel';

const formatarNomePrestador = (nome: string): string => {
  const siglas = new Set(['seo', 'pj', 'cpf', 'cnpj']);
  return (nome || '').toLocaleLowerCase('pt-BR').replace(/\p{L}+/gu, (palavra) =>
    siglas.has(palavra) ? palavra.toUpperCase() : `${palavra.charAt(0).toLocaleUpperCase('pt-BR')}${palavra.slice(1)}`
  );
};

const corrigirTextoPrestador = normalizarTextoLegivel;

export const FornecedoresView: React.FC = () => {
  const {
    fornecedores,
    salvarFornecedor,
    excluirFornecedor,
    lancamentos,
    contas,
    salvarLancamento,
    showToast,
    openConfirm,
    mesSelecionado,
  } = useApp();

  const [busca, setBusca] = useState('');
  const [modoVisualizacao, setModoVisualizacao] = useState<'lista' | 'cards'>('lista');
  const [inativosExpandidos, setInativosExpandidos] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] = useState<Fornecedor | null>(null);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [funcao, setFuncao] = useState('Designer');
  const [tipoRemuneracao, setTipoRemuneracao] = useState<NonNullable<Fornecedor['tipoRemuneracao']>>('fixo_mensal');
  const [valorPadraoCents, setValorPadraoCents] = useState(0);
  const [chavePix, setChavePix] = useState('');
  const [banco, setBanco] = useState('');
  const [agencia, setAgencia] = useState('');
  const [contaBancaria, setContaBancaria] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [diaPagamento, setDiaPagamento] = useState(10);
  const [ativo, setAtivo] = useState(true);

  // Fornecedores filtrados
  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter((f) => {
      if (busca) {
        const termo = busca.toLowerCase();
        return (
          f.nome.toLowerCase().includes(termo) ||
          (f.funcao || '').toLowerCase().includes(termo) ||
          (f.razaoSocial && f.razaoSocial.toLowerCase().includes(termo)) ||
          (f.chavePix && f.chavePix.toLowerCase().includes(termo))
        );
      }
      return true;
    }).sort((a, b) => {
      if (Boolean(a.ativo) !== Boolean(b.ativo)) return a.ativo ? -1 : 1;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }, [fornecedores, busca]);

  // Checklist de Pagamentos do Mês Selecionado
  const mesAtual = mesSelecionado || getMesAtualISO();
  const lancamentosMesEquipe = useMemo(() => {
    return lancamentos.filter((l) => l.mesCompetencia === mesAtual && l.fornecedorId);
  }, [lancamentos, mesAtual]);

  // Métricas de Eficiência Operacional (Gasto Equipe vs Receita Bruta)
  const metricasEquipe = useMemo(() => {
    let gastoEquipe = 0;
    let receitaBruta = 0;

    lancamentos.forEach((l) => {
      if (l.mesCompetencia === mesAtual && l.status !== 'cancelado') {
        const val = l.valorRealizado !== undefined ? l.valorRealizado : l.valorOrcado;
        if (l.fornecedorId && l.tipo === 'despesa') {
          gastoEquipe += val;
        }
        if (l.tipo === 'receita') {
          receitaBruta += val;
        }
      }
    });

    const percentualSobreReceita = receitaBruta > 0 ? (gastoEquipe / receitaBruta) * 100 : 0;
    return { gastoEquipe, receitaBruta, percentualSobreReceita };
  }, [lancamentos, mesAtual]);

  const handleAbrirModal = (f?: Fornecedor) => {
    if (f) {
      setFornecedorEditando(f);
      setNome(f.nome);
      setRazaoSocial(f.razaoSocial || '');
      setCnpjCpf(f.cnpjCpf || '');
      setFuncao(corrigirTextoPrestador(f.funcao));
      setTipoRemuneracao(f.tipoRemuneracao || 'fixo_mensal');
      setValorPadraoCents(f.valorPadrao ?? f.valorMensalCombinado ?? 0);
      setChavePix(f.chavePix || '');
      setBanco(f.banco || '');
      setAgencia(f.agencia || '');
      setContaBancaria(f.conta || '');
      setEmail(f.email || '');
      setTelefone(f.telefone || '');
      setDiaPagamento(30);
      setAtivo(f.ativo);
    } else {
      setFornecedorEditando(null);
      setNome('');
      setRazaoSocial('');
      setCnpjCpf('');
      setFuncao('Designer');
      setTipoRemuneracao('fixo_mensal');
      setValorPadraoCents(0);
      setChavePix('');
      setBanco('');
      setAgencia('');
      setContaBancaria('');
      setEmail('');
      setTelefone('');
      setDiaPagamento(30);
      setAtivo(true);
    }
    setModalAberto(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    const novo: Fornecedor = {
      id: fornecedorEditando ? fornecedorEditando.id : `forn_${Date.now()}`,
      nome,
      razaoSocial,
      cnpjCpf,
      funcao,
      tipoRemuneracao,
      valorPadrao: valorPadraoCents,
      chavePix,
      banco,
      agencia,
      conta: contaBancaria,
      email,
      telefone,
      diaPagamento: 30,
      diaPagamentoPadrao: 30,
      ativo,
      status: ativo ? 'ativo' : 'inativo',
    };

    salvarFornecedor(novo);
    setModalAberto(false);
  };

  const handleCopiarPix = (pix: string, nomeForn: string) => {
    navigator.clipboard.writeText(pix);
    showToast(`Chave PIX de ${nomeForn} copiada: ${pix}`);
  };

  // Alternar NF recebida no lançamento do mês
  const handleToggleNF = (lancamento: Lancamento) => {
    salvarLancamento({
      ...lancamento,
      nfRecebida: !lancamento.nfRecebida,
    });
    showToast(`Status da NF atualizado para ${!lancamento.nfRecebida ? 'Recebida' : 'Pendente'}`);
  };

  // Gerar checklist / despesas da equipe para o mês corrente
  const handleGerarChecklistMes = () => {
    const ativos = fornecedores.filter((f) => f.ativo);
    const [anoStr, mesStr] = mesAtual.split('-');
    let criados = 0;

    ativos.forEach((f) => {
      const jaExiste = lancamentos.some(
        (l) => l.fornecedorId === f.id && l.mesCompetencia === mesAtual
      );
      if (!jaExiste && f.valorPadrao > 0) {
        const ultimoDiaDoMes = new Date(Number(anoStr), Number(mesStr), 0).getDate();
        const dia = String(Math.min(30, ultimoDiaDoMes)).padStart(2, '0');
        const novo: Lancamento = {
          id: `lanc_forn_${f.id}_${mesAtual}`,
          tipo: 'despesa',
          descricao: `Honorários ${f.nome} (${f.funcao}) - ${mesStr}/${anoStr}`,
          categoriaId: '',
          subcategoria: 'Freelancers e Terceiros',
          grupo: 'Custos Diretos',
          fornecedorId: f.id,
          contaBancariaId: contas[0]?.id || '',
          mesCompetencia: mesAtual,
          dataVencimento: `${anoStr}-${mesStr}-${dia}`,
          valorOrcado: f.valorPadrao,
          formaPagamento: 'pix',
          status: 'previsto',
          conciliado: false,
          nfRecebida: false,
          tags: ['Equipe PJ'],
        };
        salvarLancamento(novo);
        criados++;
      }
    });

    if (criados > 0) {
      showToast(`Checklist gerado: ${criados} lançamentos de honorários de prestadores criados!`);
    } else {
      showToast('Todos os prestadores ativos já possuem lançamentos gerados para este mês.', 'info');
    }
  };

  if (fornecedores.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
            Equipe e Prestadores PJ
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Cadastro de freelancers, controle de chave PIX, retenção de NF e checklist de pagamentos.
          </p>
        </div>

        <EmptyState
          titulo="Nenhum prestador cadastrado ainda"
          descricao="Cadastre os membros PJ da equipe (designers, copywriters, gestores de tráfego, desenvolvedores) para controlar o checklist de NFs, copiar chaves PIX rapidamente e medir o peso da equipe sobre o faturamento."
          acaoTexto="Cadastrar primeiro prestador"
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
              {fornecedorEditando ? 'Editar Prestador' : 'Novo Prestador / Freelancer'}
            </h3>
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="text-texto-medio hover:text-texto-medio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSalvar} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  Nome do Profissional *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                />
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  Função / Especialidade
                </label>
                <input
                  type="text"
                  value={funcao}
                  onChange={(e) => setFuncao(e.target.value)}
                  placeholder="Ex: Designer Sênior, Gestor de Tráfego, Copywriter..."
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  CNPJ / CPF
                </label>
                <input
                  type="text"
                  value={cnpjCpf}
                  onChange={(e) => setCnpjCpf(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  Tipo de Remuneração
                </label>
                <select
                  value={tipoRemuneracao}
                  onChange={(e) => setTipoRemuneracao(e.target.value as any)}
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2"
                >
                  <option value="fixo_mensal">Fixo Mensal</option>
                  <option value="por_hora">Valor / Hora</option>
                  <option value="por_projeto">Por Demanda / Projeto</option>
                </select>
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                  Valor Padrão (R$) *
                </label>
                <CurrencyInput
                  valueCents={valorPadraoCents}
                  onChangeCents={setValorPadraoCents}
                  required
                />
              </div>
            </div>

            {/* Dados Bancários & PIX */}
            <div className="p-3.5 rounded-[var(--radius-card)] bg-fundo-sutil dark:bg-superficie-dark/60 border border-borda dark:border-borda-dark space-y-3">
              <span className="font-bold text-texto-medio dark:text-texto-medio-dark block uppercase text-[11px]">
                Dados para Pagamento
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Chave PIX *
                  </label>
                  <input
                    type="text"
                    required
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder="E-mail, CPF, CNPJ ou telefone..."
                    className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Status do prestador
                  </label>
                  <select
                    value={ativo ? 'ativo' : 'inativo'}
                    onChange={(e) => setAtivo(e.target.value === 'ativo')}
                    className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Vencimento padrão
                  </label>
                  <div className="rounded-[var(--radius-controle)] border border-borda bg-fundo-sutil px-3 py-2 text-texto-medio dark:border-borda-dark dark:bg-superficie-dark dark:text-texto-medio-dark">
                    Todo dia 30
                  </div>
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
                Salvar Prestador
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
            Equipe e Prestadores PJ
          </h2>
          <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
            Controle de honorários, checklist de NFs e eficiência de folha.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModoVisualizacao((modo) => modo === 'lista' ? 'cards' : 'lista')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-borda dark:border-borda-dark text-texto-medio dark:text-texto-medio-dark rounded-[var(--radius-controle)] text-xs font-semibold hover:bg-fundo-sutil dark:hover:bg-fundo-sutil cursor-pointer"
            title={modoVisualizacao === 'lista' ? 'Exibir em cards' : 'Exibir em lista'}
          >
            {modoVisualizacao === 'lista' ? <LayoutGrid className="w-3.5 h-3.5" /> : <LayoutList className="w-3.5 h-3.5" />}
            <span>{modoVisualizacao === 'lista' ? 'Cards' : 'Lista'}</span>
          </button>
          <button
            type="button"
            onClick={handleGerarChecklistMes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sucesso-suave hover:bg-sucesso-suave text-white rounded-[var(--radius-controle)] text-xs font-semibold shadow-sutil cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Gerar Checklist do Mês</span>
          </button>

          <button
            type="button"
            onClick={() => handleAbrirModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-xs font-semibold shadow-sutil cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Prestador</span>
          </button>
        </div>
      </div>

      {/* Indicador de Eficiência Operacional */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil">
        <div>
          <span className="text-[10px] text-texto-medio uppercase font-semibold block">
            Custo com Equipe no Mês
          </span>
          <span className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark tabular-nums">
            {formatarMoeda(metricasEquipe.gastoEquipe)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-texto-medio uppercase font-semibold block">
            Receita Bruta do Mês
          </span>
          <span className="text-xl font-bold text-sucesso dark:text-texto-forte-dark tabular-nums">
            {formatarMoeda(metricasEquipe.receitaBruta)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-texto-medio uppercase font-semibold block">
            % Equipe sobre Faturamento (Benchmark: &lt; 40%)
          </span>
          <span
            className={`text-xl font-bold tabular-nums ${
              metricasEquipe.percentualSobreReceita > 50 ? 'text-alerta' : 'text-primaria dark:text-primaria-clara'
            }`}
          >
            {formatarPorcentagem(metricasEquipe.percentualSobreReceita)}
          </span>
        </div>
      </div>

      {/* Checklist Mensal de Pagamentos da Equipe */}
      {lancamentosMesEquipe.length > 0 && (
        <div className="p-4 rounded-[var(--radius-card)] bg-primaria-suave/60 dark:bg-navy-claro/30 border border-primaria dark:border-borda-dark/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primaria dark:text-primaria-clara flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-primaria" />
              <span>Checklist de Pagamentos ({mesAtual})</span>
            </h3>
            <span className="text-xs text-primaria dark:text-primaria-clara">
              {lancamentosMesEquipe.filter((l) => l.status === 'realizado').length} de {lancamentosMesEquipe.length} pagos
            </span>
          </div>

          <div className="space-y-2">
            {lancamentosMesEquipe.map((l) => {
              const forn = fornecedores.find((f) => f.id === l.fornecedorId);
              return (
                <div
                  key={l.id}
                  className="p-3 rounded-[var(--radius-controle)] bg-superficie dark:bg-navy border border-primaria dark:border-borda-dark flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleNF(l)}
                      className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        l.nfRecebida
                          ? 'bg-sucesso-suave text-sucesso'
                          : 'bg-alerta-suave text-alerta'
                      }`}
                    >
                      {l.nfRecebida ? '✓ NF Recebida' : 'NF Pendente'}
                    </button>
                    <div>
                      <span className="font-semibold text-texto-medio dark:text-texto-medio-dark block">
                        {forn?.nome} ({forn?.funcao})
                      </span>
                      <span className="text-[10px] text-texto-medio">
                        Venc: {formatarDataBR(l.dataVencimento)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {forn?.chavePix && (
                      <button
                        type="button"
                        onClick={() => handleCopiarPix(forn.chavePix, forn.nome)}
                        className="p-1 text-texto-medio hover:text-primaria cursor-pointer"
                        title="Copiar PIX"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="font-bold tabular-nums text-texto-medio dark:text-texto-medio-dark">
                      {formatarMoeda(l.valorOrcado)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        l.status === 'realizado'
                          ? 'bg-sucesso-suave text-sucesso'
                          : 'bg-fundo-sutil text-texto-medio'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de Prestadores */}
      {modoVisualizacao === 'lista' && (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-borda bg-superficie shadow-sutil dark:border-borda-dark dark:bg-navy">
          <div className="hidden grid-cols-[minmax(180px,1.4fr)_110px_minmax(150px,1fr)_140px_110px_72px] gap-4 border-b border-borda bg-fundo-sutil px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-texto-medio dark:border-borda-dark dark:bg-superficie-dark/60 md:grid">
            <span>Prestador</span><span>Status</span><span>Chave PIX</span><span>Remuneração</span><span>Vencimento</span><span className="text-right">Ações</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {fornecedoresFiltrados.map((f, indice) => (
              <React.Fragment key={f.id}>
                {indice === 0 && f.ativo && (
                  <div className="bg-sucesso-suave px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-sucesso dark:bg-superficie-dark/30 dark:text-texto-forte-dark">
                    Prestadores ativos
                  </div>
                )}
                {!f.ativo && (indice === 0 || fornecedoresFiltrados[indice - 1].ativo) && (
                  <button
                    type="button"
                    onClick={() => setInativosExpandidos((expandido) => !expandido)}
                    className="flex w-full items-center justify-between bg-fundo-sutil px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-texto-medio transition-colors hover:bg-fundo-sutil dark:bg-superficie-dark/60 dark:text-texto-medio-dark dark:hover:bg-fundo-sutil"
                    aria-expanded={inativosExpandidos}
                  >
                    <span>Prestadores inativos</span>
                    <span className="flex items-center gap-1.5 normal-case tracking-normal">
                      {fornecedoresFiltrados.filter((fornecedor) => !fornecedor.ativo).length}
                      {inativosExpandidos ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                )}
              {(f.ativo || inativosExpandidos) && <div className="grid gap-2 px-4 py-3 text-xs md:grid-cols-[minmax(180px,1.4fr)_110px_minmax(150px,1fr)_140px_110px_72px] md:items-center md:gap-4">
                <div>
                  <p className="font-bold text-texto-medio dark:text-texto-medio-dark">{formatarNomePrestador(f.nome)}</p>
                  <p className="mt-0.5 text-[11px] text-primaria dark:text-primaria-clara">{corrigirTextoPrestador(f.funcao) || 'Função não informada'}</p>
                </div>
                <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${f.ativo ? 'bg-sucesso-suave text-sucesso' : 'bg-fundo-sutil text-texto-medio'}`}>
                  {f.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <button type="button" onClick={() => handleCopiarPix(f.chavePix, f.nome)} className="w-fit font-mono text-[11px] text-primaria hover:underline dark:text-primaria-clara">
                  {f.chavePix || '—'}
                </button>
                <span className="font-semibold text-texto-medio dark:text-texto-medio-dark">
                  {f.valorPadrao || f.valorMensalCombinado ? formatarMoeda(f.valorPadrao ?? f.valorMensalCombinado ?? 0) : 'Não informado'}
                </span>
                <span className="text-texto-medio dark:text-texto-medio-dark">Todo dia 30</span>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => handleAbrirModal(f)} className="p-1 text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio" title="Editar prestador"><Edit2 className="h-4 w-4" /></button>
                  <button type="button" onClick={() => openConfirm({ titulo: 'Excluir Prestador', mensagem: `Deseja excluir ${f.nome}?`, confirmTexto: 'Excluir', perigo: true, onConfirm: () => { excluirFornecedor(f.id); showToast('Prestador excluído.'); } })} className="p-1 text-perigo hover:text-perigo" title="Excluir prestador"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className={modoVisualizacao === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'hidden'}>
        {fornecedoresFiltrados.map((f) => (
          <div
            key={f.id}
            className="p-4 rounded-[var(--radius-card)] bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil flex flex-col justify-between gap-3"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">{formatarNomePrestador(f.nome)}</h3>
                  <span className="text-xs text-primaria dark:text-primaria-clara font-semibold block">
                    {corrigirTextoPrestador(f.funcao) || 'Função não informada'}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    f.ativo ? 'bg-sucesso-suave text-sucesso' : 'bg-fundo-sutil text-texto-medio'
                  }`}
                >
                  {f.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-texto-medio dark:text-texto-medio-dark">
                <div className="flex items-center justify-between">
                  <span className="text-texto-medio">Remuneração:</span>
                  <span className="font-bold tabular-nums text-texto-medio dark:text-texto-medio-dark">
                    {f.valorPadrao || f.valorMensalCombinado
                      ? `${formatarMoeda(f.valorPadrao ?? f.valorMensalCombinado ?? 0)} (${(f.tipoRemuneracao || 'não informado').replace('_', ' ')})`
                      : 'Não informado'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-texto-medio">Dia Pagamento:</span>
                  <span>Todo dia {f.diaPagamentoPadrao || 10}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-texto-medio">Chave PIX:</span>
                  <button
                    type="button"
                    onClick={() => handleCopiarPix(f.chavePix, f.nome)}
                    className="inline-flex items-center gap-1 text-primaria dark:text-primaria-clara hover:underline font-mono text-[11px] cursor-pointer"
                  >
                    <span className="truncate max-w-36">{f.chavePix}</span>
                    <Copy className="w-3 h-3 shrink-0" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 pt-3 border-t border-borda dark:border-borda-dark">
              <button
                type="button"
                onClick={() => handleAbrirModal(f)}
                className="p-1 text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  openConfirm({
                    titulo: 'Excluir Prestador',
                    mensagem: `Deseja excluir ${f.nome}?`,
                    confirmTexto: 'Excluir',
                    perigo: true,
                    onConfirm: () => {
                      excluirFornecedor(f.id);
                      showToast('Prestador excluído.');
                    },
                  });
                }}
                className="p-1 text-perigo hover:text-perigo cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalAberto && renderModal()}
    </div>
  );
};
