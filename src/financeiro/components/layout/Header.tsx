import React from 'react';
import { Menu, Plus, Sun, Moon, Wallet, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatarMoeda } from '../../utils/formatters';
import { calcularSaldoConta } from '../../utils/calculations';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const {
    abrirModalNovoLancamento,
    theme,
    toggleTheme,
    contas,
    lancamentos,
    carregarDadosFicticios,
  } = useApp();

  // Calcular saldo consolidado atual de todas as contas ativas
  const saldoConsolidado = contas
    .filter((c) => c.ativa)
    .reduce((acc, c) => acc + calcularSaldoConta(c, lancamentos).saldoAtual, 0);

  return (
    <header className="h-16 px-4 sm:px-6 bg-superficie dark:bg-navy border-b border-borda dark:border-borda-dark flex items-center justify-between gap-4 sticky top-0 z-30 shadow-sutil">
      {/* Esquerda: Botão Menu + Título Contextual */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-[var(--radius-controle)] text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio hover:bg-fundo-sutil dark:hover:bg-fundo-sutil transition-colors cursor-pointer"
          title="Alternar menu lateral"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <span className="text-xs font-semibold text-primaria dark:text-primaria-clara uppercase tracking-wider">
            Marketing Agency Suite
          </span>
          <h1 className="text-sm font-bold text-texto-medio dark:text-texto-forte-dark leading-tight">
            Gestão Financeira & Orçado x Realizado
          </h1>
        </div>
      </div>

      {/* Direita: Saldo Rápido + Carregar Demo + Tema + Atalho "+ Novo lançamento" SEMPRE VISÍVEL */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Saldo Consolidado Rápido */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark/80 border border-borda dark:border-borda-dark/60">
          <Wallet className="w-4 h-4 text-texto-medio" />
          <div className="text-xs">
            <span className="text-texto-medio block text-[10px] leading-tight">Saldo Consolidado</span>
            <span
              className={`font-semibold tabular-nums ${
                saldoConsolidado >= 0
                  ? 'text-sucesso dark:text-texto-forte-dark'
                  : 'text-perigo dark:text-texto-forte-dark'
              }`}
            >
              {formatarMoeda(saldoConsolidado)}
            </span>
          </div>
        </div>

        {/* Botão Carregar Dados Fictícios */}
        <button
          type="button"
          id="btn-carregar-dados-ficticios-header"
          onClick={carregarDadosFicticios}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-controle)] text-alerta dark:text-texto-forte-dark bg-alerta-suave hover:bg-alerta-suave dark:bg-superficie-dark/40 dark:hover:bg-alerta-suave/50 border border-alerta dark:border-borda-dark/60 transition-colors cursor-pointer"
          title="Recarregar dados fictícios realistas da agência"
        >
          <Sparkles className="w-3.5 h-3.5 text-alerta" />
          <span className="hidden lg:inline">Dados Fictícios</span>
        </button>

        {/* Botão Alternar Tema */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-[var(--radius-controle)] text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio hover:bg-fundo-sutil dark:hover:bg-fundo-sutil transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Atalho "+ Novo lançamento" SEMPRE VISÍVEL */}
        <button
          type="button"
          id="btn-novo-lancamento-topo"
          onClick={() => abrirModalNovoLancamento('despesa')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primaria hover:bg-primaria-hover active:scale-98 text-white text-xs sm:text-sm font-semibold rounded-[var(--radius-controle)] shadow-card shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Novo lançamento</span>
        </button>
      </div>
    </header>
  );
};

