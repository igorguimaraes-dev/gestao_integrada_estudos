import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Layers3,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Categoria } from '../types';

type TipoCategoria = 'receita' | 'despesa';

const tituloCategoria = (categoria: Categoria) => categoria.nome || categoria.subcategoria || 'Categoria sem nome';

export const CategoriasView: React.FC = () => {
  const { categorias, salvarCategoria, excluirCategoria } = useApp();
  const [tipo, setTipo] = useState<TipoCategoria>('despesa');
  const [busca, setBusca] = useState('');
  const [nome, setNome] = useState('');
  const [grupo, setGrupo] = useState('');
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [gruposFechados, setGruposFechados] = useState<Set<string>>(new Set());

  const porTipo = useMemo(() => ({
    despesa: categorias.filter((categoria) => categoria.tipo === 'despesa'),
    receita: categorias.filter((categoria) => categoria.tipo === 'receita'),
  }), [categorias]);

  const grupos = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    const filtradas = porTipo[tipo]
      .filter((categoria) => !termo || `${tituloCategoria(categoria)} ${categoria.grupo || ''}`.toLocaleLowerCase('pt-BR').includes(termo))
      .sort((a, b) => tituloCategoria(a).localeCompare(tituloCategoria(b), 'pt-BR'));

    return filtradas.reduce<Record<string, Categoria[]>>((acumulado, categoria) => {
      const nomeGrupo = categoria.grupo || (tipo === 'receita' ? 'Receitas gerais' : 'Despesas gerais');
      (acumulado[nomeGrupo] ||= []).push(categoria);
      return acumulado;
    }, {});
  }, [busca, porTipo, tipo]);

  const limparFormulario = () => {
    setNome('');
    setGrupo('');
    setEditando(null);
    setFormAberto(false);
  };

  const iniciarNovaCategoria = () => {
    setEditando(null);
    setNome('');
    setGrupo(tipo === 'receita' ? 'Receitas de serviços' : 'Despesas operacionais');
    setFormAberto(true);
  };

  const salvar = (event: React.FormEvent) => {
    event.preventDefault();
    const titulo = nome.trim();
    if (!titulo) return;
    salvarCategoria({
      id: editando?.id || `cat_${tipo}_${Date.now()}`,
      tipo,
      nome: titulo,
      subcategoria: titulo,
      grupo: grupo.trim() || (tipo === 'receita' ? 'Receitas gerais' : 'Despesas gerais'),
      ativa: true,
      subcategorias: editando?.subcategorias || [],
    });
    limparFormulario();
  };

  const editar = (categoria: Categoria) => {
    setTipo(categoria.tipo);
    setNome(tituloCategoria(categoria));
    setGrupo(categoria.grupo || '');
    setEditando(categoria);
    setFormAberto(true);
  };

  const trocarTipo = (novoTipo: TipoCategoria) => {
    setTipo(novoTipo);
    setBusca('');
    if (editando?.tipo !== novoTipo) limparFormulario();
  };

  const alternarGrupo = (nomeGrupo: string) => {
    setGruposFechados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(nomeGrupo)) proximo.delete(nomeGrupo);
      else proximo.add(nomeGrupo);
      return proximo;
    });
  };

  const quantidadeGrupos = Object.keys(grupos).length;

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      <section className="overflow-hidden rounded-2xl border border-primaria bg-gradient-to-br from-primaria via-white to-primaria shadow-sutil dark:border-borda-dark/50 dark:from-borda-dark dark:via-borda-dark dark:to-primaria-clara">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primaria dark:text-primaria-clara"><Tags className="h-4 w-4" /> Plano de categorias</div>
            <h2 className="text-2xl font-bold tracking-tight text-texto-medio dark:text-white">Organize cada entrada e saída</h2>
            <p className="mt-1.5 text-sm leading-6 text-texto-medio dark:text-texto-medio-dark">As categorias aparecem na conciliação do extrato para você renomear e classificar cada lançamento antes de conciliá-lo.</p>
          </div>
          <button onClick={iniciarNovaCategoria} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-card)] bg-primaria px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-primaria-hover focus:outline-none focus:ring-2 focus:ring-primaria"><Plus className="h-4 w-4" /> Nova categoria</button>
        </div>
        <div className="grid border-t border-primaria/80 bg-superficie/60 sm:grid-cols-3 dark:border-borda-dark dark:bg-navy/30">
          <div className="flex items-center gap-3 px-5 py-3.5"><span className="rounded-[var(--radius-controle)] bg-fundo-sutil p-2 text-texto-medio dark:bg-superficie-dark dark:text-texto-medio-dark"><Tags className="h-4 w-4" /></span><div><p className="text-xs font-medium text-texto-medio">Categorias cadastradas</p><p className="text-lg font-bold text-texto-medio dark:text-white">{categorias.length}</p></div></div>
          <div className="flex items-center gap-3 border-t border-primaria/80 px-5 py-3.5 sm:border-l sm:border-t-0 dark:border-borda-dark"><span className="rounded-[var(--radius-controle)] bg-perigo-suave p-2 text-perigo dark:bg-superficie-dark/40"><ArrowUpRight className="h-4 w-4" /></span><div><p className="text-xs font-medium text-texto-medio">Despesas</p><p className="text-lg font-bold text-perigo">{porTipo.despesa.length}</p></div></div>
          <div className="flex items-center gap-3 border-t border-primaria/80 px-5 py-3.5 sm:border-l sm:border-t-0 dark:border-borda-dark"><span className="rounded-[var(--radius-controle)] bg-sucesso-suave p-2 text-sucesso dark:bg-superficie-dark/40"><ArrowDownLeft className="h-4 w-4" /></span><div><p className="text-xs font-medium text-texto-medio">Receitas</p><p className="text-lg font-bold text-sucesso">{porTipo.receita.length}</p></div></div>
        </div>
      </section>

      {formAberto && (
        <section className="rounded-2xl border border-primaria bg-superficie p-5 shadow-card dark:border-borda-dark dark:bg-navy">
          <div className="mb-4 flex items-start justify-between gap-4"><div><h3 className="font-bold text-texto-medio dark:text-white">{editando ? 'Editar categoria' : 'Criar categoria'}</h3><p className="mt-1 text-sm text-texto-medio">Defina como este tipo de lançamento será identificado na conciliação.</p></div><button onClick={limparFormulario} className="rounded-[var(--radius-controle)] p-1.5 text-texto-medio hover:bg-fundo-sutil hover:text-texto-medio dark:hover:bg-fundo-sutil" title="Fechar"><X className="h-4 w-4" /></button></div>
          <form onSubmit={salvar} className="grid gap-3 md:grid-cols-[150px_1fr_1fr_auto] md:items-end">
            <label className="text-xs font-semibold text-texto-medio dark:text-texto-medio-dark">Tipo
              <select value={tipo} onChange={(event) => setTipo(event.target.value as TipoCategoria)} disabled={Boolean(editando)} className="mt-1.5 block w-full rounded-[var(--radius-controle)] border border-borda bg-superficie px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-fundo-sutil dark:border-borda-dark dark:bg-superficie-dark">
                <option value="despesa">Despesa</option><option value="receita">Receita</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-texto-medio dark:text-texto-medio-dark">Nome da categoria
              <input autoFocus required value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Tráfego pago" className="mt-1.5 block w-full rounded-[var(--radius-controle)] border border-borda px-3 py-2.5 text-sm outline-none focus:border-primaria focus:ring-2 focus:ring-primaria dark:border-borda-dark dark:bg-superficie-dark" />
            </label>
            <label className="text-xs font-semibold text-texto-medio dark:text-texto-medio-dark">Grupo / centro de resultado
              <input value={grupo} onChange={(event) => setGrupo(event.target.value)} placeholder={tipo === 'receita' ? 'Receitas de serviços' : 'Despesas operacionais'} className="mt-1.5 block w-full rounded-[var(--radius-controle)] border border-borda px-3 py-2.5 text-sm outline-none focus:border-primaria focus:ring-2 focus:ring-primaria dark:border-borda-dark dark:bg-superficie-dark" />
            </label>
            <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-controle)] bg-primaria px-4 text-sm font-semibold text-white hover:bg-primaria-hover"><FolderPlus className="h-4 w-4" />{editando ? 'Salvar alteração' : 'Adicionar'}</button>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-borda bg-superficie shadow-sutil dark:border-borda-dark dark:bg-navy">
        <div className="border-b border-borda p-4 sm:flex sm:items-center sm:justify-between dark:border-borda-dark">
          <div className="inline-flex rounded-[var(--radius-card)] bg-fundo-sutil p-1 dark:bg-superficie-dark">
            <button onClick={() => trocarTipo('receita')} className={`inline-flex items-center gap-2 rounded-[var(--radius-controle)] px-3 py-2 text-sm font-bold transition ${tipo === 'receita' ? 'bg-superficie text-sucesso shadow-card dark:bg-superficie-dark' : 'text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio'}`}><ArrowDownLeft className="h-4 w-4" /> Receitas <span className="rounded-md bg-sucesso-suave px-1.5 py-0.5 text-xs text-sucesso dark:bg-superficie-dark/40">{porTipo.receita.length}</span></button>
            <button onClick={() => trocarTipo('despesa')} className={`inline-flex items-center gap-2 rounded-[var(--radius-controle)] px-3 py-2 text-sm font-bold transition ${tipo === 'despesa' ? 'bg-superficie text-perigo shadow-card dark:bg-superficie-dark' : 'text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio'}`}><ArrowUpRight className="h-4 w-4" /> Despesas <span className="rounded-md bg-perigo-suave px-1.5 py-0.5 text-xs text-perigo dark:bg-superficie-dark/40">{porTipo.despesa.length}</span></button>
          </div>
          <div className="relative mt-3 sm:mt-0"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-medio" /><input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar categoria ou grupo" className="w-full rounded-[var(--radius-controle)] border border-borda py-2 pl-9 pr-3 text-sm outline-none focus:border-primaria focus:ring-2 focus:ring-primaria sm:w-64 dark:border-borda-dark dark:bg-superficie-dark" /></div>
        </div>

        <div className="p-3 sm:p-4">
          {quantidadeGrupos === 0 ? <div className="py-14 text-center"><div className="mx-auto mb-3 w-fit rounded-[var(--radius-card)] bg-fundo-sutil p-3 text-texto-medio dark:bg-superficie-dark"><Search className="h-5 w-5" /></div><p className="font-semibold text-texto-medio dark:text-texto-medio-dark">Nenhuma categoria encontrada</p><p className="mt-1 text-sm text-texto-medio">Tente outro termo ou crie uma nova categoria.</p></div> : (
            <div className="space-y-3">
              {Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).map(([nomeGrupo, itens]) => {
                const fechado = gruposFechados.has(nomeGrupo);
                return <div key={nomeGrupo} className="overflow-hidden rounded-[var(--radius-card)] border border-borda dark:border-borda-dark">
                  <button onClick={() => alternarGrupo(nomeGrupo)} className="flex w-full items-center gap-3 bg-fundo-sutil px-4 py-3 text-left transition hover:bg-fundo-sutil dark:bg-superficie-dark/50 dark:hover:bg-fundo-sutil"><span className={`rounded-[var(--radius-controle)] p-1.5 ${tipo === 'despesa' ? 'bg-perigo-suave text-perigo dark:bg-superficie-dark/40' : 'bg-sucesso-suave text-sucesso dark:bg-superficie-dark/40'}`}><Layers3 className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-texto-medio dark:text-white">{nomeGrupo}</span><span className="text-xs text-texto-medio">{itens.length} {itens.length === 1 ? 'categoria' : 'categorias'}</span></span>{fechado ? <ChevronRight className="h-4 w-4 text-texto-medio" /> : <ChevronDown className="h-4 w-4 text-texto-medio" />}</button>
                  {!fechado && <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-slate-800">{itens.map((categoria) => <div key={categoria.id} className="group flex items-center justify-between gap-3 px-4 py-3.5"><div className="min-w-0"><p className="truncate text-sm font-semibold text-texto-medio dark:text-texto-medio-dark">{tituloCategoria(categoria)}</p><p className="mt-1 text-xs text-texto-medio">Disponível na conciliação do extrato</p></div><div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><button onClick={() => editar(categoria)} className="rounded-md p-1.5 text-texto-medio hover:bg-primaria-suave hover:text-primaria dark:hover:bg-primaria-suave/40" title="Editar categoria"><Pencil className="h-4 w-4" /></button><button onClick={() => excluirCategoria(categoria.id)} className="rounded-md p-1.5 text-perigo hover:bg-perigo-suave hover:text-perigo dark:hover:bg-perigo-suave/40" title="Excluir categoria"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>}
                </div>;
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-borda px-5 py-3 text-xs text-texto-medio dark:border-borda-dark"><Tags className="h-4 w-4 text-primaria" /> Selecione uma categoria ao classificar os lançamentos pendentes no extrato.</div>
      </section>
    </div>
  );
};
