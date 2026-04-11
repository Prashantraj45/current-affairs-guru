export const NAV_LINKS = [
  { href: '/', label: 'Daily Brief' },
  { href: '/history', label: 'Chronicle' },
  { href: '/intel-canvas', label: 'Signal Deck' },
  { href: '/donate', label: 'Donate' },
  { href: '/support', label: 'Support' },
];

export const CATEGORY_COLORS = {
  Environment: {
    soft: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/35',
  },
  Polity: {
    soft: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/35',
  },
  Economy: {
    soft: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/35',
  },
  IR: {
    soft: 'bg-violet-500/15',
    text: 'text-violet-400',
    border: 'border-violet-500/35',
  },
  Science: {
    soft: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    border: 'border-cyan-500/35',
  },
  Reports: {
    soft: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/35',
  },
};

export const IMPORTANCE_COLORS = {
  HIGH: {
    dot: 'bg-red-400',
    text: 'text-red-400',
    soft: 'bg-red-500/15',
    border: 'border-red-500/30',
  },
  MEDIUM: {
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    soft: 'bg-amber-500/15',
    border: 'border-amber-500/30',
  },
  LOW: {
    dot: 'bg-slate-500',
    text: 'text-slate-500',
    soft: 'bg-slate-500/15',
    border: 'border-slate-500/30',
  },
};

export const GS_PILLARS = [
  {
    key: 'GS Paper I',
    title: 'History, Culture & Geography',
    icon: 'Globe2',
    description: 'Civilization patterns, cultural continuity, and resource geographies shaping policy.',
    topics: ['Modern Indian history', 'Art and culture', 'World geography', 'Indian society'],
  },
  {
    key: 'GS Paper II',
    title: 'Polity & Governance',
    icon: 'Scale',
    description: 'Constitutional institutions, rights frameworks, welfare governance, and external affairs.',
    topics: ['Constitutional bodies', 'Federalism', 'Social justice', 'International relations'],
  },
  {
    key: 'GS Paper III',
    title: 'Economy, Security & Environment',
    icon: 'BarChart3',
    description: 'Growth-policy balance, science and technology, climate transition, and national security.',
    topics: ['Macroeconomy', 'Internal security', 'Science and tech', 'Environment and disasters'],
  },
  {
    key: 'GS Paper IV',
    title: 'Ethics, Integrity & Aptitude',
    icon: 'ShieldCheck',
    description: 'Public service ethics and case-oriented reasoning for governance decision-making.',
    topics: ['Ethical theories', 'Civil service values', 'Probity in governance', 'Case study practice'],
  },
];
