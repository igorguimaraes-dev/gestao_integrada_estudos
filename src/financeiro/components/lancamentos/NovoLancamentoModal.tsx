import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, Paperclip, Repeat, CreditCard, ArrowRightLeft, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  TipoLancamento,
  FormaPagamento,
  Lancamento,
  LancamentoComprovante,
} from '../../types';
import { CurrencyInput } from '../common/CurrencyInput';
import { getDataHojeISO, getMesAtualISO, formatarMoeda, formatarDataBR } from '../../utils/formatters';
import {
  gerarLancamentosParcelados,
  gerarLancamentosRecorrentes,
  calcularStatusLancamento,
} from '../../utils/calculations';

export const NovoLancamentoModal: React.FC = () => {
  const {
    modalNovoLancamento,
    fecharModalNovoLancamento,
    contas,
    categorias,
    clientes,
    fornecedores,
    cartoes,
    salvarLancamento,
    salvarLancamentosEmLote,
    configuracoes,
    abrirScopeDialog,
  } = useApp();

  const { aberto, tipo = 'despesa', prefill, lancamentoEditando } = modalNovoLancamento;

  // Modo: único, recorrente, parcelado, transferencia
  const [modoCadastro, setModoCadastro] = useState<'unico' | 'recorrente' | 'parcelado'>('unico');
  const [tipoTransacao, setTipoTransacao] = useState<TipoLancamento>(tipo);

  // Campos básicos
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [contaBancariaId, setContaBancariaId] = useState('');
  const [contaDestinoId, setContaDestinoId] = useState('');
  const [mesCompetencia, setMesCompetencia] = useState(getMesAtualISO());
  const [dataVencimento, setDataVencimento] = useState(getDataHojeISO());
  const [jaRealizado, setJaRealizado] = useState(false);
  const [dataPagamento, setDataPagamento] = useState(getDataHojeISO());
  const [valorOrcadoCents, setValorOrcadoCents] = useState(0);
  const [valorRealizadoCents, setValorRealizadoCents] = useState(0);
  const [justificativaDivergencia, setJustificativaDivergencia] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [cartaoId, setCartaoId] = useState('');
  const [isSoftwareSubscription, setIsSoftwareSubscription] = useState(false);
  const [iofPercent, setIofPercent] = useState<number>(0);
  const [observacoes, setObservacoes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [comprovante, setComprovante] = useState<LancamentoComprovante | undefined>(undefined);

  // Campos Recorrência
  const [frequencia, setFrequencia] = useState<'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'>('mensal');
  const [terminoTipo, setTerminoTipo] = useState<'sem_fim' | 'apos_n' | 'ate_data'>('sem_fim');
  const [numeroOcorrencias, setNumeroOcorrencias] = useState(12);
  const [dataFimRecorrencia, setDataFimRecorrencia] = useState('');
  const [ajustarFimDeSemana, setAjustarFimDeSemana] = useState(true);
  const [reajusteAnualPct, setReajusteAnualPct] = useState(0);
  const [mesReajuste, setMesReajuste] = useState(1);

  // Campos Parcelamento
  const [modoCalculoParcela, setModoCalculoParcela] = useState<'total' | 'parcela'>('total');
  const [totalParcelas, setTotalParcelas] = useState(3);
  const [valorEntradaCents, setValorEntradaCents] = useState(0);

  // Pré-visualização de parcelas
  const [previewParcelas, setPreviewParcelas] = useState<any[]>([]);

  // Inicializa o modal quando abre
  useEffect(() => {
    if (!aberto) return;

    if (lancamentoEditando) {
      setTipoTransacao(lancamentoEditando.tipo);
      setDescricao(lancamentoEditando.descricao);
      setCategoriaId(lancamentoEditando.categoriaId);
      setClienteId(lancamentoEditando.clienteId || '');
      setFornecedorId(lancamentoEditando.fornecedorId || '');
      setContaBancariaId(lancamentoEditando.contaBancariaId);
      setContaDestinoId(lancamentoEditando.contaDestinoId || '');
      setMesCompetencia(lancamentoEditando.mesCompetencia);
      setDataVencimento(lancamentoEditando.dataVencimento);
      setValorOrcadoCents(lancamentoEditando.valorOrcado);
      setFormaPagamento(lancamentoEditando.formaPagamento);
      setCartaoId(lancamentoEditando.cartaoId || '');
      setIsSoftwareSubscription(!!lancamentoEditando.isSoftwareSubscription);
      setIofPercent(lancamentoEditando.iofPercent || 0);
      setObservacoes(lancamentoEditando.observacoes || '');
      setTagsInput(lancamentoEditando.tags?.join(', ') || '');
      setComprovante(lancamentoEditando.comprovante);

      if (lancamentoEditando.valorRealizado !== undefined) {
        setJaRealizado(true);
        setValorRealizadoCents(lancamentoEditando.valorRealizado);
        setDataPagamento(lancamentoEditando.dataPagamento || lancamentoEditando.dataVencimento);
        setJustificativaDivergencia(lancamentoEditando.justificativaDivergencia || '');
      } else {
        setJaRealizado(false);
        setValorRealizadoCents(lancamentoEditando.valorOrcado);
        setDataPagamento(getDataHojeISO());
      }
      setModoCadastro('unico');
    } else {
      // Criação nova
      const tp = tipo || 'despesa';
      setTipoTransacao(tp);
      setDescricao(prefill?.descricao || '');
      setMesCompetencia(prefill?.mesCompetencia || getMesAtualISO());
      setDataVencimento(prefill?.dataVencimento || getDataHojeISO());
      setDataPagamento(getDataHojeISO());
      setValorOrcadoCents(prefill?.valorOrcado || 0);
      setValorRealizadoCents(prefill?.valorOrcado || 0);
      setJaRealizado(false);
      setJustificativaDivergencia('');
      setFormaPagamento(prefill?.formaPagamento || 'pix');
      setObservacoes(prefill?.observacoes || '');
      setTagsInput('');
      setComprovante(undefined);
      setModoCadastro('unico');

      // Seleciona primeira categoria compatível
      const catsCompativeis = categorias.filter((c) => c.tipo === tp);
      setCategoriaId(prefill?.categoriaId || catsCompativeis[0]?.id || categorias[0]?.id || '');

      // Seleciona primeira conta disponível
      setContaBancariaId(prefill?.contaBancariaId || contas[0]?.id || '');
      setContaDestinoId(contas.length > 1 ? contas[1].id : '');
      setClienteId(prefill?.clienteId || '');
      setFornecedorId(prefill?.fornecedorId || '');
      setCartaoId(cartoes[0]?.id || '');
    }
  }, [aberto, lancamentoEditando, prefill, tipo, categorias, contas, cartoes]);

  // Atualiza prévia das parcelas
  useEffect(() => {
    if (modoCadastro === 'parcelado' && valorOrcadoCents > 0 && totalParcelas > 1) {
      const cat = categorias.find((c) => c.id === categoriaId);
      const preview = gerarLancamentosParcelados({
        descricaoBase: descricao || 'Lançamento parcelado',
        tipo: tipoTransacao as 'receita' | 'despesa',
        categoriaId: categoriaId || '',
        subcategoria: cat?.subcategoria || '',
        grupo: cat?.grupo || '',
        clienteId: clienteId || undefined,
        fornecedorId: fornecedorId || undefined,
        contaBancariaId: contaBancariaId || '',
        formaPagamento,
        totalParcelas,
        valorTotalCents: modoCalculoParcela === 'total' ? valorOrcadoCents : undefined,
        valorParcelaCents: modoCalculoParcela === 'parcela' ? valorOrcadoCents : undefined,
        valorEntradaCents,
        dataPrimeiraParcela: dataVencimento,
        ajustarFimDeSemana,
      });
      setPreviewParcelas(preview);
    } else {
      setPreviewParcelas([]);
    }
  }, [
    modoCadastro,
    valorOrcadoCents,
    totalParcelas,
    modoCalculoParcela,
    valorEntradaCents,
    dataVencimento,
    descricao,
    categoriaId,
    tipoTransacao,
    ajustarFimDeSemana,
    formaPagamento,
  ]);

  if (!aberto) return null;

  // Categorias filtradas pelo tipo
  const categoriasFiltradas = categorias.filter((c) => {
    if (tipoTransacao === 'transferencia') return false;
    return c.tipo === tipoTransacao;
  });

  // Handler para anexo de comprovante
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setComprovante({
        nome: file.name,
        tipo: file.type,
        base64: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (tipoTransacao !== 'transferencia' && !categoriaId && categoriasFiltradas.length > 0) {
      alert('Por favor, selecione uma categoria.');
      return;
    }

    if (!contaBancariaId && contas.length > 0) {
      alert('Por favor, selecione uma conta bancária.');
      return;
    }

    if (tipoTransacao === 'transferencia' && contaBancariaId === contaDestinoId) {
      alert('A conta de destino deve ser diferente da conta de origem na transferência.');
      return;
    }

    const cat = categorias.find((c) => c.id === categoriaId);
    const tags = tagsInput
      ? tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Se estiver editando lançamento existente
    if (lancamentoEditando) {
      const novosDados: Partial<Lancamento> = {
        tipo: tipoTransacao,
        descricao,
        categoriaId: cat?.id || '',
        subcategoria: cat?.subcategoria || '',
        grupo: cat?.grupo || '',
        clienteId: clienteId || undefined,
        fornecedorId: fornecedorId || undefined,
        contaBancariaId,
        contaDestinoId: tipoTransacao === 'transferencia' ? contaDestinoId : undefined,
        mesCompetencia,
        dataVencimento,
        valorOrcado: valorOrcadoCents,
        formaPagamento,
        cartaoId: formaPagamento === 'cartao' ? cartaoId : undefined,
        isSoftwareSubscription,
        iofPercent: isSoftwareSubscription ? iofPercent : undefined,
        observacoes,
        tags,
        comprovante,
      };

      if (jaRealizado) {
        novosDados.valorRealizado = valorRealizadoCents;
        novosDados.dataPagamento = dataPagamento;
        novosDados.justificativaDivergencia = justificativaDivergencia;
      } else {
        novosDados.valorRealizado = undefined;
        novosDados.dataPagamento = undefined;
        novosDados.justificativaDivergencia = undefined;
      }

      // Se faz parte de uma série, pergunta o escopo
      if (lancamentoEditando.serieId) {
        fecharModalNovoLancamento();
        abrirScopeDialog(lancamentoEditando, 'editar', novosDados);
        return;
      }

      salvarLancamento({
        ...lancamentoEditando,
        ...novosDados,
      } as Lancamento);

      fecharModalNovoLancamento();
      return;
    }

    // Criação nova
    if (tipoTransacao === 'transferencia') {
      const lancamento: Lancamento = {
        id: `lanc_transf_${Date.now()}`,
        tipo: 'transferencia',
        descricao: descricao || 'Transferência entre contas',
        categoriaId: '',
        subcategoria: 'Transferência',
        grupo: 'Transferência',
        contaBancariaId,
        contaDestinoId,
        mesCompetencia,
        dataVencimento,
        dataPagamento: jaRealizado ? dataPagamento : dataVencimento,
        valorOrcado: valorOrcadoCents,
        valorRealizado: jaRealizado ? valorRealizadoCents : valorOrcadoCents,
        formaPagamento: 'transferencia',
        status: 'realizado',
        conciliado: false,
        observacoes,
        tags: ['Transferência'],
      };
      salvarLancamento(lancamento);
      fecharModalNovoLancamento();
      return;
    }

    if (modoCadastro === 'recorrente') {
      const recorrentes = gerarLancamentosRecorrentes({
        descricao,
        tipo: tipoTransacao as 'receita' | 'despesa',
        categoriaId: cat?.id || '',
        subcategoria: cat?.subcategoria || '',
        grupo: cat?.grupo || '',
        clienteId: clienteId || undefined,
        fornecedorId: fornecedorId || undefined,
        contaBancariaId,
        formaPagamento,
        valorCents: valorOrcadoCents,
        frequencia,
        dataInicio: dataVencimento,
        terminoTipo,
        numeroOcorrencias,
        dataFim: dataFimRecorrencia,
        ajustarFimDeSemana,
        reajusteAnualPct,
        mesReajuste,
        horizonteMeses: configuracoes.horizonteProjecao || 24,
      });

      const comIds: Lancamento[] = recorrentes.map((r, idx) => ({
        ...r,
        id: `lanc_rec_${Date.now()}_${idx}`,
        cartaoId: formaPagamento === 'cartao' ? cartaoId : undefined,
        isSoftwareSubscription,
        iofPercent: isSoftwareSubscription ? iofPercent : undefined,
        observacoes,
        tags,
      }));

      salvarLancamentosEmLote(comIds);
      fecharModalNovoLancamento();
      return;
    }

    if (modoCadastro === 'parcelado') {
      const parcelados = gerarLancamentosParcelados({
        descricaoBase: descricao,
        tipo: tipoTransacao as 'receita' | 'despesa',
        categoriaId: cat?.id || '',
        subcategoria: cat?.subcategoria || '',
        grupo: cat?.grupo || '',
        clienteId: clienteId || undefined,
        fornecedorId: fornecedorId || undefined,
        contaBancariaId,
        formaPagamento,
        totalParcelas,
        valorTotalCents: modoCalculoParcela === 'total' ? valorOrcadoCents : undefined,
        valorParcelaCents: modoCalculoParcela === 'parcela' ? valorOrcadoCents : undefined,
        valorEntradaCents,
        dataPrimeiraParcela: dataVencimento,
        ajustarFimDeSemana,
      });

      const comIds: Lancamento[] = parcelados.map((p, idx) => ({
        ...p,
        id: `lanc_parc_${Date.now()}_${idx}`,
        cartaoId: formaPagamento === 'cartao' ? cartaoId : undefined,
        isSoftwareSubscription,
        iofPercent: isSoftwareSubscription ? iofPercent : undefined,
        observacoes,
        tags,
      }));

      salvarLancamentosEmLote(comIds);
      fecharModalNovoLancamento();
      return;
    }

    // Modo Único
    const novo: Lancamento = {
      id: `lanc_${Date.now()}`,
      tipo: tipoTransacao,
      descricao,
      categoriaId: cat?.id || '',
      subcategoria: cat?.subcategoria || '',
      grupo: cat?.grupo || '',
      clienteId: clienteId || undefined,
      fornecedorId: fornecedorId || undefined,
      contaBancariaId,
      mesCompetencia,
      dataVencimento,
      valorOrcado: valorOrcadoCents,
      formaPagamento,
      status: calcularStatusLancamento({
        valorOrcado: valorOrcadoCents,
        valorRealizado: jaRealizado ? valorRealizadoCents : undefined,
        dataVencimento,
        dataPagamento: jaRealizado ? dataPagamento : undefined,
      }),
      conciliado: false,
      cartaoId: formaPagamento === 'cartao' ? cartaoId : undefined,
      isSoftwareSubscription,
      iofPercent: isSoftwareSubscription ? iofPercent : undefined,
      observacoes,
      tags,
      comprovante,
    };

    if (jaRealizado) {
      novo.valorRealizado = valorRealizadoCents;
      novo.dataPagamento = dataPagamento;
      novo.justificativaDivergencia = justificativaDivergencia;
    }

    salvarLancamento(novo);
    fecharModalNovoLancamento();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-superficie dark:bg-navy border border-borda dark:border-borda-dark rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-borda dark:border-borda-dark pb-3">
          <div>
            <h2 className="text-lg font-bold text-texto-medio dark:text-texto-medio-dark">
              {lancamentoEditando ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h2>
            <p className="text-xs text-texto-medio dark:text-texto-medio-dark">
              Preencha os dados do lançamento financeiro. Valores sempre positivos.
            </p>
          </div>
          <button
            type="button"
            onClick={fecharModalNovoLancamento}
            className="p-1.5 text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio rounded-[var(--radius-controle)] hover:bg-fundo-sutil dark:hover:bg-fundo-sutil transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de Tipo (Receita / Despesa / Transferência) */}
          {!lancamentoEditando && (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTipoTransacao('despesa');
                  const cats = categorias.filter((c) => c.tipo === 'despesa');
                  if (cats.length) setCategoriaId(cats[0].id);
                }}
                className={`py-2 px-3 rounded-[var(--radius-controle)] text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  tipoTransacao === 'despesa'
                    ? 'border-perigo bg-perigo-suave dark:bg-superficie-dark/40 text-perigo dark:text-texto-forte-dark shadow-sutil'
                    : 'border-borda dark:border-borda-dark text-texto-medio dark:text-texto-medio-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil'
                }`}
              >
                <span>Despesa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipoTransacao('receita');
                  const cats = categorias.filter((c) => c.tipo === 'receita');
                  if (cats.length) setCategoriaId(cats[0].id);
                }}
                className={`py-2 px-3 rounded-[var(--radius-controle)] text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  tipoTransacao === 'receita'
                    ? 'border-sucesso bg-sucesso-suave dark:bg-superficie-dark/40 text-sucesso dark:text-texto-forte-dark shadow-sutil'
                    : 'border-borda dark:border-borda-dark text-texto-medio dark:text-texto-medio-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil'
                }`}
              >
                <span>Receita</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoTransacao('transferencia')}
                className={`py-2 px-3 rounded-[var(--radius-controle)] text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  tipoTransacao === 'transferencia'
                    ? 'border-primaria bg-primaria-suave dark:bg-navy-claro/40 text-primaria dark:text-primaria-clara shadow-sutil'
                    : 'border-borda dark:border-borda-dark text-texto-medio dark:text-texto-medio-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transferência</span>
              </button>
            </div>
          )}

          {/* Seletor de Modo: Único, Recorrente, Parcelado */}
          {!lancamentoEditando && tipoTransacao !== 'transferencia' && (
            <div className="flex rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark p-1 text-xs">
              <button
                type="button"
                onClick={() => setModoCadastro('unico')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  modoCadastro === 'unico'
                    ? 'bg-superficie dark:bg-superficie-dark text-texto-medio dark:text-white shadow-sutil font-semibold'
                    : 'text-texto-medio dark:text-texto-medio-dark'
                }`}
              >
                Lançamento Único
              </button>
              <button
                type="button"
                onClick={() => setModoCadastro('recorrente')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  modoCadastro === 'recorrente'
                    ? 'bg-superficie dark:bg-superficie-dark text-texto-medio dark:text-white shadow-sutil font-semibold'
                    : 'text-texto-medio dark:text-texto-medio-dark'
                }`}
              >
                Recorrente (Assinatura/Fee)
              </button>
              <button
                type="button"
                onClick={() => setModoCadastro('parcelado')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  modoCadastro === 'parcelado'
                    ? 'bg-superficie dark:bg-superficie-dark text-texto-medio dark:text-white shadow-sutil font-semibold'
                    : 'text-texto-medio dark:text-texto-medio-dark'
                }`}
              >
                Parcelado (Equipamentos/Projetos)
              </button>
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
              Descrição do lançamento *
            </label>
            <input
              type="text"
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Mensalidade Cliente Alpha, Fee Designer PJ, Fatura Nubank..."
              className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark placeholder-slate-400 focus:ring-1 focus:ring-primaria focus:outline-hidden"
            />
          </div>

          {/* Transferência: Contas Origem e Destino */}
          {tipoTransacao === 'transferencia' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                  Conta de Origem (Saída) *
                </label>
                <select
                  required
                  value={contaBancariaId}
                  onChange={(e) => setContaBancariaId(e.target.value)}
                  className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
                >
                  <option value="">Selecione a conta de saída...</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.banco})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                  Conta de Destino (Entrada) *
                </label>
                <select
                  required
                  value={contaDestinoId}
                  onChange={(e) => setContaDestinoId(e.target.value)}
                  className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
                >
                  <option value="">Selecione a conta de entrada...</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.banco})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* Lançamento Normal: Categoria + Conta Bancária */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                  Categoria (Hierárquica) *
                </label>
                <select
                  required
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
                >
                  <option value="">Selecione a categoria...</option>
                  {categoriasFiltradas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.grupo} &gt; {c.subcategoria}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                  Conta Bancária / Gateway *
                </label>
                <select
                  required
                  value={contaBancariaId}
                  onChange={(e) => setContaBancariaId(e.target.value)}
                  className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
                >
                  <option value="">Selecione a conta...</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.banco})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Vínculo opcional com Cliente ou Fornecedor */}
          {tipoTransacao === 'receita' && clientes.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                Cliente Associado (Opcional)
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
              >
                <option value="">Nenhum cliente (receita avulsa)</option>
                {clientes.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.nomeRazaoSocial} {cli.planoServico ? `(${cli.planoServico})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tipoTransacao === 'despesa' && fornecedores.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                Prestador PJ / Fornecedor Associado (Opcional)
              </label>
              <select
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
                className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
              >
                <option value="">Nenhum prestador (despesa operacional avulsa)</option>
                {fornecedores.map((forn) => (
                  <option key={forn.id} value={forn.id}>
                    {forn.nome} ({forn.funcao})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Datas e Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                Mês Competência *
              </label>
              <input
                type="month"
                required
                value={mesCompetencia}
                onChange={(e) => setMesCompetencia(e.target.value)}
                className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                Data de Vencimento *
              </label>
              <input
                type="date"
                required
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                {modoCadastro === 'parcelado' && modoCalculoParcela === 'parcela'
                  ? 'Valor da Parcela *'
                  : 'Valor Orçado (Previsto) *'}
              </label>
              <CurrencyInput
                valueCents={valorOrcadoCents}
                onChangeCents={setValorOrcadoCents}
                required
              />
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                Forma de Pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
              >
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
                <option value="cartao">Cartão de Crédito</option>
                <option value="transferencia">Transferência Bancária</option>
                <option value="dinheiro">Dinheiro / Caixa</option>
              </select>
            </div>

            {formaPagamento === 'cartao' && cartoes.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                  Cartão Utilizado
                </label>
                <select
                  value={cartaoId}
                  onChange={(e) => setCartaoId(e.target.value)}
                  className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
                >
                  {cartoes.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.nome} ({card.bandeira})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Se for cartão de crédito: Assinatura de software internacional / IOF */}
          {formaPagamento === 'cartao' && (
            <div className="p-3 bg-fundo-sutil dark:bg-superficie-dark/60 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-texto-medio dark:text-texto-medio-dark">
                <input
                  type="checkbox"
                  checked={isSoftwareSubscription}
                  onChange={(e) => setIsSoftwareSubscription(e.target.checked)}
                  className="rounded text-primaria focus:ring-primaria"
                />
                <span>Assinatura de ferramenta/software recorrente (ex: Figma, Canva, OpenAI, Google)</span>
              </label>

              {isSoftwareSubscription && (
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <span className="text-texto-medio dark:text-texto-medio-dark">IOF Internacional opcional (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    step="0.1"
                    value={iofPercent}
                    onChange={(e) => setIofPercent(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 rounded border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy"
                  />
                  <span className="text-texto-medio">%</span>
                </div>
              )}
            </div>
          )}

          {/* Configuração de Modo Recorrente */}
          {modoCadastro === 'recorrente' && !lancamentoEditando && (
            <div className="p-4 bg-primaria-suave/50 dark:bg-navy-claro/30 rounded-[var(--radius-card)] border border-primaria dark:border-borda-dark/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primaria dark:text-primaria-clara uppercase tracking-wider">
                <Repeat className="w-4 h-4" />
                <span>Configurações da Recorrência</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Frequência
                  </label>
                  <select
                    value={frequencia}
                    onChange={(e) => setFrequencia(e.target.value as any)}
                    className="w-full rounded border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-2.5 py-1.5"
                  >
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Término da Série
                  </label>
                  <select
                    value={terminoTipo}
                    onChange={(e) => setTerminoTipo(e.target.value as any)}
                    className="w-full rounded border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-2.5 py-1.5"
                  >
                    <option value="sem_fim">Sem fim (no horizonte de 24 meses)</option>
                    <option value="apos_n">Após N ocorrências</option>
                    <option value="ate_data">Até data específica</option>
                  </select>
                </div>

                {terminoTipo === 'apos_n' && (
                  <div>
                    <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                      Número de ocorrências
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="60"
                      value={numeroOcorrencias}
                      onChange={(e) => setNumeroOcorrencias(parseInt(e.target.value, 10) || 12)}
                      className="w-full rounded border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-2.5 py-1.5"
                    />
                  </div>
                )}

                {terminoTipo === 'ate_data' && (
                  <div>
                    <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                      Data de Término
                    </label>
                    <input
                      type="date"
                      value={dataFimRecorrencia}
                      onChange={(e) => setDataFimRecorrencia(e.target.value)}
                      className="w-full rounded border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-2.5 py-1.5"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-texto-medio dark:text-texto-medio-dark">
                  <input
                    type="checkbox"
                    checked={ajustarFimDeSemana}
                    onChange={(e) => setAjustarFimDeSemana(e.target.checked)}
                    className="rounded text-primaria focus:ring-primaria"
                  />
                  <span>Se cair em fim de semana, mover para o próximo dia útil</span>
                </label>

                <div className="flex items-center gap-1.5">
                  <span className="text-texto-medio dark:text-texto-medio-dark">Reajuste anual (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={reajusteAnualPct}
                    onChange={(e) => setReajusteAnualPct(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 rounded border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy"
                  />
                  <span className="text-texto-medio">%</span>
                </div>
              </div>
            </div>
          )}

          {/* Configuração de Modo Parcelado */}
          {modoCadastro === 'parcelado' && !lancamentoEditando && (
            <div className="p-4 bg-alerta-suave/50 dark:bg-superficie-dark/30 rounded-[var(--radius-card)] border border-alerta dark:border-borda-dark/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-alerta dark:text-texto-forte-dark uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                <span>Configurações do Parcelamento</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Modo de Cálculo
                  </label>
                  <select
                    value={modoCalculoParcela}
                    onChange={(e) => setModoCalculoParcela(e.target.value as any)}
                    className="w-full rounded border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-2.5 py-1.5"
                  >
                    <option value="total">Informar Valor Total</option>
                    <option value="parcela">Informar Valor da Parcela</option>
                  </select>
                </div>

                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Número de Parcelas
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={totalParcelas}
                    onChange={(e) => setTotalParcelas(parseInt(e.target.value, 10) || 2)}
                    className="w-full rounded border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark mb-1 font-medium">
                    Entrada Opcional
                  </label>
                  <CurrencyInput
                    valueCents={valorEntradaCents}
                    onChangeCents={setValorEntradaCents}
                  />
                </div>
              </div>

              {/* Pré-visualização das parcelas */}
              {previewParcelas.length > 0 && (
                <div className="mt-3 pt-2 border-t border-alerta dark:border-borda-dark/40">
                  <span className="text-[11px] font-semibold text-texto-medio dark:text-texto-medio-dark block mb-1.5">
                    Pré-visualização das {previewParcelas.length} parcelas (ajuste de centavos na última parcela):
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs">
                    {previewParcelas.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-1.5 rounded bg-superficie/80 dark:bg-navy/80 border border-alerta/60 dark:border-borda-dark"
                      >
                        <span className="font-medium text-texto-medio dark:text-texto-medio-dark">
                          {p.descricao}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-texto-medio">
                            Venc: {formatarDataBR(p.dataVencimento)}
                          </span>
                          <span className="font-semibold text-texto-medio dark:text-texto-medio-dark tabular-nums">
                            {formatarMoeda(p.valorOrcado)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Baixa Realizada Imediata (Opcional ou já pago) */}
          <div className="p-3.5 bg-fundo-sutil dark:bg-superficie-dark/50 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark/80 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={jaRealizado}
                onChange={(e) => {
                  setJaRealizado(e.target.checked);
                  if (e.target.checked && valorRealizadoCents === 0) {
                    setValorRealizadoCents(valorOrcadoCents);
                  }
                }}
                className="rounded text-primaria focus:ring-primaria"
              />
              <span className="text-xs font-semibold text-texto-medio dark:text-texto-medio-dark">
                {tipoTransacao === 'receita' ? 'Recebimento já realizado' : 'Pagamento já realizado'}
              </span>
            </label>

            {jaRealizado && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                    Data do Pagamento/Recebimento Realizado
                  </label>
                  <input
                    type="date"
                    required={jaRealizado}
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                    Valor Efetivamente Realizado
                  </label>
                  <CurrencyInput
                    valueCents={valorRealizadoCents}
                    onChangeCents={setValorRealizadoCents}
                    required={jaRealizado}
                  />
                </div>

                {valorRealizadoCents !== valorOrcadoCents && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-alerta dark:text-texto-forte-dark mb-1">
                      Justificativa da Divergência (Orçado: {formatarMoeda(valorOrcadoCents)} ≠ Realizado: {formatarMoeda(valorRealizadoCents)})
                    </label>
                    <input
                      type="text"
                      value={justificativaDivergencia}
                      onChange={(e) => setJustificativaDivergencia(e.target.value)}
                      placeholder="Ex: Desconto pontual, juros por atraso, taxa de boleto..."
                      className="w-full text-sm rounded-[var(--radius-controle)] border border-alerta dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-alerta focus:outline-hidden"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tags & Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Ex: Fixa, Campanha Natal, Urgente..."
                className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
                Anexo de Comprovante (Imagem / PDF)
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy hover:bg-fundo-sutil dark:hover:bg-fundo-sutil text-xs font-medium text-texto-medio dark:text-texto-medio-dark cursor-pointer transition-colors">
                  <Paperclip className="w-3.5 h-3.5 text-texto-medio" />
                  <span>{comprovante ? 'Trocar Comprovante' : 'Selecionar Arquivo'}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {comprovante && (
                  <span className="text-xs text-texto-medio truncate max-w-36">
                    {comprovante.nome}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-texto-medio dark:text-texto-medio-dark mb-1">
              Observações Internas
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Anotações para controle interno..."
              className="w-full text-sm rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-1 focus:ring-primaria focus:outline-hidden"
            />
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-borda dark:border-borda-dark">
            <button
              type="button"
              onClick={fecharModalNovoLancamento}
              className="px-4 py-2 text-sm font-medium text-texto-medio dark:text-texto-medio-dark bg-fundo-sutil dark:bg-superficie-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil rounded-[var(--radius-controle)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-primaria hover:bg-primaria-hover active:scale-98 rounded-[var(--radius-controle)] shadow-card transition-all cursor-pointer"
            >
              {lancamentoEditando ? 'Salvar Alterações' : 'Criar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
