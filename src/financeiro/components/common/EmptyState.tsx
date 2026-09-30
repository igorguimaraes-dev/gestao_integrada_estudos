import React from 'react';
import { LucideIcon, PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  titulo: string;
  descricao: string;
  acaoTexto?: string;
  onAcao?: () => void;
  acaoIcon?: LucideIcon;
  secundariaTexto?: string;
  onSecundaria?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PlusCircle,
  titulo,
  descricao,
  acaoTexto,
  onAcao,
  acaoIcon: AcaoIcon = PlusCircle,
  secundariaTexto,
  onSecundaria,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-[var(--radius-card)] border border-dashed border-borda-forte dark:border-borda-dark bg-superficie/50 dark:bg-navy/40 my-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-primaria-suave dark:bg-navy-claro/60 flex items-center justify-center text-primaria dark:text-primaria-clara mb-3 shadow-sutil">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-semibold text-texto-medio dark:text-texto-medio-dark mb-1">
        {titulo}
      </h3>
      <p className="text-sm text-texto-medio dark:text-texto-medio-dark max-w-md mb-5 leading-relaxed">
        {descricao}
      </p>
      <div className="flex flex-wrap gap-2.5 justify-center">
        {acaoTexto && onAcao && (
          <button
            type="button"
            onClick={onAcao}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primaria hover:bg-primaria-hover text-white text-sm font-medium rounded-[var(--radius-controle)] shadow-card transition-colors cursor-pointer"
          >
            <AcaoIcon className="w-4 h-4" />
            <span>{acaoTexto}</span>
          </button>
        )}
        {secundariaTexto && onSecundaria && (
          <button
            type="button"
            onClick={onSecundaria}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-superficie dark:bg-superficie-dark border border-borda-forte dark:border-borda-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/50 text-texto-medio dark:text-texto-medio-dark text-sm font-medium rounded-[var(--radius-controle)] transition-colors cursor-pointer"
          >
            <span>{secundariaTexto}</span>
          </button>
        )}
      </div>
    </div>
  );
};
