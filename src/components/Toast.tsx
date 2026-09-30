import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss?: (id: string) => void;
  onClose?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss, onClose }) => {
  if (toasts.length === 0) return null;
  const dismiss = onDismiss || onClose || (() => {});

  return (
    <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none select-none">
      {toasts.map((t) => {
        const Icon =
          t.type === 'success'
            ? CheckCircle2
            : t.type === 'warning'
            ? AlertCircle
            : Info;
        const colorStyle =
          t.type === 'success'
            ? 'bg-sucesso-suave border-sucesso text-sucesso'
            : t.type === 'warning'
            ? 'bg-alerta-suave border-alerta text-alerta'
            : 'bg-primaria-suave border-primaria text-primaria';
        const iconColor =
          t.type === 'success'
            ? 'text-sucesso'
            : t.type === 'warning'
            ? 'text-alerta'
            : 'text-primaria';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-[var(--radius-card)] border shadow-lg bg-superficie ${colorStyle} transition-all duration-200`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${iconColor} mt-0.5`} />
            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark flex-1 min-w-0">
              <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-xs font-semibold">{t.title}</div>
              {t.description && (
                <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-[11px] opacity-90 mt-0.5">{t.description}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark text-texto-medio hover:text-texto-medio transition-colors p-0.5"
            >
              <X className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
