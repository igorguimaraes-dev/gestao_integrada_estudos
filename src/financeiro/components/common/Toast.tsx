import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { ToastItem } from '../../context/AppContext';

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let bgStyle = 'bg-sucesso-suave dark:bg-superficie-dark/80 border-sucesso dark:border-borda-dark text-sucesso dark:text-texto-forte-dark';
        let iconColor = 'text-sucesso dark:text-texto-forte-dark';

        if (toast.tipo === 'erro') {
          Icon = AlertTriangle;
          bgStyle = 'bg-perigo-suave dark:bg-superficie-dark/80 border-perigo dark:border-borda-dark text-perigo dark:text-texto-forte-dark';
          iconColor = 'text-perigo dark:text-texto-forte-dark';
        } else if (toast.tipo === 'info') {
          Icon = Info;
          bgStyle = 'bg-primaria-suave dark:bg-navy-claro/80 border-primaria dark:border-borda-dark text-primaria dark:text-primaria-clara';
          iconColor = 'text-primaria dark:text-primaria-clara';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-[var(--radius-card)] border shadow-lg backdrop-blur-xs transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${bgStyle}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-xs font-medium leading-relaxed">
              {toast.mensagem}
            </div>
            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              className="text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio transition-colors p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
