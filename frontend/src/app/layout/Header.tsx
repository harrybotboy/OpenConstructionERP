import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Menu, FolderOpen, Search } from 'lucide-react';
import clsx from 'clsx';
import { useProjectContextStore } from '@/stores/useProjectContextStore';
import { apiGet } from '@/shared/lib/api';
import { useI18nReady } from '@/shared/lib/useI18nReady';

/** Map English page titles (passed from App.tsx routes) to i18n keys. */
const TITLE_I18N_MAP: Record<string, string> = {
  'Dashboard': 'nav.dashboard',
  'AI Quick Estimate': 'nav.ai_estimate',
  'AI Cost Advisor': 'nav.ai_advisor',
  'CAD/BIM Takeoff': 'nav.cad_takeoff',
  'Match Elements': 'match_elements.title',
  'Projects': 'nav.projects',
  'New Project': 'projects.new_project',
  'Project': 'nav.projects',
  'New BOQ': 'boq.new_estimate',
  'Bill of Quantities': 'nav.boq',
  'BOQ Editor': 'boq.editor',
  'BOQ Templates': 'nav.templates',
  'Cost Database': 'nav.costs',
  'Import Cost Database': 'costs.import_title',
  'Resource Catalog': 'nav.resource_catalog',
  'Assemblies': 'nav.assemblies',
  'New Assembly': 'assemblies.new',
  'Assembly Editor': 'assemblies.editor',
  'Validation': 'nav.validation',
  'Quantity Takeoff': 'nav.takeoff_overview',
  'PDF Takeoff': 'nav.takeoff',
  '4D Schedule': 'nav.schedule',
  '5D Cost Model': 'nav.5d_cost_model',
  'Reports': 'nav.reports',
  'Sustainability': 'nav.sustainability',
  'Tendering': 'nav.tendering',
  'Change Orders': 'nav.change_orders',
  'Documents': 'nav.documents',
  'Project Photos': 'nav.photos',
  'Project Files': 'nav.project_files',
  'Risk Register': 'nav.risk_register',
  'Analytics': 'nav.analytics',
  'About': 'nav.about',
  'Not Found': 'error.not_found',
  'Modules': 'nav.modules',
  'Settings': 'nav.settings',
};

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { t } = useTranslation();
  useI18nReady();
  const translatedTitle = title
    ? t(TITLE_I18N_MAP[title] ?? title, { defaultValue: title })
    : undefined;

  return (
    <header
      className={clsx(
        'sticky top-0 z-30 relative',
        'flex h-header items-center justify-between gap-3 px-4 sm:px-6 lg:px-8',
        'bg-surface-primary/80 backdrop-blur-xl',
      )}
    >
      {/* Soft hairline at the bottom — replaces a hard 1px border for
          a calmer Linear/Vercel-style separation from the page below. */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ── Zone 1 (Workspace): mobile menu + project breadcrumb + title ── */}
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            aria-label={t('common.open_menu', { defaultValue: 'Open menu‌⁠‍' })}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-content-secondary hover:bg-surface-secondary lg:hidden"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Active project switcher (rendered first so the breadcrumb
            reads left-to-right as ProjectName › PageTitle). */}
        <ProjectSwitcher />

        {translatedTitle && (
          <>
            {/* Breadcrumb separator — only shown on lg+ where the page
                title is visible. Subtle chevron so it reads as
                "ProjectName › PageTitle" hierarchy. */}
            <ChevronRight
              size={14}
              strokeWidth={1.75}
              className="hidden lg:block shrink-0 text-content-quaternary/60"
              aria-hidden
            />
            <h1 className="hidden lg:block text-base font-semibold text-content-primary truncate sm:text-lg">{translatedTitle}</h1>
          </>
        )}
      </div>

    </header>
  );
}

/* ── Project Switcher (global dropdown in header) ─────────────────────── */

/**
 * Compute where to navigate after switching projects in the global picker.
 *
 * We stay on the same module but never keep a URL that points at an
 * entity (BOQ / BIM model / assembly / transmittal / …) owned by the
 * *previous* project — that entity doesn't belong to the new project,
 * so the page would either 404 or silently show stale data.
 *
 * Rules:
 *   `/projects/:oldId` or `/projects/:oldId/sub` → swap in the new id
 *       (e.g. /projects/AAA/finance → /projects/BBB/finance)
 *   `/<module>/:entityId` where `<module>` is one of the entity-scoped
 *       list-plus-detail modules → redirect to the module list `/<module>`
 *   everything else → stay on the same URL
 */
