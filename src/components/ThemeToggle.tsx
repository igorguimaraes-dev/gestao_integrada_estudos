import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, ChevronDown, Check } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'segmented';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeLabels: Record<Theme, { label: string; desc: string; icon: React.FC<{ className?: string }> }> = {
    light: { label: 'Modo Claro', desc: 'Aparência clara e limpa', icon: Sun },
    dark: { label: 'Modo Escuro', desc: 'Menor cansaço visual', icon: Moon },
    system: { label: 'Automático', desc: 'Respeita o sistema operacional', icon: Laptop },
  };

  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-[var(--radius-card)] bg-fundo-sutil dark:bg-superficie-dark border border-borda dark:border-borda-dark text-xs font-medium ${className}`}
      >
        {(['light', 'dark', 'system'] as Theme[]).map((t) => {
          const Icon = themeLabels[t].icon;
          const isSelected = theme === t;
          return (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-controle)] transition-all ${
                isSelected
                  ? 'bg-superficie dark:bg-navy text-[var(--color-primaria)] dark:text-primaria-clara font-bold shadow-sutil'
                  : 'text-texto-medio dark:text-texto-medio-dark hover:text-texto-medio dark:hover:text-white'
              }`}
              title={themeLabels[t].desc}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{themeLabels[t].label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-[var(--radius-controle)] text-texto-medio hover:text-texto-medio dark:text-texto-medio-dark dark:hover:text-white hover:bg-fundo-sutil dark:hover:bg-fundo-sutil transition-colors relative border border-transparent ${className}`}
        title={`Tema atual: ${themeLabels[theme].label} (${resolvedTheme === 'dark' ? 'Escuro' : 'Claro'}). Clique para alternar.`}
      >
        <CurrentIcon className="w-4 h-4 text-alerta dark:text-primaria-clara transition-transform hover:scale-110" />
      </button>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        id="btn-theme-selector"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-texto-medio dark:text-texto-medio-dark bg-superficie dark:bg-superficie-dark border border-borda dark:border-borda-dark rounded-[var(--radius-controle)] hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/70 transition-colors shadow-sutil"
        title={`Tema: ${themeLabels[theme].label}`}
      >
        {theme === 'system' ? (
          <Laptop className="w-3.5 h-3.5 text-primaria dark:text-primaria-clara" />
        ) : resolvedTheme === 'dark' ? (
          <Moon className="w-3.5 h-3.5 text-primaria" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-alerta" />
        )}
        <span className="hidden sm:inline text-[11px] font-semibold">
          {theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Escuro' : 'Claro'}
        </span>
        <ChevronDown className="w-3 h-3 text-texto-medio dark:text-texto-medio-dark" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-superficie dark:bg-superficie-dark border border-borda dark:border-borda-dark rounded-[var(--radius-card)] shadow-xl py-1.5 z-50 text-xs animate-in fade-in duration-100">
          <div className="px-3 py-1 text-[10px] font-bold text-texto-medio dark:text-texto-medio-dark uppercase tracking-wider">
            Tema da Interface
          </div>
          {(['light', 'dark', 'system'] as Theme[]).map((t) => {
            const ItemIcon = themeLabels[t].icon;
            const isSelected = theme === t;

            return (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 transition-colors text-left ${
                  isSelected
                    ? 'bg-primaria-suave dark:bg-navy-claro/30 text-[var(--color-primaria)] dark:text-primaria-clara font-bold'
                    : 'text-texto-medio dark:text-texto-medio-dark hover:bg-fundo-sutil dark:hover:bg-fundo-sutil/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ItemIcon
                    className={`w-4 h-4 ${
                      isSelected
                        ? 'text-[var(--color-primaria)] dark:text-primaria-clara'
                        : 'text-texto-medio dark:text-texto-medio-dark'
                    }`}
                  />
                  <div>
                    <div className="leading-tight">{themeLabels[t].label}</div>
                    <div className="text-[10px] text-texto-medio dark:text-texto-medio-dark font-normal">
                      {themeLabels[t].desc}
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[var(--color-primaria)] dark:text-primaria-clara shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
