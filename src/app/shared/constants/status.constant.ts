export interface StatusConfig {
  label: string;
  bg: string;
  color: string;
  border: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  // ── Order statuses ───────────────────────────────────────────────────────
  placed:            { label: 'Placed',            bg: 'rgba(2,132,199,0.10)',    color: '#38BDF8', border: 'rgba(2,132,199,0.25)' },
  accepted:          { label: 'Accepted',          bg: 'rgba(8,145,178,0.10)',    color: '#67E8F9', border: 'rgba(8,145,178,0.25)' },
  preparing:         { label: 'Preparing',         bg: 'rgba(245,158,11,0.10)',   color: '#FCD34D', border: 'rgba(245,158,11,0.25)' },
  ready:             { label: 'Ready',             bg: 'rgba(124,58,237,0.10)',   color: '#C4B5FD', border: 'rgba(124,58,237,0.25)' },
  ready_for_pickup:  { label: 'Ready for Pickup',  bg: 'rgba(124,58,237,0.10)',   color: '#C4B5FD', border: 'rgba(124,58,237,0.25)' },
  picked_up:         { label: 'Picked Up',         bg: 'rgba(37,99,235,0.10)',    color: '#93C5FD', border: 'rgba(37,99,235,0.25)' },
  out_for_delivery:  { label: 'Out for Delivery',  bg: 'rgba(79,70,229,0.10)',    color: '#A5B4FC', border: 'rgba(79,70,229,0.25)' },
  delivered:         { label: 'Delivered',         bg: 'rgba(5,150,105,0.10)',    color: '#6EE7B7', border: 'rgba(5,150,105,0.25)' },
  completed:         { label: 'Completed',         bg: 'rgba(34,197,94,0.10)',    color: '#86EFAC', border: 'rgba(34,197,94,0.25)' },
  cancelled:         { label: 'Cancelled',         bg: 'rgba(244,63,94,0.10)',    color: '#FCA5A5', border: 'rgba(244,63,94,0.25)' },
  // legacy aliases (pre-migration)
  pending:           { label: 'Placed',            bg: 'rgba(245,158,11,0.10)',   color: '#FCD34D', border: 'rgba(245,158,11,0.25)' },
  in_progress:       { label: 'Preparing',         bg: 'rgba(59,130,246,0.10)',   color: '#93C5FD', border: 'rgba(59,130,246,0.25)' },
  on_the_way:        { label: 'On The Way',        bg: 'rgba(79,70,229,0.10)',    color: '#A5B4FC', border: 'rgba(79,70,229,0.25)' },
  // ── Non-order statuses (outlet, offer, etc.) ─────────────────────────────
  active:    { label: 'Active',     bg: 'rgba(34,197,94,0.10)',   color: '#86EFAC', border: 'rgba(34,197,94,0.25)' },
  inactive:  { label: 'Inactive',   bg: 'rgba(244,63,94,0.10)',   color: '#FCA5A5', border: 'rgba(244,63,94,0.25)' },
  scheduled: { label: 'Scheduled',  bg: 'rgba(168,85,247,0.10)',  color: '#C084FC', border: 'rgba(168,85,247,0.25)' },
  sent:      { label: 'Sent',       bg: 'rgba(34,197,94,0.10)',   color: '#86EFAC', border: 'rgba(34,197,94,0.25)' },
  draft:     { label: 'Draft',      bg: 'rgba(100,116,139,0.10)', color: '#94A3B8', border: 'rgba(100,116,139,0.25)' },
  expired:   { label: 'Expired',    bg: 'rgba(100,116,139,0.10)', color: '#94A3B8', border: 'rgba(100,116,139,0.25)' },
};

export function getStatusConfig(status?: string): StatusConfig {
  if (!status) return STATUS_CONFIG['draft'];
  return STATUS_CONFIG[status.toLowerCase()] ?? { label: status, bg: 'rgba(99,102,241,0.10)', color: '#A5B4FC', border: 'rgba(99,102,241,0.25)' };
}