export function resolveRouteAfterProjectSwitch(
  pathname: string,
  newProjectId: string,
): string | null {
  const projectSub = pathname.match(/^\/projects\/[^/]+(\/.*)?$/);
  if (projectSub) {
    const suffix = projectSub[1] ?? '';
    return `/projects/${newProjectId}${suffix}`;
  }
  // Module-scoped detail routes.  The list lives at /<module>.
  const entityRoutes: Array<[RegExp, string]> = [
    [/^\/boq\/[^/]+/, '/boq'],
    [/^\/bim\/[^/]+/, '/bim'],
    [/^\/assemblies\/[^/]+/, '/assemblies'],
    [/^\/takeoff\/[^/]+/, '/takeoff'],
    [/^\/documents\/[^/]+/, '/documents'],
    [/^\/transmittals\/[^/]+/, '/transmittals'],
    [/^\/rfi\/[^/]+/, '/rfi'],
    [/^\/submittals\/[^/]+/, '/submittals'],
    [/^\/contacts\/[^/]+/, '/contacts'],
    [/^\/tasks\/[^/]+/, '/tasks'],
    [/^\/markups\/[^/]+/, '/markups'],
    [/^\/reports\/[^/]+/, '/reports'],
  ];
  for (const [re, list] of entityRoutes) {
    if (re.test(pathname)) return list;
  }
  return null;
}

