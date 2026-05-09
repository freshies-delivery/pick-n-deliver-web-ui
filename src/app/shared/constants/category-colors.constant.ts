export interface CategoryColor {
  bg: string;
  text: string;
  pill: string;
  bar: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  'Food & Dining':    { bg: 'rgba(249,115,22,0.15)',  text: '#F97316', pill: 'rgba(249,115,22,0.12)', bar: 'linear-gradient(180deg,#F97316,#F59E0B)' },
  'Cafe & Beverages': { bg: 'rgba(168,85,247,0.15)',  text: '#A855F7', pill: 'rgba(168,85,247,0.12)', bar: 'linear-gradient(180deg,#A855F7,#EC4899)' },
  'Grocery':          { bg: 'rgba(34,197,94,0.15)',   text: '#22C55E', pill: 'rgba(34,197,94,0.10)',  bar: 'linear-gradient(180deg,#22C55E,#14B8A6)' },
  'Pharmacy':         { bg: 'rgba(59,130,246,0.15)',  text: '#3B82F6', pill: 'rgba(59,130,246,0.12)', bar: 'linear-gradient(180deg,#3B82F6,#06B6D4)' },
  'Bakery':           { bg: 'rgba(244,63,94,0.15)',   text: '#F43F5E', pill: 'rgba(244,63,94,0.12)',  bar: 'linear-gradient(180deg,#F43F5E,#F97316)' },
  'Meat & Seafood':   { bg: 'rgba(239,68,68,0.15)',   text: '#EF4444', pill: 'rgba(239,68,68,0.12)',  bar: 'linear-gradient(180deg,#EF4444,#F97316)' },
  'Hardware':         { bg: 'rgba(100,116,139,0.15)', text: '#94A3B8', pill: 'rgba(100,116,139,0.12)',bar: 'linear-gradient(180deg,#64748B,#475569)' },
  'Furniture':        { bg: 'rgba(180,83,9,0.15)',    text: '#D97706', pill: 'rgba(180,83,9,0.12)',   bar: 'linear-gradient(180deg,#D97706,#B45309)' },
  'Fashion':          { bg: 'rgba(236,72,153,0.15)',  text: '#EC4899', pill: 'rgba(236,72,153,0.12)', bar: 'linear-gradient(180deg,#EC4899,#A855F7)' },
  'Nursery & Plants': { bg: 'rgba(20,184,166,0.15)',  text: '#14B8A6', pill: 'rgba(20,184,166,0.12)', bar: 'linear-gradient(180deg,#14B8A6,#22C55E)' },
  'Alcohol':          { bg: 'rgba(245,158,11,0.15)',  text: '#F59E0B', pill: 'rgba(245,158,11,0.12)', bar: 'linear-gradient(180deg,#F59E0B,#F97316)' },
  'default':          { bg: 'rgba(99,102,241,0.15)',  text: '#6366F1', pill: 'rgba(99,102,241,0.12)', bar: 'linear-gradient(180deg,#6366F1,#A855F7)' },
};

export function getCategoryColor(category?: string): CategoryColor {
  if (!category) return CATEGORY_COLORS['default'];
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['default'];
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
