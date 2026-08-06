import type { ReactNode } from 'react';
import { AlertTriangle, OctagonAlert, ShieldAlert } from 'lucide-react';

const levels = {
  caution: {
    Icon: ShieldAlert,
    label: 'Perhatian',
    className: 'border-brand-gold/45 bg-brand-gold/10',
    iconClassName: 'text-brand-gold-ink dark:text-brand-gold',
  },
  warning: {
    Icon: AlertTriangle,
    label: 'Peringatan',
    className: 'border-fd-warning/45 bg-fd-warning/10',
    iconClassName: 'text-fd-warning',
  },
  danger: {
    Icon: OctagonAlert,
    label: 'Bahaya',
    className: 'border-fd-error/45 bg-fd-error/10',
    iconClassName: 'text-fd-error',
  },
} as const;

/**
 * Lab safety (K3) callout. Kept as a project component rather than a Fumadocs
 * built-in because practicum modules need a consistent, unmissable treatment.
 */
export function SafetyNote({
  level = 'caution',
  children,
}: {
  level?: keyof typeof levels;
  children: ReactNode;
}) {
  const { Icon, label, className, iconClassName } = levels[level] ?? levels.caution;

  return (
    <div className={`my-5 flex gap-3 rounded-lg border px-4 py-3 ${className}`}>
      <Icon className={`mt-0.5 size-5 shrink-0 ${iconClassName}`} aria-hidden />
      <div className="min-w-0">
        <p className="eyebrow mb-1 text-xs text-fd-muted-foreground">{label}</p>
        <div className="text-sm [&>p:last-child]:mb-0">{children}</div>
      </div>
    </div>
  );
}
