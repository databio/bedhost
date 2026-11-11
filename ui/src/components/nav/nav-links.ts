const API_BASE = import.meta.env.VITE_API_BASE || '';

export type NavLink = {
  label: string;
  href: string;
  icon: string; // Bootstrap icon class, e.g. 'bi-search'
  external?: boolean; // opens in a new tab
  topLevel?: boolean; // shown in the desktop top bar instead of under "More"
};

// The one list of site links. The desktop and mobile menus are both built
// from it, so a page added here shows up in both.
export const NAV_LINKS: NavLink[] = [
  { label: 'Search', href: '/search', icon: 'bi-search', topLevel: true },
  { label: 'Analyzer', href: '/analyze', icon: 'bi-body-text', topLevel: true },
  { label: 'Visualization', href: '/umap', icon: 'bi-diagram-3', topLevel: true },
  { label: 'Downloads', href: '/downloads', icon: 'bi-download' },
  { label: 'Analysis files', href: '/files', icon: 'bi-file-earmark-binary' },
  { label: 'Metrics', href: '/metrics', icon: 'bi-bar-chart' },
  { label: 'GitHub', href: 'https://github.com/databio/bedhost', icon: 'bi-github', external: true },
  { label: 'Docs', href: 'https://docs.bedbase.org/bedbase/', icon: 'bi-file-earmark-text', external: true },
  { label: 'API', href: API_BASE, icon: 'bi-hdd-stack', external: true },
];

// Extra link props so off-site links open in a new tab.
export const linkTarget = (link: NavLink) =>
  link.external ? { target: '_blank', rel: 'noreferrer noopener' } : {};
