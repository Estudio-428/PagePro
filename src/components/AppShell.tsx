'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type ShellAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
};

interface AppShellProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ShellAction[];
  children: React.ReactNode;
  contentClassName?: string;
  showPageHeader?: boolean;
}

const navItems = [
  { href: '/products', label: 'Produtos', icon: 'box' },
  { href: '/dashboard', label: 'Analytics', icon: 'chart' },
  { href: '/import', label: 'Importar', icon: 'upload' },
];

function Icon({ name, className = 'h-4 w-4' }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'chart':
      return <svg {...common}><path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" /></svg>;
    case 'box':
      return <svg {...common}><path d="M12 3 4 7l8 4 8-4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></svg>;
    case 'upload':
      return <svg {...common}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 20h14" /></svg>;
    case 'settings':
      return <svg {...common}><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /><path d="M3 12h2M19 12h2M12 3v2M12 19v2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>;
    case 'spark':
      return <svg {...common}><path d="M12 3 13.8 8.2 19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></svg>;
    case 'help':
      return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M9.8 9a2.3 2.3 0 1 1 3.4 2c-.8.5-1.2 1-1.2 2M12 17h.01" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
  }
}

function ActionButton({ action }: { action: ShellAction }) {
  const className = action.variant === 'ghost' ? 'pp-btn pp-btn-ghost' : 'pp-btn pp-btn-primary';

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} disabled={action.disabled} className={`${className} disabled:opacity-50`}>
      {action.label}
    </button>
  );
}

export function AppShell({
  title,
  subtitle,
  eyebrow = 'Page Pro',
  actions = [],
  children,
  contentClassName = 'p-7',
  showPageHeader = true,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="grid min-h-screen grid-cols-[248px_1fr] bg-[var(--background)] text-[var(--foreground)]">
      <aside className="flex min-h-screen flex-col border-r border-[var(--sidebar-line)] bg-[var(--sidebar)] text-[#e2e3ea]">
        <Link href="/products" className="flex items-center gap-3 border-b border-[var(--sidebar-line)] px-5 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[var(--pink)] font-display text-[13px] font-extrabold text-white">PP</span>
          <span className="flex flex-col leading-tight">
            <b className="font-display text-[15px] text-white">Page Pro</b>
            <span className="text-[11px] uppercase tracking-[0.16em] text-[#8a8d9a]">Nuvemshop</span>
          </span>
        </Link>

        <div className="px-3 py-5">
          <p className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5a5d6a]">Operação</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold transition ${
                    active ? 'bg-[var(--sidebar-2)] text-white' : 'text-[#c2c5d2] hover:bg-[var(--sidebar-2)] hover:text-white'
                  }`}
                >
                  {active && <span className="absolute -left-3 h-5 w-[3px] rounded-r bg-[var(--pink)]" />}
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-[var(--sidebar-line)] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-[10px] bg-[var(--sidebar-2)] p-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[rgba(230,0,77,.16)] text-[var(--pink-50)]">
              <Icon name="spark" />
            </span>
            <span>
              <span className="block text-[13px] font-bold text-white">Editor de produtos</span>
              <span className="text-[11.5px] text-[#8a8d9a]">Blocos por produto</span>
            </span>
          </div>
          <div className="flex items-center gap-3 px-2 py-1">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#ff8fa3] to-[var(--pink)] text-xs font-bold text-white">PP</span>
            <span>
              <span className="block text-[13px] font-bold text-white">Loja conectada</span>
              <span className="text-[11px] text-[#8a8d9a]">Ambiente do app</span>
            </span>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col overflow-hidden">
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-[var(--line)] bg-white px-6">
          <div>
            <div className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
              <span>{eyebrow}</span>
              <span className="text-[var(--muted-2)]">/</span>
              <b className="font-semibold text-[var(--foreground)]">{title}</b>
            </div>
          </div>
          {actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action) => (
                <ActionButton key={action.label} action={action} />
              ))}
            </div>
          )}
        </header>

        <section className="flex-1 overflow-auto">
          <div className={contentClassName}>
            {showPageHeader && (
              <div className="mb-7 flex flex-wrap items-start justify-between gap-5">
                <div>
                  <h1 className="font-display text-[28px] font-bold leading-tight">{title}</h1>
                  {subtitle && <p className="mt-1 max-w-[70ch] text-sm text-[var(--muted)]">{subtitle}</p>}
                </div>
              </div>
            )}
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
