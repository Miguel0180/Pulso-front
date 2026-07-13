import Link from "next/link";
import { Activity } from "lucide-react";
import { ReactNode } from "react";

export function AuthShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen bg-bg overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "radial-gradient(600px circle at 15% 10%, rgba(139,108,240,0.14), transparent 60%), radial-gradient(500px circle at 85% 90%, rgba(52,211,153,0.08), transparent 60%)",
        }}
      />

      <div className="relative flex min-h-screen flex-col items-center px-4 py-10">
        <Link href="/" className="flex items-center gap-2 mb-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-soft text-success">
            <Activity size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[15px] font-semibold leading-tight text-text-primary">Pulso Ético</p>
            <p className="text-[11px] tracking-wide text-text-muted">GESTÃO NR-1</p>
          </div>
        </Link>

        <div className={`w-full ${wide ? "max-w-3xl" : "max-w-md"}`}>{children}</div>

        <p className="mt-10 text-[12px] text-text-muted text-center max-w-sm">
          Dados sensíveis de saúde ocupacional. Ambiente restrito, criptografado e auditado conforme a NR-1.
        </p>
      </div>
    </div>
  );
}