function ProjectSwitcher() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const activeProjectId = useProjectContextStore((s) => s.activeProjectId);
  const activeProjectName = useProjectContextStore((s) => s.activeProjectName);
  const setActiveProject = useProjectContextStore((s) => s.setActiveProject);
  const clearProject = useProjectContextStore((s) => s.clearProject);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // "Show all" toggle — collapsed by default to keep the dropdown tidy
  // when the user has dozens of projects; explicit opt-in to expand.
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Pre-fetch so the dropdown renders an instant list when the user opens
  // it (no race between open → fetch → render that used to flash
  // "No projects yet" for half a second).
  const { data: projects, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects-switcher'],
    queryFn: () => apiGet<Array<{ id: string; name: string }>>('/v1/projects/?limit=500'),
    staleTime: 60_000,
    // Enabled as soon as the component mounts — the Header is always on
    // screen after login, so the list is warm by the time the user clicks.
    enabled: true,
  });

  const MAX_VISIBLE = 20;
  const filteredProjects = (projects ?? []).filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  // When the user is actively searching, show every hit — typing is an
  // implicit "show all that match". The collapse/expand affordance only
  // applies to the default, unfiltered listing.
  const showEverything = expanded || searchQuery.trim().length > 0;
  const visibleProjects = showEverything
    ? filteredProjects
    : filteredProjects.slice(0, MAX_VISIBLE);
  const remainingCount = filteredProjects.length - visibleProjects.length;

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setExpanded(false);
      return;
    }
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, projects]);

  // Auto-clear a stale ``activeProjectId`` whose project no longer exists
  // on the server (hard-deleted by another session / admin cleanup). A
  // stale id kept pinging 404 on every module that accepts a project
  // context — the most visible one being BIM upload, which failed with
  // "Project not found" because the persisted id in localStorage had
  // been wiped from the DB. We only run the purge once the list has
  // actually loaded (``projects`` defined, even if empty) to avoid
  // blowing away the selection during the first render before data
  // arrives.
  useEffect(() => {
    if (!projects) return;
    if (!activeProjectId) return;
    const stillExists = projects.some((p) => p.id === activeProjectId);
    if (!stillExists) {
      clearProject();
    }
  }, [projects, activeProjectId, clearProject]);

  return (
    <div className="relative hidden sm:block" ref={ref}>
      {/* Split-button — visibly the most-used surface in the app. Left half
          opens the active project's detail; right half (chevron) opens
          the switcher dropdown. Two distinct visual modes:
            • No project active → dashed pill + pulsing dot + clear CTA
            • Project active   → solid blue-subtle bg + folder square +
                                 bold project name
          Taller h-9 hit-target, always tinted, never blends into the
          chrome — this is the breadcrumb root, it should anchor the eye. */}
      <div
        className={clsx(
          'flex items-stretch rounded-lg border transition-all max-w-[260px] overflow-hidden',
          activeProjectId
            ? 'bg-oe-blue-subtle border-oe-blue/30 hover:bg-oe-blue/10 hover:border-oe-blue/50 shadow-[0_1px_2px_rgba(0,122,255,0.05)]'
            : 'border-dashed border-oe-blue/40 bg-oe-blue/[0.04] hover:bg-oe-blue/[0.08] hover:border-oe-blue/60',
        )}
      >
        <button
          type="button"
          onClick={() => {
            if (activeProjectId) {
              navigate(`/projects/${activeProjectId}`);
            } else {
              setOpen(true);
            }
          }}
          className={clsx(
            'flex items-center gap-2 pl-1.5 pr-2 h-9 text-[13px] min-w-0',
            activeProjectId ? 'text-oe-blue' : 'text-oe-blue/85 hover:text-oe-blue',
          )}
          title={activeProjectId
            ? t('projects.open_current', { defaultValue: 'Open this project' })
            : t('schedule.select_project', { defaultValue: 'Select Project' })}
        >
          {/* Leading icon square — colored tile in active mode; pulsing
              dot in CTA mode so the eye is drawn to "act here". */}
          {activeProjectId ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-oe-blue/15 shrink-0">
              <FolderOpen size={13} strokeWidth={2} />
            </span>
          ) : (
            <span aria-hidden className="flex h-6 w-6 items-center justify-center shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 rounded-full bg-oe-blue/60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-oe-blue" />
              </span>
            </span>
          )}
          <span className={clsx(
            'truncate',
            activeProjectId ? 'font-semibold' : 'font-medium',
          )}>
            {activeProjectName || t('schedule.select_project', { defaultValue: 'Select Project' })}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={clsx(
            'flex items-center px-2 border-l transition-colors',
            activeProjectId
              ? 'border-oe-blue/20 text-oe-blue/70 hover:bg-oe-blue/10 hover:text-oe-blue'
              : 'border-oe-blue/25 border-dashed text-oe-blue/60 hover:bg-oe-blue/10 hover:text-oe-blue',
          )}
          title={t('schedule.switch_project', { defaultValue: 'Switch Project' })}
          aria-label={t('schedule.switch_project', { defaultValue: 'Switch Project' })}
        >
          <ChevronDown size={13} strokeWidth={2.25} className={clsx(
            'shrink-0 transition-transform duration-fast',
            open && 'rotate-180',
          )} />
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 rounded-xl border border-border bg-surface-elevated shadow-xl overflow-hidden animate-fade-in">
          <div className="px-4 py-2.5 border-b border-border-light bg-surface-secondary/50">
            <p className="text-xs font-semibold text-content-secondary">
              {t('schedule.switch_project', { defaultValue: 'Switch Project' })}
            </p>
          </div>
          <div className="px-3 py-2 border-b border-border-light">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-quaternary pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search', { defaultValue: 'Search...' })}
                className="w-full rounded-lg border border-border-light bg-surface-secondary pl-8 pr-3 py-1.5 text-sm text-content-primary placeholder:text-content-quaternary focus:outline-none focus:ring-2 focus:ring-oe-blue/30 focus:border-oe-blue"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {isLoading && (
              <div className="flex items-center gap-2 px-4 py-4 text-sm text-content-tertiary">
                <span className="inline-block w-3 h-3 border-2 border-oe-blue border-t-transparent rounded-full animate-spin" />
                {t('common.loading', { defaultValue: 'Loading…' })}
              </div>
            )}
            {!isLoading && isError && (
              <div className="px-4 py-4 text-sm text-content-tertiary text-center">
                <p className="text-red-500 mb-2">
                  {t('common.load_failed', { defaultValue: 'Could not load projects' })}
                </p>
                <button
                  onClick={() => refetch()}
                  className="text-xs text-oe-blue hover:underline"
                >
                  {t('common.retry', { defaultValue: 'Retry' })}
                </button>
              </div>
            )}
            {!isLoading && !isError && visibleProjects.length === 0 && (
              <p className="px-4 py-4 text-sm text-content-tertiary text-center">
                {searchQuery
                  ? t('common.no_results', { defaultValue: 'No projects found' })
                  : t('projects.none', { defaultValue: 'No projects yet' })}
              </p>
            )}
            {visibleProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProject(p.id, p.name);
                  const target = resolveRouteAfterProjectSwitch(location.pathname, p.id);
                  if (target && target !== location.pathname) navigate(target);
                  setOpen(false);
                }}
                className={clsx(
                  'flex w-full items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                  p.id === activeProjectId
                    ? 'bg-oe-blue-subtle text-oe-blue font-medium'
                    : 'text-content-primary hover:bg-surface-secondary',
                )}
              >
                <div className={clsx(
                  'flex items-center justify-center w-7 h-7 rounded-md shrink-0',
                  p.id === activeProjectId
                    ? 'bg-oe-blue/10'
                    : 'bg-surface-tertiary',
                )}>
                  <FolderOpen size={14} className="shrink-0" />
                </div>
                <span className="truncate">{p.name}</span>
                {p.id === activeProjectId && (
                  <span className="ml-auto text-2xs text-oe-blue font-normal shrink-0">
                    {t('common.active', { defaultValue: 'Active' })}
                  </span>
                )}
              </button>
            ))}
            {remainingCount > 0 && !showEverything && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="w-full px-4 py-2 text-xs font-medium text-oe-blue hover:bg-surface-secondary transition-colors text-center"
              >
                {t('projects.show_all', {
                  defaultValue: 'Show all ({{count}})',
                  count: filteredProjects.length,
                })}
              </button>
            )}
            {expanded && !searchQuery && filteredProjects.length > MAX_VISIBLE && (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="w-full px-4 py-2 text-xs font-medium text-content-tertiary hover:bg-surface-secondary transition-colors text-center"
              >
                {t('projects.collapse_list', { defaultValue: 'Collapse' })}
              </button>
            )}
          </div>
          {activeProjectId && (
            <div className="border-t border-border-light px-4 py-2.5">
              <button
                onClick={() => { navigate(`/projects/${activeProjectId}`); setOpen(false); }}
                className="text-xs font-medium text-oe-blue hover:underline"
              >
                {t('projects.open_details', { defaultValue: 'Open Project Details' })} &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
