export interface StatusConfig {
  label: string;
  bg: string;
  color: string;
  border: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  active:    { label: 'Active',     bg: 'rgba(34,197,94,0.10)',   color: '#86EFAC', border: 'rgba(34,197,94,0.25)' },
  inactive:  { label: 'Inactive',   bg: 'rgba(244,63,94,0.10)',   color: '#FCA5A5', border: 'rgba(244,63,94,0.25)' },
  pending:   { label: 'Pending',    bg: 'rgba(245,158,11,0.10)',  color: '#FCD34D', border: 'rgba(245,158,11,0.25)' },
  delivered: { label: 'Delivered',  bg: 'rgba(34,197,94,0.10)',   color: '#86EFAC', border: 'rgba(34,197,94,0.25)' },
  en_route:  { label: 'En Route',   bg: 'rgba(59,130,246,0.10)',  color: '#93C5FD', border: 'rgba(59,130,246,0.25)' },
  cancelled: { label: 'Cancelled',  bg: 'rgba(244,63,94,0.10)',   color: '#FCA5A5', border: 'rgba(244,63,94,0.25)' },
  scheduled: { label: 'Scheduled',  bg: 'rgba(168,85,247,0.10)', color: '#C084FC', border: 'rgba(168,85,247,0.25)' },
  sent:      { label: 'Sent',       bg: 'rgba(34,197,94,0.10)',   color: '#86EFAC', border: 'rgba(34,197,94,0.25)' },
  draft:     { label: 'Draft',      bg: 'rgba(100,116,139,0.10)', color: '#94A3B8', border: 'rgba(100,116,139,0.25)' },
  expired:   { label: 'Expired',    bg: 'rgba(100,116,139,0.10)', color: '#94A3B8', border: 'rgba(100,116,139,0.25)' },
};

export function getStatusConfig(status?: string): StatusConfig {
  if (!status) return STATUS_CONFIG['draft'];
  return STATUS_CONFIG[status.toLowerCase()] ?? { label: status, bg: 'rgba(99,102,241,0.10)', color: '#A5B4FC', border: 'rgba(99,102,241,0.25)' };
}
