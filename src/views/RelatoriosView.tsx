import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, FileText, Download } from 'lucide-react';

export const RelatoriosView: React.FC = () => {
  return (
    <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-6 pb-12">
      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[24px] font-bold text-[var(--color-texto-forte)]">Relatórios Gerenciais</h1>
          <p className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[13px] text-[var(--color-texto-medio)] mt-0.5">
            Demonstrativos financeiros, rentabilidade por contrato e projeções de receita recorrente.
          </p>
        </div>
        <button className="dark:bg-fundo-dark dark:text-texto-forte-dark flex items-center gap-2 px-3.5 py-2 bg-superficie border border-[var(--color-borda)] hover:bg-[var(--color-fundo-sutil)] text-[var(--color-texto)] rounded-[var(--radius-controle)] text-xs font-semibold shadow-sutil">
          <Download className="dark:bg-fundo-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
          <span>Exportar Pasta Mensal (Contabilidade)</span>
        </button>
      </div>

      <div className="dark:bg-fundo-dark dark:text-texto-forte-dark grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil space-y-3">
          <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-[var(--color-texto-forte)]">Ranking de Faturamento por Cliente</h3>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2 text-xs">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1.5 border-b border-[var(--color-borda)]">
              <span>1. Studio Horizonte Arquitetura</span>
              <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-forte)]">R$ 11.400 / mês (19.8%)</strong>
            </div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1.5 border-b border-[var(--color-borda)]">
              <span>2. Alpha Tecnologia</span>
              <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-forte)]">R$ 8.500 / mês (14.7%)</strong>
            </div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1.5 border-b border-[var(--color-borda)]">
              <span>3. Aurora Marketing</span>
              <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-forte)]">R$ 7.200 / mês (12.5%)</strong>
            </div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1.5 border-b border-[var(--color-borda)]">
              <span>4. Exclusive Motors</span>
              <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-forte)]">R$ 5.900 / mês (10.2%)</strong>
            </div>
          </div>
        </div>

        <div className="dark:bg-fundo-dark dark:text-texto-forte-dark bg-superficie p-5 rounded-[var(--radius-card)] border border-[var(--color-borda)] shadow-sutil space-y-3">
          <h3 className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sm font-semibold text-[var(--color-texto-forte)]">Métricas de Recorrência (SaaS / Serviços)</h3>
          <div className="dark:bg-fundo-dark dark:text-texto-forte-dark space-y-2 text-xs">
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1.5 border-b border-[var(--color-borda)]">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-medio)]">Net Revenue Retention (NRR)</span>
              <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-sucesso font-bold">106.8%</strong>
            </div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1.5 border-b border-[var(--color-borda)]">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-medio)]">Churn Rate Mensal</span>
              <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-forte)] font-bold">1.4% (Excelente)</strong>
            </div>
            <div className="dark:bg-fundo-dark dark:text-texto-forte-dark flex justify-between py-1.5 border-b border-[var(--color-borda)]">
              <span className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-medio)]">Tempo Médio de Contrato</span>
              <strong className="dark:bg-fundo-dark dark:text-texto-forte-dark text-[var(--color-texto-forte)] font-bold">18 meses</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
