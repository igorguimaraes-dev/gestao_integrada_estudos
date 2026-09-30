import { Braces } from 'lucide-react';
import type { FormEvent } from 'react';
import { IntegrationLogo } from './IntegrationLogo';
import './login.css';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin();
  };

  return (
    <main className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-page">
      <section className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-card">
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-brand">
          <strong>Gestão Integrada</strong>
          <span>Clientes, contratos e cobranças</span>
        </div>
        <span className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-eyebrow">ACESSO RESTRITO</span>
        <h1>Bem-vindo de volta</h1>
        <p>Entre para acessar as integrações com Asaas e Autentique.</p>
        <form onSubmit={handleSubmit}>
          <label>
            E-mail
            <input type="email" name="email" required autoFocus />
          </label>
          <label>
            Senha
            <input type="password" name="password" required minLength={8} />
          </label>
          <button className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-primary" type="submit">Entrar no sistema</button>
        </form>
        <small>Ambiente protegido · Integrações no backend</small>
        <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-integration-showcase">
          <span>INTEGRAÇÕES</span>
          <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-integration-grid">
            <IntegrationLogo logo="asaas" name="Asaas" size="xl" className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-integration-logo login-asaas" />
            <IntegrationLogo logo="autentique" name="Autentique" size="xl" className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-integration-logo login-autentique" />
            <div className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-integration-logo login-api">
              <Braces size={21} aria-hidden="true" />
              <span><strong>API</strong><small>Integramos outros sistemas</small></span>
            </div>
          </div>
        </div>
      </section>
      <aside className="dark:bg-fundo-sutil-dark dark:text-texto-forte-dark login-visual">
        <div>
          <span>GESTÃO INTEGRADA</span>
          <h2>Gestão de clientes, contratos<br />e financeiro.</h2>
          <p>Uma visão clara da sua operação, do relacionamento com o cliente à gestão financeira.</p>
        </div>
      </aside>
    </main>
  );
}
