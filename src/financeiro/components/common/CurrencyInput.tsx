import React from 'react';
import { centavosParaInputMascarado } from '../../utils/formatters';

interface CurrencyInputProps {
  id?: string;
  name?: string;
  valueCents: number;
  onChangeCents: (cents: number) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  name,
  valueCents,
  onChangeCents,
  placeholder = '0,00',
  className = '',
  required = false,
  disabled = false,
  autoFocus = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Pega apenas dígitos
    const digits = e.target.value.replace(/\D/g, '');
    const cents = digits ? parseInt(digits, 10) : 0;
    onChangeCents(cents);
  };

  return (
    <div className="relative rounded-[var(--radius-controle)] shadow-sutil">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span className="text-texto-medio dark:text-texto-medio-dark text-sm font-medium">R$</span>
      </div>
      <input
        type="text"
        inputMode="numeric"
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        value={centavosParaInputMascarado(valueCents)}
        onChange={handleChange}
        placeholder={placeholder}
        className={`block w-full rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy pl-10 pr-3 py-2 text-sm text-texto-medio dark:text-texto-medio-dark placeholder-slate-400 focus:border-primaria focus:ring-1 focus:ring-primaria focus:outline-hidden disabled:bg-fundo-sutil dark:disabled:bg-fundo-sutil disabled:cursor-not-allowed tabular-nums font-mono ${className}`}
      />
    </div>
  );
};
