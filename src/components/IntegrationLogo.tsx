import React from 'react';

interface IntegrationLogoProps {
  logo?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const IntegrationLogo: React.FC<IntegrationLogoProps> = ({
  logo,
  name = '',
  size = 'md',
  className = '',
}) => {
  const normalizedKey = (logo || name).toLowerCase().replace(/[^a-z0-9]/g, '');

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-[var(--radius-controle)] text-xs',
    md: 'w-10 h-10 rounded-[var(--radius-card)] text-sm',
    lg: 'w-12 h-12 rounded-[var(--radius-card)] text-base',
    xl: 'w-14 h-14 rounded-2xl text-lg',
  };

  const containerClass = `${sizeClasses[size]} shrink-0 flex items-center justify-center font-bold shadow-sutil overflow-hidden ${className}`;

  // 1. Asaas Pagamentos (Official Asaas Brand: var(--color-primaria) with official Asaas typography glyph)
  if (normalizedKey.includes('asaas')) {
    return (
      <div
        className={`${containerClass} bg-primaria text-white p-1`}
        title="Asaas Pagamentos"
        aria-label="Asaas"
      >
        <svg
          viewBox="0 0 240 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          {/* Official Asaas typographic mark matching Logo_Asaas2026 */}
          <path
            d="M36 60L22 24H12L28 66H38L54 24H44L36 60ZM74 24C65.5 24 59 30.5 59 39C59 54 83 44 83 54C83 58.5 78.5 62 72 62C65 62 60 58.5 59 55L53 60.5C55.5 64.5 62 67 71 67C81 67 89 61 89 52C89 37 65 47 65 37C65 32.5 69.5 29 74 29C80 29 84 32.5 85 36L91 30.5C88.5 26.5 82 24 74 24ZM115 24C106.5 24 100 30.5 100 39C100 54 124 44 124 54C124 58.5 119.5 62 113 62C106 62 101 58.5 100 55L94 60.5C96.5 64.5 103 67 112 67C122 67 130 61 130 52C130 37 106 47 106 37C106 32.5 110.5 29 115 29C121 29 125 32.5 126 36L132 30.5C129.5 26.5 123 24 115 24ZM156 24C147.5 24 141 30.5 141 39C141 54 165 44 165 54C165 58.5 160.5 62 154 62C147 62 142 58.5 141 55L135 60.5C137.5 64.5 144 67 153 67C163 67 171 61 171 52C171 37 147 47 147 37C147 32.5 151.5 29 156 29C162 29 166 32.5 167 36L173 30.5C170.5 26.5 164 24 156 24ZM214 24C198 24 186 35 186 51C186 63 197 67 205 67C214 67 220 63 223 60L218 55C216 57 211 61 205 61C200 61 193 57 193 49H228C228 47 228 24 214 24ZM193 44C194 33 201 29 207 29C213 29 219 33 220 44H193Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    );
  }

  if (normalizedKey.includes('autentique')) {
    return <img src="/logos/autentique.svg" alt="Autentique" aria-label="Autentique" className={`${containerClass} bg-superficie p-2`} />;
  }

  // 2. Pluggy Open Finance (Official Pluggy: Deep teal #0A1C18 with electric neon green #00D287)
  if (normalizedKey.includes('pluggy') || normalizedKey.includes('openfinance')) {
    return (
      <div
        className={`${containerClass} bg-[#0A1C18] text-white p-2 border border-[#00D287]/30`}
        title="Pluggy Open Finance API"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          {/* Pluggy prongs and fintech connection loop */}
          <rect x="34" y="16" width="9" height="22" rx="4.5" fill="#00D287" />
          <rect x="57" y="16" width="9" height="22" rx="4.5" fill="#00D287" />
          <path
            d="M26 34H74C78.4 34 82 37.6 82 42V56C82 73.67 67.67 88 50 88C32.33 88 18 73.67 18 56V42C18 37.6 21.6 34 26 34Z"
            fill="#00D287"
          />
          {/* Inner core circuit */}
          <path
            d="M36 50H64C64 57.73 57.73 64 50 64C42.27 64 36 57.73 36 50Z"
            fill="#0A1C18"
          />
          <circle cx="50" cy="74" r="4.5" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 4. Focus NFe / NFS-e (Official Focus NFe: Blue #0082CA + Orange #FF7F00 document shield)
  if (normalizedKey.includes('focus') || normalizedKey.includes('nfe') || normalizedKey.includes('fiscal')) {
    return (
      <div
        className={`${containerClass} bg-gradient-to-br from-[#0082CA] to-[#005B94] text-white p-2 shadow-sutil`}
        title="Focus NFe - Emissão Fiscal"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          {/* Document shape with folded corner */}
          <path
            d="M24 16H62L76 30V80C76 84.4 72.4 88 68 88H24C19.6 88 16 84.4 16 80V24C16 19.6 19.6 16 24 16Z"
            fill="#FFFFFF"
          />
          {/* Orange fold accent */}
          <path
            d="M62 16V30H76L62 16Z"
            fill="#FF7F00"
          />
          {/* Focus aperture / target spark */}
          <circle cx="44" cy="52" r="16" stroke="#0082CA" strokeWidth="6" />
          <circle cx="44" cy="52" r="7" fill="#FF7F00" />
          {/* NF lines */}
          <path
            d="M28 72H64"
            stroke="#0082CA"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // 5. WhatsApp Business API (Official WhatsApp Green #25D366 with phone bubble)
  if (normalizedKey.includes('whatsapp')) {
    return (
      <div
        className={`${containerClass} bg-[#25D366] text-white p-2 shadow-sutil`}
        title="WhatsApp Business API"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          {/* Speech bubble */}
          <path
            d="M50 14C30.12 14 14 30.12 14 50C14 56.6 15.78 62.8 18.9 68.16L15 84L31.3 79.82C36.6 83.08 43.08 85 50 85C69.88 85 86 68.88 86 50C86 30.12 69.88 14 50 14Z"
            fill="#FFFFFF"
          />
          {/* Telephone handset inside */}
          <path
            d="M38.5 33.5C37.3 33.5 35.8 34.1 34.6 35.4C33.4 36.7 30 40 30 46.5C30 53 34.7 59.2 35.4 60.1C36.1 61 44.5 74.2 57.7 79.5C68.7 83.9 70.9 82.5 73.3 82.3C75.7 82.1 81.1 79.1 82.2 76C83.3 72.9 83.3 70.2 83 69.7C82.7 69.2 81.9 68.9 80.7 68.3C79.5 67.7 73.6 64.8 72.5 64.4C71.4 64 70.6 63.8 69.8 65C69 66.2 66.7 69.1 66 69.9C65.3 70.7 64.6 70.8 63.4 70.2C62.2 69.6 58.3 68.3 53.7 64.2C50.1 61 47.7 57.1 47 55.9C46.3 54.7 46.9 54.1 47.5 53.5C48 53 48.7 52.1 49.3 51.4C49.9 50.7 50.1 50.2 50.5 49.4C50.9 48.6 50.7 47.9 50.4 47.3C50.1 46.7 47.7 40.8 46.7 38.4C45.7 36 44.7 36.4 43.9 36.3C43.2 36.2 42.4 36.2 41.6 36.2C40.8 36.2 39.5 36.5 38.5 33.5Z"
            fill="#25D366"
          />
        </svg>
      </div>
    );
  }

  // 6. ClickUp (Official ClickUp Rainbow Chevron on Dark / Purple)
  if (normalizedKey.includes('clickup')) {
    return (
      <div
        className={`${containerClass} bg-[#1F1F24] text-white p-2 border border-borda/50 shadow-sutil`}
        title="ClickUp"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          {/* ClickUp Dot */}
          <circle cx="50" cy="27" r="9" fill="#7B16FF" />
          {/* ClickUp Upward Chevron with gradient */}
          <defs>
            <linearGradient id="clickupGrad" x1="20" y1="80" x2="80" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF007F" />
              <stop offset="50%" stopColor="#7B16FF" />
              <stop offset="100%" stopColor="#00E5FF" />
            </linearGradient>
          </defs>
          <path
            d="M20 72L50 46L80 72"
            stroke="url(#clickupGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  // 7. Google Drive (Official Google Drive 3-color triangle on clean background)
  if (normalizedKey.includes('drive') || normalizedKey.includes('google')) {
    return (
      <div
        className={`${containerClass} bg-superficie text-texto-medio p-2 border border-borda shadow-sutil`}
        title="Google Drive"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          {/* Google Drive Yellow Top Bar */}
          <path
            d="M36 22H64L84 57H56L36 22Z"
            fill="#FFBA00"
          />
          {/* Google Drive Green Left Bar */}
          <path
            d="M16 57L36 22L50 46L30 81L16 57Z"
            fill="#0F9D58"
          />
          {/* Google Drive Blue Bottom Bar */}
          <path
            d="M30 81H70L84 57H44L30 81Z"
            fill="#4285F4"
          />
        </svg>
      </div>
    );
  }

  // 8. Conta Azul (Official Brazilian Cloud ERP: Royal Navy #002244 with blue smiling cloud)
  if (normalizedKey.includes('contaazul')) {
    return (
      <div
        className={`${containerClass} bg-[#002244] text-white p-2`}
        title="Conta Azul ERP"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          {/* Cloud base */}
          <path
            d="M72 44C70.6 32 60.4 22.8 48 22.8C37.4 22.8 28.4 29.8 25.4 39.8C18.2 41.4 12.8 47.8 12.8 55.6C12.8 64.6 20.2 72 29.2 72H71.2C78.8 72 85 65.8 85 58.2C85 50.8 79.2 44.8 72 44Z"
            fill="#0099FF"
          />
          {/* Friendly smile curve inside */}
          <path
            d="M34 52C38 60 56 60 62 52"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // 9. Mercado Pago (Official Sky Blue #009EE3 with handshake)
  if (normalizedKey.includes('mercadopago') || normalizedKey.includes('mercadolivre')) {
    return (
      <div
        className={`${containerClass} bg-[#009EE3] text-white p-2`}
        title="Mercado Pago"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          {/* Shaking hands icon */}
          <path
            d="M20 54L34 40C36 38 39 38 41 40L46 45L52 39C54 37 57 37 59 39L78 58"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M80 46L66 60C64 62 61 62 59 60L54 55L48 61C46 63 43 63 41 61L22 42"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // 10. Slack (Official 4-Color Hash on White)
  if (normalizedKey.includes('slack')) {
    return (
      <div
        className={`${containerClass} bg-superficie text-texto-medio p-2 border border-borda shadow-sutil`}
        title="Slack"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          {/* Blue */}
          <rect x="22" y="38" width="22" height="9" rx="4.5" fill="#36C5F0" />
          <circle cx="53" cy="26" r="4.5" fill="#36C5F0" />
          {/* Green */}
          <rect x="54" y="22" width="9" height="22" rx="4.5" fill="#2EB67D" />
          <circle cx="74" cy="53" r="4.5" fill="#2EB67D" />
          {/* Red */}
          <rect x="56" y="53" width="22" height="9" rx="4.5" fill="#E01E5A" />
          <circle cx="47" cy="74" r="4.5" fill="#E01E5A" />
          {/* Yellow */}
          <rect x="37" y="56" width="9" height="22" rx="4.5" fill="#ECB22E" />
          <circle cx="26" cy="47" r="4.5" fill="#ECB22E" />
        </svg>
      </div>
    );
  }

  // 11. RD Station (Official Dark Blue #14233C with Turquoise #00C1B5)
  if (normalizedKey.includes('rdstation') || normalizedKey.includes('rd')) {
    return (
      <div
        className={`${containerClass} bg-[#14233C] text-white p-2`}
        title="RD Station CRM & Marketing"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          {/* RD Orbital loop */}
          <circle cx="50" cy="50" r="34" stroke="#00C1B5" strokeWidth="7" strokeDasharray="140 40" />
          <path
            d="M34 32H48C56 32 62 38 62 46C62 54 56 60 48 60H34V32Z"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M48 60L62 76"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // 12. Omie ERP (Official Vibrant Purple #5C2483 with friendly mark)
  if (normalizedKey.includes('omie')) {
    return (
      <div
        className={`${containerClass} bg-[#5C2483] text-white p-2`}
        title="Omie ERP"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          <circle cx="34" cy="50" r="14" stroke="#FFFFFF" strokeWidth="6" />
          <circle cx="66" cy="50" r="14" stroke="#00E5FF" strokeWidth="6" />
          <path
            d="M42 66C47 70 53 70 58 66"
            stroke="#FFD54F"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // 13. Asana (Warm coral #F06A6A three dots)
  if (normalizedKey.includes('asana')) {
    return (
      <div
        className={`${containerClass} bg-superficie text-texto-medio p-2 border border-borda shadow-sutil`}
        title="Asana"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          <circle cx="50" cy="30" r="13" fill="#F06A6A" />
          <circle cx="30" cy="66" r="13" fill="#F06A6A" />
          <circle cx="70" cy="66" r="13" fill="#F06A6A" />
        </svg>
      </div>
    );
  }

  // 14. Stripe (#635BFF with white crisp mark)
  if (normalizedKey.includes('stripe')) {
    return (
      <div
        className={`${containerClass} bg-[#635BFF] text-white p-2`}
        title="Stripe Payments"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark w-full h-full"
        >
          <path
            d="M58 35C58 31 54 28 47 28C38 28 32 32 32 37C32 49 68 43 68 61C68 70 60 76 47 76C36 76 28 70 28 61"
            stroke="#FFFFFF"
            strokeWidth="11"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // Fallback: Elegant colored monogram badge with initial
  const initials = name ? name.substring(0, 2).toUpperCase() : 'IN';
  return (
    <div
      className={`${containerClass} bg-primaria-suave text-primaria border border-primaria`}
      title={name}
    >
      <span>{initials}</span>
    </div>
  );
};
