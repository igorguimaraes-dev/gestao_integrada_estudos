import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Landmark,
  Tags,
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Palette,
  Sparkles,
  Sun,
  Moon,
  Save,
  Download,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ContaBancaria, Categoria, ConfiguracoesGerais, TipoContaBancaria } from '../types';
import { formatarMoeda } from '../utils/formatters';
import { CurrencyInput } from '../components/common/CurrencyInput';

export const ConfiguracoesView: React.FC = () => {
  const {
    contas,
    salvarConta,
    excluirConta,
    categorias,
    salvarCategoria,
    excluirCategoria,
    configuracoes,
    salvarConfiguracoes,
    theme,
    setTheme,
    carregarDadosFicticios,
    limparTodosOsDados,
    exportarBackupJSON,
    importarBackupJSON,
    showToast,
    openConfirm,
  } = useApp();

  // 1. Dados cadastrais da empresa
  const [nomeEmpresa, setNomeEmpresa] = useState(configuracoes.dadosEmpresa.nome || '');
  const [razaoSocial, setRazaoSocial] = useState(configuracoes.dadosEmpresa.razaoSocial || '');
  const [cnpj, setCnpj] = useState(configuracoes.dadosEmpresa.cnpj || '');
  const [email, setEmail] = useState(configuracoes.dadosEmpresa.email || '');
  const [telefone, setTelefone] = useState(configuracoes.dadosEmpresa.telefone || '');
  const [impostoPadraoPct, setImpostoPadraoPct] = useState(configuracoes.impostoPadraoPct || 6);
  const [saldoSegurancaCents, setSaldoSegurancaCents] = useState(configuracoes.saldoMinimoSegurancaCents || 1000000);
  const [toleranciaPct, setToleranciaPct] = useState(configuracoes.toleranciaDivergenciaPct || 5);

  // Sincroniza estado quando configuracoes mudarem no storage
  useEffect(() => {
    if (configuracoes && configuracoes.dadosEmpresa) {
      setNomeEmpresa(configuracoes.dadosEmpresa.nome || '');
      setRazaoSocial(configuracoes.dadosEmpresa.razaoSocial || '');
      setCnpj(configuracoes.dadosEmpresa.cnpj || '');
      setEmail(configuracoes.dadosEmpresa.email || '');
      setTelefone(configuracoes.dadosEmpresa.telefone || '');
      setImpostoPadraoPct(configuracoes.impostoPadraoPct || 6);
      setSaldoSegurancaCents(configuracoes.saldoMinimoSegurancaCents || 1000000);
      setToleranciaPct(configuracoes.toleranciaDivergenciaPct || 5);
    }
  }, [configuracoes]);

  // 2. Modal de Nova / Editar Conta Bancária
  const [modalContaAberto, setModalContaAberto] = useState(false);
  const [contaEditando, setContaEditando] = useState<ContaBancaria | null>(null);
  const [nomeConta, setNomeConta] = useState('');
  const [bancoNome, setBancoNome] = useState('Nubank');
  const [tipoConta, setTipoConta] = useState<TipoContaBancaria>('corrente');
  const [saldoInicialCents, setSaldoInicialCents] = useState(0);
  const [corHex, setCorHex] = useState('#6366f1');

  // 3. Gestão de Categorias e Subcategorias
  const [categoriaParaSub, setCategoriaParaSub] = useState<string | null>(null);
  const [novaSubcatNome, setNovaSubcatNome] = useState('');
  const [modalNovaCatAberto, setModalNovaCatAberto] = useState(false);
  const [novaCatNome, setNovaCatNome] = useState('');
  const [novaCatTipo, setNovaCatTipo] = useState<'receita' | 'despesa'>('despesa');
  const [novaCatGrupo, setNovaCatGrupo] = useState('4. Despesas Operacionais');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manipulação de Perfil da Empresa
  const handleSalvarPerfilEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    const atualizada: ConfiguracoesGerais = {
      ...configuracoes,
      impostoPadraoPct: Number(impostoPadraoPct),
      saldoMinimoSegurancaCents: Number(saldoSegurancaCents),
      toleranciaDivergenciaPct: Number(toleranciaPct),
      dadosEmpresa: {
        ...configuracoes.dadosEmpresa,
        nome: nomeEmpresa,
        razaoSocial,
        cnpj,
        email,
        telefone,
      },
    };
    salvarConfiguracoes(atualizada);
  };

  // Manipulação de Contas
  const handleAbrirModalConta = (c?: ContaBancaria) => {
    if (c) {
      setContaEditando(c);
      setNomeConta(c.nome);
      setBancoNome(c.banco);
      setTipoConta(c.tipo);
      setSaldoInicialCents(c.saldoInicial);
      setCorHex(c.corHex || '#6366f1');
    } else {
      setContaEditando(null);
      setNomeConta('');
      setBancoNome('Nubank');
      setTipoConta('corrente');
      setSaldoInicialCents(0);
      setCorHex('#6366f1');
    }
    setModalContaAberto(true);
  };

  const handleSalvarConta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeConta.trim()) return;

    const nova: ContaBancaria = {
      id: contaEditando ? contaEditando.id : `conta_${Date.now()}`,
      nome: nomeConta.trim(),
      banco: bancoNome.trim(),
      tipo: tipoConta,
      saldoInicial: saldoInicialCents,
      ativa: true,
      corHex,
    };

    salvarConta(nova);
    setModalContaAberto(false);
  };

  const handleExcluirConta = (c: ContaBancaria) => {
    openConfirm({
      titulo: 'Excluir Conta Bancária',
      mensagem: `Deseja remover a conta "${c.nome}"? Lançamentos vinculados perderão a referência de conciliação.`,
      confirmTexto: 'Excluir Conta',
      perigo: true,
      onConfirm: () => {
        excluirConta(c.id);
      },
    });
  };

  // Manipulação de Categorias
  const handleSalvarNovaCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCatNome.trim()) return;

    const novaCat: Categoria = {
      id: `cat_${Date.now()}`,
      nome: novaCatNome.trim(),
      grupo: novaCatGrupo,
      subcategoria: novaCatNome.trim(),
      tipo: novaCatTipo,
      grupoDRE: novaCatGrupo,
      subcategorias: [],
      ativa: true,
    };

    salvarCategoria(novaCat);
    setModalNovaCatAberto(false);
    setNovaCatNome('');
    showToast(`Categoria "${novaCat.nome}" criada com sucesso!`);
  };

  const handleAdicionarSubcategoria = (cat: Categoria) => {
    if (!novaSubcatNome.trim()) return;
    const subsExistentes = cat.subcategorias || [];
    if (subsExistentes.includes(novaSubcatNome.trim())) {
      showToast('Esta subcategoria já existe nesta categoria.', 'erro');
      return;
    }
    const subs = [...subsExistentes, novaSubcatNome.trim()];
    salvarCategoria({
      ...cat,
      subcategorias: subs,
    });
    setNovaSubcatNome('');
    setCategoriaParaSub(null);
    showToast(`Subcategoria "${novaSubcatNome}" adicionada a ${cat.nome}!`);
  };

  const handleRemoverSubcategoria = (cat: Categoria, sub: string) => {
    const subs = (cat.subcategorias || []).filter((s) => s !== sub);
    salvarCategoria({
      ...cat,
      subcategorias: subs,
    });
    showToast(`Subcategoria "${sub}" removida.`);
  };

  // Manipulação de Backup
  const handleArquivoImportacao = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const conteudo = event.target?.result as string;
        const sucesso = importarBackupJSON(conteudo);
        if (sucesso) {
          showToast('Backup importado e restaurado com sucesso!', 'sucesso');
        } else {
          showToast('Falha ao importar backup. Verifique o formato do arquivo JSON.', 'erro');
        }
      } catch (err) {
        showToast('Erro ao ler arquivo de backup.', 'erro');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset Total
  const handleResetTotal = () => {
    openConfirm({
      titulo: '⚠️ Redefinição Total de Fábrica',
      mensagem:
        'Esta ação apagará IRREVERSIVELMENTE todos os lançamentos, clientes, fornecedores, metas e histórico financeiro da agência. Deseja realmente zerar tudo?',
      confirmTexto: 'SIM, ZERAR TUDO',
      perigo: true,
      onConfirm: () => {
        limparTodosOsDados();
        showToast('Todos os dados foram excluídos e o sistema foi resetado com sucesso.', 'info');
      },
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-xl font-bold text-texto-medio dark:text-texto-medio-dark">
          Configurações do Sistema
        </h2>
        <p className="text-xs sm:text-sm text-texto-medio dark:text-texto-medio-dark">
          Personalize as informações da sua agência, contas financeiras, tema e categorias.
        </p>
      </div>

      {/* 1. Tema & Aparência Visual */}
      <div className="p-5 rounded-2xl bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-4">
        <div className="flex items-center gap-2 border-b border-borda dark:border-borda-dark pb-3">
          <Palette className="w-5 h-5 text-primaria dark:text-primaria-clara" />
          <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
            Aparência & Tema do Sistema
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-3 p-4 rounded-[var(--radius-card)] border text-left cursor-pointer transition-all ${
              theme === 'light'
                ? 'border-primaria bg-primaria-suave/50 dark:bg-navy-claro/20 text-primaria dark:text-primaria-clara ring-2 ring-primaria/20'
                : 'border-borda dark:border-borda-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/50 text-texto-medio dark:text-texto-medio-dark'
            }`}
          >
            <div className="w-10 h-10 rounded-[var(--radius-controle)] bg-alerta-suave text-alerta flex items-center justify-center shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>Tema Claro (Light)</span>
                {theme === 'light' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primaria text-white">
                    Ativo
                  </span>
                )}
              </div>
              <p className="text-xs text-texto-medio dark:text-texto-medio-dark">
                Interface nítida com fundo claro e alto contraste.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-3 p-4 rounded-[var(--radius-card)] border text-left cursor-pointer transition-all ${
              theme === 'dark'
                ? 'border-primaria bg-primaria-suave/30 text-primaria ring-2 ring-primaria/20'
                : 'border-borda dark:border-borda-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/50 text-texto-medio dark:text-texto-medio-dark'
            }`}
          >
            <div className="w-10 h-10 rounded-[var(--radius-controle)] bg-primaria-suave/60 text-primaria flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>Tema Escuro (Dark)</span>
                {theme === 'dark' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primaria text-white">
                    Ativo
                  </span>
                )}
              </div>
              <p className="text-xs text-texto-medio dark:text-texto-medio-dark">
                Conforto visual para trabalho em ambientes escuros.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Dados da Empresa & Parâmetros Financeiros */}
      <div className="p-5 rounded-2xl bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-4">
        <div className="flex items-center justify-between border-b border-borda dark:border-borda-dark pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primaria dark:text-primaria-clara" />
            <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
              Perfil da Agência & Regras Financeiras
            </h3>
          </div>
        </div>

        <form onSubmit={handleSalvarPerfilEmpresa} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                Nome Fantasia da Agência *
              </label>
              <input
                type="text"
                required
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                placeholder="Ex: Nexus Growth Marketing"
                className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-2 focus:ring-primaria focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                Razão Social
              </label>
              <input
                type="text"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                placeholder="Ex: Nexus Growth Publicidade Ltda."
                className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-2 focus:ring-primaria focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                CNPJ
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-2 focus:ring-primaria focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                E-mail do Financeiro
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="financeiro@agencia.com.br"
                className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-2 focus:ring-primaria focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-2 focus:ring-primaria focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                Alíquota Média de Impostos s/ NFS-e (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={impostoPadraoPct}
                onChange={(e) => setImpostoPadraoPct(Number(e.target.value))}
                className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-2 focus:ring-primaria focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                Saldo Mínimo de Segurança (R$)
              </label>
              <CurrencyInput
                valueCents={saldoSegurancaCents}
                onChangeCents={setSaldoSegurancaCents}
              />
            </div>

            <div>
              <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                Tolerância de Divergência Orçado x Realizado (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={toleranciaPct}
                onChange={(e) => setToleranciaPct(Number(e.target.value))}
                className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark focus:ring-2 focus:ring-primaria focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] font-semibold cursor-pointer shadow-sutil transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Dados da Agência</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Contas Bancárias */}
      <div className="p-5 rounded-2xl bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-4">
        <div className="flex items-center justify-between border-b border-borda dark:border-borda-dark pb-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primaria dark:text-primaria-clara" />
            <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
              Contas Bancárias & Aplicações
            </h3>
          </div>
          <button
            type="button"
            onClick={() => handleAbrirModalConta()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-controle)] bg-primaria hover:bg-primaria-hover text-white text-xs font-semibold cursor-pointer shadow-sutil transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contas.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark bg-fundo-sutil/50 dark:bg-superficie-dark/30 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.corHex || '#6366f1' }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-texto-medio dark:text-texto-medio-dark">
                      {c.nome}
                    </h4>
                    <span className="text-[10px] text-texto-medio uppercase tracking-wider">
                      {c.banco} • {c.tipo.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAbrirModalConta(c)}
                    className="p-1.5 text-texto-medio hover:text-primaria cursor-pointer rounded hover:bg-fundo-sutil/60 dark:hover:bg-fundo-sutil"
                    title="Editar conta"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExcluirConta(c)}
                    className="p-1.5 text-texto-medio hover:text-perigo cursor-pointer rounded hover:bg-perigo-suave dark:hover:bg-perigo-suave/40"
                    title="Excluir conta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-borda/60 dark:border-borda-dark/60 flex items-center justify-between text-xs">
                <span className="text-texto-medio dark:text-texto-medio-dark">Saldo Inicial:</span>
                <span className="font-bold text-texto-medio dark:text-texto-medio-dark tabular-nums">
                  {formatarMoeda(c.saldoInicial)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Plano de Contas & Categorias */}
      <div className="p-5 rounded-2xl bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-4">
        <div className="flex items-center justify-between border-b border-borda dark:border-borda-dark pb-3">
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-primaria dark:text-primaria-clara" />
            <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
              Plano de Contas & Categorias Personalizáveis
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setModalNovaCatAberto(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-controle)] bg-primaria hover:bg-primaria-hover text-white text-xs font-semibold cursor-pointer shadow-sutil transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Categoria</span>
          </button>
        </div>

        <div className="space-y-3">
          {categorias.map((cat) => (
            <div
              key={cat.id}
              className="p-3.5 rounded-[var(--radius-card)] border border-borda dark:border-borda-dark space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      cat.tipo === 'receita'
                        ? 'bg-sucesso-suave text-sucesso dark:bg-superficie-dark/60 dark:text-texto-forte-dark'
                        : 'bg-perigo-suave text-perigo dark:bg-superficie-dark/60 dark:text-texto-forte-dark'
                    }`}
                  >
                    {cat.tipo}
                  </span>
                  <span className="text-xs font-bold text-texto-medio dark:text-texto-medio-dark">
                    {cat.nome}
                  </span>
                  <span className="text-[11px] text-texto-medio">
                    ({cat.grupoDRE})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setCategoriaParaSub(cat.id)}
                  className="inline-flex items-center gap-1 text-xs text-primaria dark:text-primaria-clara hover:underline font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Subcategoria</span>
                </button>
              </div>

              {/* Subcategorias em chips */}
              <div className="flex flex-wrap gap-1.5">
                {(cat.subcategorias || []).map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-fundo-sutil dark:bg-superficie-dark text-texto-medio dark:text-texto-medio-dark text-[11px] font-medium"
                  >
                    <span>{sub}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoverSubcategoria(cat, sub)}
                      className="hover:text-perigo cursor-pointer"
                      title="Remover subcategoria"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {categoriaParaSub === cat.id && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Nome da nova subcategoria..."
                    value={novaSubcatNome}
                    onChange={(e) => setNovaSubcatNome(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdicionarSubcategoria(cat);
                      }
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy w-64 text-texto-medio dark:text-texto-medio-dark"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdicionarSubcategoria(cat)}
                    className="px-3 py-1.5 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-xs font-semibold cursor-pointer"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoriaParaSub(null)}
                    className="px-2 py-1.5 text-xs text-texto-medio hover:text-texto-medio cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. Backup & Importação de Dados */}
      <div className="p-5 rounded-2xl bg-superficie dark:bg-navy border border-borda dark:border-borda-dark shadow-sutil space-y-3">
        <div className="flex items-center gap-2 border-b border-borda dark:border-borda-dark pb-3">
          <Download className="w-5 h-5 text-primaria dark:text-primaria-clara" />
          <h3 className="text-sm font-bold text-texto-medio dark:text-texto-medio-dark">
            Backup & Segurança de Dados
          </h3>
        </div>
        <p className="text-xs text-texto-medio dark:text-texto-medio-dark">
          Exporte uma cópia completa de todos os lançamentos, clientes e configurações em formato JSON para salvar no seu computador ou transferir para outro navegador.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={exportarBackupJSON}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] text-xs font-semibold cursor-pointer shadow-sutil transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Backup Completo (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-borda-forte dark:border-borda-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil text-texto-medio dark:text-texto-medio-dark rounded-[var(--radius-controle)] text-xs font-semibold cursor-pointer transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Restaurar / Importar Backup (.json)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleArquivoImportacao}
            className="hidden"
          />
        </div>
      </div>

      {/* 6. Dados sincronizados */}
      <div className="p-5 rounded-2xl bg-alerta-suave/60 dark:bg-superficie-dark/20 border border-alerta dark:border-borda-dark/40 shadow-sutil space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-alerta dark:text-texto-forte-dark" />
          <h3 className="text-sm font-bold text-alerta dark:text-texto-forte-dark">
            Dados sincronizados do Asaas
          </h3>
        </div>
        <p className="text-xs text-alerta/80 dark:text-texto-forte-dark/80 leading-relaxed">
          Este módulo não utiliza dados demonstrativos. Clientes, cobranças recebíveis e saldo são atualizados pela integração Asaas.
          Cartões, equipe, reembolsos e despesas aguardam uma fonte de dados compatível.
        </p>
        <button
          type="button"
          id="btn-limpar-dados-financeiros-config"
          onClick={() => {
            carregarDadosFicticios();
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-alerta-suave hover:bg-alerta-suave text-white rounded-[var(--radius-controle)] text-xs font-semibold cursor-pointer shadow-sutil transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>Limpar dados financeiros locais</span>
        </button>
      </div>

      {/* 7. Zona de Perigo: Redefinição Total */}
      <div className="p-5 rounded-2xl bg-perigo-suave/50 dark:bg-superficie-dark/20 border border-perigo dark:border-borda-dark/40 shadow-sutil space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-perigo" />
          <h3 className="text-sm font-bold text-perigo dark:text-texto-forte-dark">
            Zona de Perigo
          </h3>
        </div>
        <p className="text-xs text-perigo dark:text-texto-forte-dark">
          Zerar completamente todos os dados do banco de dados no navegador, resetando a agência ao estado inicial zerado.
        </p>
        <button
          type="button"
          onClick={handleResetTotal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-perigo-suave hover:bg-perigo-suave text-white rounded-[var(--radius-controle)] text-xs font-semibold cursor-pointer shadow-sutil transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Zerar Todos os Dados do Sistema (Reset de Fábrica)</span>
        </button>
      </div>

      {/* Modal de Conta Bancária */}
      {modalContaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="bg-superficie dark:bg-navy border border-borda dark:border-borda-dark rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-borda dark:border-borda-dark pb-3">
              <h3 className="text-base font-bold text-texto-medio dark:text-texto-medio-dark">
                {contaEditando ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
              </h3>
              <button
                type="button"
                onClick={() => setModalContaAberto(false)}
                className="text-texto-medio hover:text-texto-medio cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarConta} className="space-y-3 text-xs">
              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                  Nome da Conta *
                </label>
                <input
                  type="text"
                  required
                  value={nomeConta}
                  onChange={(e) => setNomeConta(e.target.value)}
                  placeholder="Ex: Nubank PJ, Itaú Operacional"
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                    Instituição Financeira
                  </label>
                  <input
                    type="text"
                    value={bancoNome}
                    onChange={(e) => setBancoNome(e.target.value)}
                    placeholder="Ex: Inter, Itaú, Bradesco..."
                    className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                  />
                </div>

                <div>
                  <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                    Tipo de Conta
                  </label>
                  <select
                    value={tipoConta}
                    onChange={(e) => setTipoConta(e.target.value as any)}
                    className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                  >
                    <option value="corrente">Conta Corrente</option>
                    <option value="investimento">Investimento / CDB</option>
                    <option value="caixa_fisico">Caixa Físico</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                  Saldo Inicial da Conta (R$)
                </label>
                <CurrencyInput
                  valueCents={saldoInicialCents}
                  onChangeCents={setSaldoInicialCents}
                />
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={corHex}
                    onChange={(e) => setCorHex(e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs">{corHex}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-borda dark:border-borda-dark">
                <button
                  type="button"
                  onClick={() => setModalContaAberto(false)}
                  className="px-4 py-2 bg-fundo-sutil dark:bg-superficie-dark text-texto-medio dark:text-texto-medio-dark rounded-[var(--radius-controle)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] font-semibold cursor-pointer"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Nova Categoria */}
      {modalNovaCatAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="bg-superficie dark:bg-navy border border-borda dark:border-borda-dark rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-borda dark:border-borda-dark pb-3">
              <h3 className="text-base font-bold text-texto-medio dark:text-texto-medio-dark">
                Nova Categoria do Plano de Contas
              </h3>
              <button
                type="button"
                onClick={() => setModalNovaCatAberto(false)}
                className="text-texto-medio hover:text-texto-medio cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovaCategoria} className="space-y-3 text-xs">
              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={novaCatNome}
                  onChange={(e) => setNovaCatNome(e.target.value)}
                  placeholder="Ex: Treinamentos da Equipe"
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                />
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                  Tipo de Fluxo
                </label>
                <select
                  value={novaCatTipo}
                  onChange={(e) => setNovaCatTipo(e.target.value as 'receita' | 'despesa')}
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                >
                  <option value="despesa">Despesa / Saída</option>
                  <option value="receita">Receita / Entrada</option>
                </select>
              </div>

              <div>
                <label className="block text-texto-medio dark:text-texto-medio-dark font-medium mb-1">
                  Grupo no DRE Gerencial
                </label>
                <select
                  value={novaCatGrupo}
                  onChange={(e) => setNovaCatGrupo(e.target.value)}
                  className="w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy px-3 py-2 text-texto-medio dark:text-texto-medio-dark"
                >
                  <option value="1. Receita Bruta">1. Receita Bruta</option>
                  <option value="2. Deduções da Receita">2. Deduções da Receita (Impostos)</option>
                  <option value="3. Custos dos Serviços Prestados">3. Custos dos Serviços Prestados (CSP)</option>
                  <option value="4. Despesas Operacionais">4. Despesas Operacionais e Administrativas</option>
                  <option value="5. Remuneração dos Sócios">5. Remuneração dos Sócios (Pró-labore/Lucros)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-borda dark:border-borda-dark">
                <button
                  type="button"
                  onClick={() => setModalNovaCatAberto(false)}
                  className="px-4 py-2 bg-fundo-sutil dark:bg-superficie-dark text-texto-medio dark:text-texto-medio-dark rounded-[var(--radius-controle)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primaria hover:bg-primaria-hover text-white rounded-[var(--radius-controle)] font-semibold cursor-pointer"
                >
                  Criar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
