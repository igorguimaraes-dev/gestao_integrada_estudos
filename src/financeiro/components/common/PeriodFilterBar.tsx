import React from 'react';
import { Calendar, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TipoFiltroPeriodo } from '../../types';
import { MESES_BR_COMPLETOS, formatarMesCompetencia } from '../../utils/formatters';

export const PeriodFilterBar: React.FC = () => {
  const {
    tipoPeriodo,
    setTipoPeriodo,
    mesSelecionado,
    setMesSelecionado,
    trimestreSelecionado,
    setTrimestreSelecionado,
    anoSelecionado,
    setAnoSelecionado,
    intervaloPersonalizado,
    setIntervaloPersonalizado,
  } = useApp();

  // Navegar no tempo
  const voltarPeriodo = () => {
    if (tipoPeriodo === 'mes') {
      const [ano, mes] = mesSelecionado.split('-').map(Number);
      const d = new Date(ano, mes - 2, 1);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      setMesSelecionado(`${d.getFullYear()}-${m}`);
    } else if (tipoPeriodo === 'trimestre') {
      if (trimestreSelecionado === 1) {
        setTrimestreSelecionado(4);
        setAnoSelecionado(anoSelecionado - 1);
      } else {
        setTrimestreSelecionado(trimestreSelecionado - 1);
      }
    } else if (tipoPeriodo === 'ano') {
      setAnoSelecionado(anoSelecionado - 1);
    }
  };

  const avancarPeriodo = () => {
    if (tipoPeriodo === 'mes') {
      const [ano, mes] = mesSelecionado.split('-').map(Number);
      const d = new Date(ano, mes, 1);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      setMesSelecionado(`${d.getFullYear()}-${m}`);
    } else if (tipoPeriodo === 'trimestre') {
      if (trimestreSelecionado === 4) {
        setTrimestreSelecionado(1);
        setAnoSelecionado(anoSelecionado + 1);
      } else {
        setTrimestreSelecionado(trimestreSelecionado + 1);
      }
    } else if (tipoPeriodo === 'ano') {
      setAnoSelecionado(anoSelecionado + 1);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-superficie/90 dark:bg-navy/90 border-b border-borda dark:border-borda-dark backdrop-blur-md sticky top-0 z-20">
      {/* Seletor de Tipo de Período & Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex p-0.5 rounded-[var(--radius-controle)] bg-fundo-sutil dark:bg-superficie-dark text-xs font-medium text-texto-medio dark:text-texto-medio-dark">
          {(['mes', 'trimestre', 'ano', 'personalizado'] as TipoFiltroPeriodo[]).map((t) => {
            const labels: Record<TipoFiltroPeriodo, string> = {
              mes: 'Mês',
              trimestre: 'Trimestre',
              ano: 'Ano',
              personalizado: 'Personalizado',
            };
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTipoPeriodo(t)}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  tipoPeriodo === t
                    ? 'bg-superficie dark:bg-superficie-dark text-texto-medio dark:text-white shadow-sutil font-semibold'
                    : 'hover:text-texto-medio dark:hover:text-white'
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        {/* Controles de Navegação no Período */}
        {tipoPeriodo !== 'personalizado' ? (
          <div className="flex items-center gap-1 bg-fundo-sutil dark:bg-superficie-dark/60 border border-borda dark:border-borda-dark/80 rounded-[var(--radius-controle)] px-2 py-1">
            <button
              type="button"
              onClick={voltarPeriodo}
              aria-label="Período anterior"
              className="p-1 text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio rounded transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-texto-medio dark:text-texto-medio-dark px-2 min-w-28 text-center tabular-nums">
              {tipoPeriodo === 'mes' && formatarMesCompetencia(mesSelecionado)}
              {tipoPeriodo === 'trimestre' && `${trimestreSelecionado}º Trimestre / ${anoSelecionado}`}
              {tipoPeriodo === 'ano' && `Ano ${anoSelecionado}`}
            </span>

            <button
              type="button"
              onClick={avancarPeriodo}
              aria-label="Próximo período"
              className="p-1 text-texto-medio hover:text-texto-medio dark:hover:text-texto-medio rounded transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={intervaloPersonalizado.inicio}
              onChange={(e) =>
                setIntervaloPersonalizado({
                  ...intervaloPersonalizado,
                  inicio: e.target.value,
                })
              }
              className="px-2.5 py-1 rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy text-texto-medio dark:text-texto-medio-dark"
            />
            <span className="text-texto-medio">até</span>
            <input
              type="date"
              value={intervaloPersonalizado.fim}
              onChange={(e) =>
                setIntervaloPersonalizado({
                  ...intervaloPersonalizado,
                  fim: e.target.value,
                })
              }
              className="px-2.5 py-1 rounded-[var(--radius-controle)] border border-borda-forte dark:border-borda-dark bg-superficie dark:bg-navy text-texto-medio dark:text-texto-medio-dark"
            />
          </div>
        )}
      </div>

    </div>
  );
};
