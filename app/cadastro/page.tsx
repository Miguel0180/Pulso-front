"use client";

import Link from "next/link";
import { AuthShell } from "../components/auth-shell";
import { User, Mail, Lock, ArrowRight, Check } from "lucide-react";

const requisitos = [
  "Mínimo de 8 caracteres",
  "Uma letra maiúscula",
  "Um número ou símbolo",
];

export default function CadastroPage() {
  return (
    <AuthShell>
      <div className="rounded-2xl border border-border bg-bg-card p-7">
        <h1 className="text-[20px] font-semibold text-text-primary">Criar sua conta</h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          Leva menos de um minuto. Depois você cria sua empresa ou entra com um código.
        </p>

        <form className="mt-6 space-y-4">
          <label className="block">
            <span className="text-[12.5px] font-medium text-text-secondary">Nome completo</span>
            <div className="relative mt-1.5">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                placeholder="Seu nome"
                className="focus-ring w-full rounded-lg border border-border bg-bg-elevated py-2.5 pl-9 pr-3 text-[13.5px] text-text-primary placeholder:text-text-muted"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[12.5px] font-medium text-text-secondary">E-mail corporativo</span>
            <div className="relative mt-1.5">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                placeholder="voce@empresa.com"
                className="focus-ring w-full rounded-lg border border-border bg-bg-elevated py-2.5 pl-9 pr-3 text-[13.5px] text-text-primary placeholder:text-text-muted"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[12.5px] font-medium text-text-secondary">Senha</span>
            <div className="relative mt-1.5">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                placeholder="Crie uma senha forte"
                className="focus-ring w-full rounded-lg border border-border bg-bg-elevated py-2.5 pl-9 pr-3 text-[13.5px] text-text-primary placeholder:text-text-muted"
              />
            </div>
          </label>

          <ul className="space-y-1.5">
            {requisitos.map((r) => (
              <li key={r} className="flex items-center gap-2 text-[12px] text-text-muted">
                <Check size={13} className="text-text-muted" /> {r}
              </li>
            ))}
          </ul>

          <label className="flex items-start gap-2 text-[12px] text-text-secondary">
            <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-[var(--color-accent)]" />
            <span>
              Concordo com os{" "}
              <Link href="#" className="text-accent hover:text-accent-hover">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="#" className="text-accent hover:text-accent-hover">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>

          <Link
            href="/"
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-[13.5px] font-medium text-white hover:bg-accent-hover"
          >
            Criar conta <ArrowRight size={15} />
          </Link>
        </form>
      </div>

      <p className="mt-6 text-center text-[13px] text-text-secondary">
        Já tem uma conta?{" "}
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          Fazer login
        </Link>
      </p>
    </AuthShell>
  );
}
