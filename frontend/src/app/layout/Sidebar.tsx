import { useState, useCallback, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CustomBranding } from './CustomBranding';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import {
  LayoutDashboard,
  FolderOpen,
  Table2,
  CalendarDays,
  Database,
  Bot,
  Layers,
  Library,
  Boxes,
  Box,
  ShieldCheck,
  FileText,
  FileBarChart,
  Package,
  Settings,
  Info,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Ruler,
  Sparkles,
  MessageSquare,
  X,
  FileEdit,
  ShieldAlert,
  ClipboardCheck,
  ClipboardList,
  PenTool,
  PencilRuler,
  ListChecks,
  Camera,
  TableProperties,
  Wallet,
  HardHat,
  Users,
  HelpCircle,
  AlertOctagon,
  FileCheck,
  Mail,
  Send,
  History,
  BrainCircuit,
  SlidersHorizontal,
  HardDrive,
  LogOut,
  Link2,
  // 18-Modules Wave icons
  Wrench,
  Truck,
  BookOpen,
  Globe,
  FileSignature,
  Briefcase,
  Scale,
  GitBranch,
  Building2,
  ShoppingCart,
  BadgeCheck,
  Shield,
  Leaf,
  BarChart3,
  LineChart,
  Radar,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useModuleStore } from '@/stores/useModuleStore';
import { UpdateNotification } from '@/shared/ui/UpdateChecker';
import { useViewModeStore } from '@/stores/useViewModeStore';
import { useRecentStore } from '@/stores/useRecentStore';
import { getModuleNavItems } from '@/modules/_registry';
import { useSidebarBadges } from '@/shared/hooks/useSidebarBadges';
import { useIsRTL } from '@/shared/hooks/useIsRTL';
import {
  useSidebarCollapseStore,
  SIDEBAR_WIDTH_FULL,
  SIDEBAR_WIDTH_ICON,
} from '@/stores/useSidebarCollapseStore';
import { useNavVisibilityStore } from '@/stores/useNavVisibilityStore';
import {
  useActiveProjectProfile,
  buildModuleGate,
} from '@/features/projects/useProjectProfile';


interface NavItem {
  labelKey: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
  highlight?: boolean;
  moduleKey?: string;
  advancedOnly?: boolean; // Hidden in simple mode
  tourId?: string; // data-tour attribute for onboarding
  /** Optional role gate — hide the entry unless the JWT role matches.
   *  Used for admin-only items like the Audit Log (`audit.view`
   *  permission, MANAGER+ on the backend). */
  roleGate?: ('admin' | 'manager' | 'editor' | 'viewer')[];
}

interface NavGroup {
  id: string;
  labelKey: string;
  descriptionKey?: string;
  items: NavItem[];
  defaultOpen: boolean;
  hideInSimple?: boolean; // Entire group hidden in simple mode
}

// Navigation groups — collapsible sections
const navGroups: NavGroup[] = [
  // ── CORE (always visible) ──────────────────────────────────────────
  {
    id: 'overview',
    labelKey: 'nav.group_overview',
    defaultOpen: true,
    items: [
      { labelKey: 'nav.dashboard', to: '/', icon: LayoutDashboard },
      { labelKey: 'projects.title', to: '/projects', icon: FolderOpen, tourId: 'projects' },
      // Files lives in Overview because it's the unified entry point
      // into a project's documents, photos, BIM and DWG — users land
      // here to pick what to work on, just like the dashboard.
      { labelKey: 'nav.project_files', to: '/files', icon: HardDrive },
    ],
  },
  {
    id: 'estimation',
    labelKey: 'nav.group_estimation',
    descriptionKey: 'nav.group_estimation_desc',
    defaultOpen: true,
    items: [
      { labelKey: 'boq.title', to: '/boq', icon: Table2, tourId: 'boq' },
      { labelKey: 'costs.title', to: '/costs', icon: Database, tourId: 'costs' },
      { labelKey: 'nav.match_elements', to: '/match-elements', icon: Link2, badge: 'BETA' },
      { labelKey: 'nav.assemblies', to: '/assemblies', icon: Layers },
      { labelKey: 'nav.assembly_library', to: '/assemblies/library', icon: Library, badge: 'BETA' },
      { labelKey: 'catalog.title', to: '/catalog', icon: Boxes },
      { labelKey: 'nav.quantity_rules', to: '/bim/rules', icon: ClipboardCheck, badge: 'BETA' },
    ],
  },
  {
    id: 'takeoff',
    labelKey: 'nav.group_takeoff',
    defaultOpen: true,
    items: [
      { labelKey: 'nav.pdf_measurements', to: '/takeoff?tab=measurements', icon: Ruler },
      { labelKey: 'nav.dwg_takeoff', to: '/dwg-takeoff', icon: PencilRuler },
      { labelKey: 'nav.cad_bim_explorer', to: '/data-explorer', icon: TableProperties },
      { labelKey: 'nav.bim_viewer', to: '/bim', icon: Box },
      { labelKey: 'nav.bim_federations', to: '/bim/federations', icon: Layers, badge: 'NEW' },
      { labelKey: 'nav.clash_detection', to: '/clash', icon: Radar, badge: 'BETA' },
      { labelKey: 'nav.bim_rules', to: '/bim/rules?mode=requirements', icon: SlidersHorizontal, badge: 'BETA' },
    ],
  },
  {
    id: 'ai',
    labelKey: 'nav.group_ai_estimation',
    defaultOpen: true,
    hideInSimple: true,
    items: [
      { labelKey: 'nav.ai_estimate', to: '/ai-estimate', icon: Sparkles, badge: 'BETA' },
      { labelKey: 'nav.ai_agents', to: '/ai-agents', icon: Bot, badge: 'NEW' },
      { labelKey: 'nav.ai_advisor', to: '/advisor', icon: MessageSquare },
      { labelKey: 'nav.estimation_dashboard', to: '/project-intelligence', icon: BrainCircuit, badge: 'BETA' },
      { labelKey: 'nav.erp_chat', to: '/chat', icon: MessageSquare, badge: 'BETA' },
    ],
  },
  // ── PLANNING & CONTROL (advanced) ──────────────────────────────────
  {
    id: 'planning',
    labelKey: 'nav.group_planning',
    descriptionKey: 'nav.group_planning_desc',
    defaultOpen: false,
    hideInSimple: true,
    items: [
      { labelKey: 'schedule.title', to: '/schedule', icon: CalendarDays, moduleKey: 'schedule' },
      { labelKey: 'nav.schedule_advanced', to: '/schedule-advanced', icon: LineChart, advancedOnly: true },
      { labelKey: 'tasks.title', to: '/tasks', icon: ClipboardList },
      { labelKey: 'nav.5d_cost_model', to: '/5d', icon: TrendingUp, moduleKey: '5d', advancedOnly: true },
      // Requirements merged into /bim/rules — sidebar entry removed
      { labelKey: 'nav.risk_register', to: '/risks', icon: ShieldAlert, advancedOnly: true },
    ],
  },
  // ── FIELD OPERATIONS (18-Modules Wave) ─────────────────────────────
  // Day-to-day site operations: service tickets, equipment, daily diary,
  // subcontractor portal, resource/crew assignment. Most useful to PMs,
  // site engineers, and field supervisors.
  {
    id: 'operations',
    labelKey: 'nav.group_operations',
    descriptionKey: 'nav.group_operations_desc',
    defaultOpen: false,
    hideInSimple: true,
    items: [
      { labelKey: 'nav.daily_diary', to: '/daily-diary', icon: BookOpen },
      { labelKey: 'nav.equipment', to: '/equipment', icon: Truck },
      { labelKey: 'nav.resources', to: '/resources', icon: Users },
      { labelKey: 'nav.service', to: '/service', icon: Wrench },
      { labelKey: 'nav.portal', to: '/portal', icon: Globe },
    ],
  },
  {
    id: 'finance',
    labelKey: 'nav.group_finance',
    defaultOpen: false,
    hideInSimple: true,
    items: [
      { labelKey: 'finance.title', to: '/finance', icon: Wallet, advancedOnly: true },
      { labelKey: 'procurement.title', to: '/procurement', icon: Package, advancedOnly: true },
      { labelKey: 'tendering.title', to: '/tendering', icon: FileText, moduleKey: 'tendering', advancedOnly: true },
      { labelKey: 'nav.change_orders', to: '/changeorders', icon: FileEdit, advancedOnly: true },
    ],
  },
  // ── COMMERCIAL (18-Modules Wave) ───────────────────────────────────
  // Commercial pipeline — from CRM lead to contract award to variations,
  // including subcontractor management, bid management, supplier
  // catalogs, and property/asset development tracking.
  {
    id: 'commercial',
    labelKey: 'nav.group_commercial',
    descriptionKey: 'nav.group_commercial_desc',
    defaultOpen: false,
    hideInSimple: true,
    items: [
      { labelKey: 'nav.crm', to: '/crm', icon: Briefcase },
      { labelKey: 'nav.contracts', to: '/contracts', icon: FileSignature },
      { labelKey: 'nav.subcontractors', to: '/subcontractors', icon: HardHat },
      { labelKey: 'nav.bid_management', to: '/bid-management', icon: Scale },
      { labelKey: 'nav.variations', to: '/variations', icon: GitBranch },
      { labelKey: 'nav.supplier_catalogs', to: '/supplier-catalogs', icon: ShoppingCart },
      { labelKey: 'nav.property_dev', to: '/property-dev', icon: Building2 },
    ],
  },
  // ── COMMUNICATION ──────────────────────────────────────────────────
  {
    id: 'communication',
    labelKey: 'nav.group_communication',
    defaultOpen: false,
    hideInSimple: true,
    items: [
      { labelKey: 'contacts.title', to: '/contacts', icon: Users },
      { labelKey: 'meetings.title', to: '/meetings', icon: CalendarDays },
      { labelKey: 'rfi.title', to: '/rfi', icon: HelpCircle, advancedOnly: true },
      { labelKey: 'submittals.title', to: '/submittals', icon: FileCheck, advancedOnly: true },
      { labelKey: 'transmittals.title', to: '/transmittals', icon: Send, advancedOnly: true },
      { labelKey: 'correspondence.title', to: '/correspondence', icon: Mail, advancedOnly: true },
    ],
  },
  // ── DOCUMENTS ──────────────────────────────────────────────────────
  // /files moved to Overview (unified entry point); leaving the
  // narrower per-type entries here for users who jump straight to a
  // category-specific tool.
  {
    id: 'documentation',
    labelKey: 'nav.group_documentation',
    defaultOpen: false,
    hideInSimple: true,
    items: [
      { labelKey: 'nav.assets', to: '/assets', icon: Package, badge: 'BETA' },
      { labelKey: 'cde.title', to: '/cde', icon: Database },
      { labelKey: 'nav.photos', to: '/photos', icon: Camera },
      { labelKey: 'nav.markups', to: '/markups', icon: PenTool },
      { labelKey: 'nav.field_reports', to: '/field-reports', icon: ClipboardList, advancedOnly: true },
      { labelKey: 'nav.reports', to: '/reports', icon: FileBarChart, advancedOnly: true },
      { labelKey: 'nav.bi_dashboards', to: '/bi-dashboards', icon: BarChart3, advancedOnly: true },
    ],
  },
  // ── QUALITY & SAFETY ───────────────────────────────────────────────
  {
    id: 'quality',
    labelKey: 'nav.group_quality',
    defaultOpen: false,
    hideInSimple: true,
    items: [
      { labelKey: 'validation.title', to: '/validation', icon: ShieldCheck, moduleKey: 'validation' },
      { labelKey: 'inspections.title', to: '/inspections', icon: ClipboardCheck },
      { labelKey: 'ncr.title', to: '/ncr', icon: AlertOctagon },
      { labelKey: 'safety.title', to: '/safety', icon: HardHat },
      { labelKey: 'nav.punchlist', to: '/punchlist', icon: ListChecks },
      // 18-Modules Wave additions
      { labelKey: 'nav.qms', to: '/qms', icon: BadgeCheck, advancedOnly: true },
      { labelKey: 'nav.hse_advanced', to: '/hse-advanced', icon: Shield, advancedOnly: true },
      { labelKey: 'nav.carbon', to: '/carbon', icon: Leaf, advancedOnly: true },
      // sustainability + cost-benchmark injected dynamically from module registry
    ],
  },
  // BI Dashboards moved into the Documentation group (above) — the
  // remaining "Analytics" group had only one entry and now feels
  // redundant alongside Reports / Field Reports in Documentation.
  {
    id: 'regional',
    labelKey: 'modules.cat_regional',
    descriptionKey: 'modules.cat_regional_desc',
    defaultOpen: false,
    hideInSimple: true,
    items: [
      // All regional exchange modules injected dynamically from module registry
    ],
  },
  {
    id: 'administration',
    labelKey: 'nav.group_administration',
    defaultOpen: false,
    items: [
      { labelKey: 'users.management', to: '/users', icon: Users },
      {
        labelKey: 'nav.audit_log',
        to: '/admin/audit-log',
        icon: ScrollText,
        roleGate: ['admin', 'manager'],
      },
      {
        labelKey: 'nav.permissions_matrix',
        to: '/admin/permissions',
        icon: ShieldCheck,
        roleGate: ['admin', 'manager'],
      },
      { labelKey: 'modules.title', to: '/modules', icon: Package },
      { labelKey: 'nav.settings', to: '/settings', icon: Settings },
      { labelKey: 'nav.about', to: '/about', icon: Info },
    ],
  },
];

const ALL_ROUTES: string[] = navGroups.flatMap((g) => g.items.map((i) => i.to));

// localStorage key for collapsed state
const COLLAPSED_KEY = 'oe_sidebar_collapsed';

function readCollapsedState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

function writeCollapsedState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}


const KBD_BY_LETTER: Record<string, string> = {
  d: '/',
  p: '/projects',
  b: '/boq',
  c: '/costs',
  m: '/bim',
  a: '/ai-estimate',
  ',': '/settings',
};

/** Compute the single best-matching nav route for the current location.
 *  React Router's NavLink uses prefix matching, which lights up BOTH
 *  `/bim` and `/bim/rules` when the user is on `/bim/rules`. We pick
 *  the most specific match instead — query-aware exact match wins,
 *  then plain pathname match, then the longest prefix among nav items.
 *  Returns the chosen item's `to` string, or null when nothing matches.
 */
function pickActiveRoute(
  location: { pathname: string; search: string },
  routes: string[],
): string | null {
  const currentParams = new URLSearchParams(location.search);

  // 1) Query-aware exact match — `/takeoff?tab=measurements` wins over
  //    `/takeoff` and over the broader `/takeoff?tab=...` siblings when
  //    every required param value is present in the current URL.
  const queryMatches = routes
    .filter((r) => r.includes('?'))
    .filter((r) => {
      const [pathname, qs] = r.split('?');
      if (location.pathname !== pathname) return false;
      const want = new URLSearchParams(qs);
      for (const [k, v] of want) {
        if (currentParams.get(k) !== v) return false;
      }
      return true;
    });
  if (queryMatches.length > 0) {
    return queryMatches.sort((a, b) => b.length - a.length)[0]!;
  }

  // 2) Plain pathname matches: exact wins; otherwise longest prefix.
  let best: string | null = null;
  let bestLen = -1;
  for (const route of routes) {
    if (route.includes('?')) continue;
    if (route === location.pathname) {
      if (route.length > bestLen) {
        best = route;
        bestLen = route.length;
      }
      continue;
    }
    if (route !== '/' && location.pathname.startsWith(route + '/')) {
      if (route.length > bestLen) {
        best = route;
        bestLen = route.length;
      }
    } else if (route === '/' && location.pathname === '/') {
      if (route.length > bestLen) {
        best = route;
        bestLen = route.length;
      }
    }
  }
  return best;
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isModuleEnabled } = useModuleStore();
  const isAdvanced = useViewModeStore((s) => s.isAdvanced);
  const badgeCounts = useSidebarBadges();
  const iconified = useSidebarCollapseStore((s) => s.iconified);
  const toggleIconified = useSidebarCollapseStore((s) => s.toggle);
  const isRTL = useIsRTL();
  const isGroupHidden = useNavVisibilityStore((s) => s.isGroupHidden);

  // Drive the global CSS variable so both the aside (`w-sidebar`) and
  // the main-content offset (`lg:pl-sidebar`) shrink/grow in lockstep.
  // The variable lives on :root so it survives across remounts; we
  // reset it to the full width when the component unmounts only if it
  // was the one that shrunk it, to avoid stranding a 64px gutter when
  // the user logs out.
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--oe-sidebar-width',
      iconified ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH_FULL,
    );
  }, [iconified]);

  // Map route paths → open-item counts for sidebar badges
  const badgeMap: Record<string, number> = {
    '/tasks': badgeCounts.tasks,
    '/rfi': badgeCounts.rfi,
    '/safety': badgeCounts.safety,
  };

  // Initialize collapsed state from localStorage, falling back to group defaults
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const stored = readCollapsedState();
    const initial: Record<string, boolean> = {};
    for (const group of navGroups) {
      initial[group.id] = stored[group.id] ?? !group.defaultOpen;
    }
    return initial;
  });

  // Persist collapsed state to localStorage
  useEffect(() => {
    writeCollapsedState(collapsed);
  }, [collapsed]);

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  // ── Two-key navigation shortcuts (G then X) ──────────────────────────
  // Linear/GitHub-style. We listen at document level for the leading
  // `G`, then within 1.5 s any single letter from KBD_BY_LETTER fires
  // the matching navigation. Ignores all keystrokes that originate
  // from text fields so it doesn't conflict with form input.
  const firstKeyRef = useRef<string | null>(null);
  const firstKeyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearFirst = () => {
      firstKeyRef.current = null;
      if (firstKeyTimerRef.current != null) {
        window.clearTimeout(firstKeyTimerRef.current);
        firstKeyTimerRef.current = null;
      }
    };

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const editable = (e.target as HTMLElement | null)?.isContentEditable;
      if (editable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (firstKeyRef.current === 'g') {
        const route = KBD_BY_LETTER[key];
        if (route) {
          e.preventDefault();
          // The dashboard chord must reach the dashboard even on fresh
          // installs — DashboardPage normally redirects to /onboarding
          // until the wizard is finished, but a deliberate chord nav
          // means "show me the dashboard now". Sentinel is read+cleared
          // by DashboardPage's first-launch effect.
          if (key === 'd') {
            try {
              sessionStorage.setItem('oe_skip_onboarding_redirect', '1');
            } catch {
              /* storage unavailable */
            }
          }
          navigate(route);
        }
        clearFirst();
        return;
      }

      if (key === 'g') {
        firstKeyRef.current = 'g';
        firstKeyTimerRef.current = window.setTimeout(clearFirst, 1500);
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      clearFirst();
    };
  }, [navigate]);

  const activeRoute = pickActiveRoute(location, ALL_ROUTES);

  // ── Project focus (in-place) ────────────────────────────────────────
  // When the active project has a setup profile with focus mode ON, the
  // sidebar keeps its ORIGINAL menu and ORIGINAL order — no separate
  // "project route" section is hoisted to the top. Instead, in place:
  //   • modules the project needs  → fully visible + a sequence number
  //   • modules it does not need   → smaller and de-emphasized (grey)
  //   • routes outside the profile → rendered normally (global nav
  //     never breaks).
  // No active project / no profile / focus mode OFF → `gate.active` is
  // false and every row renders exactly as the flat default.
  const { profile: activeProfile } = useActiveProjectProfile();
  const gate = buildModuleGate(activeProfile);
  return (
    <aside
      data-tour="sidebar"
      className="oe-sidebar ec-sidebar relative flex h-full w-sidebar flex-col bg-surface-primary"
      style={{
        boxShadow: '1px 0 0 rgba(0,0,0,0.5), 6px 0 24px -6px rgba(0,0,0,0.4)',
      }}
    >
      {/* Page-scoped CSS — sidebar-only animations. Defined inline to
          keep this component fully self-contained. */}
      <style>{`
        @keyframes oeStaggerIn {
          0%   { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .oe-sidebar .oe-stagger {
          animation: oeStaggerIn 220ms cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
        }
        /* Hover-arrow: a subtle right-pointing chevron that fades in
           on hover — hints "click to navigate" without taking space
           when idle. The opacity transition keeps the layout stable. */
        .oe-sidebar a .oe-hover-arrow {
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.18s ease, transform 0.18s ease;
        }
        .oe-sidebar a:hover .oe-hover-arrow,
        .oe-sidebar a:focus-visible .oe-hover-arrow {
          opacity: 0.55;
          transform: translateX(0);
        }
        /* Pin button on items — invisible until item is hovered, then
           fades in from the right. Click does not navigate (handled by
           preventDefault + stopPropagation in the handler). */
        .oe-sidebar a .oe-pin-btn {
          opacity: 0;
          transition: opacity 0.18s ease, color 0.18s ease;
        }
        .oe-sidebar a:hover .oe-pin-btn,
        .oe-sidebar a:focus-within .oe-pin-btn,
        .oe-sidebar a .oe-pin-btn[data-pinned="true"] {
          opacity: 1;
        }
      `}</style>

      {/* Logo + mobile close button. The desktop collapse/expand
          toggle lives as a floating pill on the right edge — see the
          <CollapseTab/> right below — not in the header. */}
      <div
        className={clsx(
          'relative flex h-header items-center px-5',
          iconified ? 'justify-center px-0' : 'justify-between',
        )}
      >
        {/* Brand block — white-labellable. When the user has set a
            custom logo or company name (via the pencil-on-hover edit
            affordance), this renders their brand large with a small
            "powered by OpenConstructionERP" attribution beneath. */}
        <CustomBranding iconified={iconified} />
        {!iconified && onClose && (
          <button
            onClick={onClose}
            className="lg:hidden flex h-7 w-7 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-content-tertiary hover:bg-surface-secondary hover:text-content-primary transition-colors"
            aria-label={t('common.close', { defaultValue: 'Close' })}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Floating collapse/expand tab — pill-shaped, half-protruding
          from the right edge of the sidebar at vertical centre.
          Desktop-only (mobile uses overlay drawer with its own X).
          Same button toggles both directions; the chevron flips to
          show which way the click will move the panel. */}
      <button
        onClick={toggleIconified}
        aria-label={
          iconified
            ? t('sidebar.expand', { defaultValue: 'Expand sidebar' })
            : t('sidebar.collapse', { defaultValue: 'Collapse sidebar' })
        }
        title={
          iconified
            ? t('sidebar.expand', { defaultValue: 'Expand sidebar' })
            : t('sidebar.collapse', { defaultValue: 'Collapse sidebar' })
        }
        className={clsx(
          // Position: vertical centre, sitting on the outer border with
          // half its width protruding into the main content area.
          // LTR → outer = right; RTL → outer = left.
          'hidden lg:flex absolute top-1/2 z-10',
          isRTL ? 'left-0' : 'right-0',
          // Size + shape: tall pill, narrow.
          'h-12 w-5 items-center justify-center rounded-full',
          // Surface: dark glass pill on navy; hover flips to teal accent.
          'border border-white/15 bg-white/[0.08] text-white/40',
          'hover:border-[#10CFC9] hover:bg-[#10CFC9] hover:text-[#0F1729] hover:shadow-md hover:shadow-[#10CFC9]/30',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10CFC9]/40',
          'transition-all duration-200 ease-oe',
        )}
        style={{
          // Manual translate: Tailwind has no logical translate-x, so
          // we compose Y-centre and X-protrude in one transform.
          // RTL flips the X sign so the pill still protrudes outward.
          transform: isRTL
            ? 'translateY(-50%) translateX(-50%)'
            : 'translateY(-50%) translateX(50%)',
        }}
      >
        <ChevronRight
          size={12}
          strokeWidth={2.5}
          className={clsx(
            'transition-transform duration-200 ease-oe',
            // The chevron always points in the direction the click will
            // move the panel. In RTL the outward direction flips, so
            // the rotation logic flips too.
            isRTL
              ? iconified
                ? 'rotate-180'
                : 'rotate-0'
              : iconified
                ? 'rotate-0'
                : 'rotate-180',
          )}
        />
      </button>

      {/* Main navigation — grouped with collapsible headers */}
      <nav
        className={clsx(
          'flex-1 overflow-y-auto pt-2 pb-3',
          iconified ? 'px-2' : 'px-3',
        )}
        data-engine="cwicr"
      >
        {/* Project focus is applied IN PLACE inside the original groups
            below — there is NO separate "project route" section and no
            reordering. Each row is only annotated: needed → sequence
            number; not needed → smaller + greyed; unconstrained → as
            default. Focus OFF / no profile → every row is default. */}
        {navGroups.map((group) => {
          // Hide entire group in simple mode if flagged
          if (group.hideInSimple && !isAdvanced) return null;
          // Hide groups toggled off by user in /modules Navigation tab
          if (isGroupHidden(group.id)) return null;

          // Merge static items + dynamic module items for this group
          const dynamicItems: NavItem[] = getModuleNavItems(group.id)
            .filter((mi) => {
              const moduleId = mi.labelKey.split('.')[1] ?? mi.to.slice(1);
              return isModuleEnabled(moduleId);
            })
            .map((mi) => ({
              labelKey: mi.labelKey,
              to: mi.to,
              icon: mi.icon,
              moduleKey: mi.to.slice(1), // e.g. '/sustainability' → 'sustainability'
              advancedOnly: mi.advancedOnly,
            }));

          // Filter by module-enabled + advanced mode ONLY. The menu
          // keeps its original shape and order; project focus never
          // removes or reorders rows — it only annotates them below.
          const allItems = [...group.items, ...dynamicItems];
          const visibleItems = allItems.filter(
            (item) =>
              (!item.moduleKey || isModuleEnabled(item.moduleKey)) &&
              (!item.advancedOnly || isAdvanced),
          );

          // Skip group if no visible items
          if (visibleItems.length === 0) return null;

          const isCollapsed = collapsed[group.id] ?? false;

          return (
            <NavGroupSection
              key={group.id}
              label={t(group.labelKey, { defaultValue: group.id })}
              isCollapsed={isCollapsed}
              onToggle={() => toggleGroup(group.id)}
              iconified={iconified}
            >
              <ul className="space-y-0.5">
                {visibleItems.map((item, i) => {
                  // In-place project-focus annotation (no reorder):
                  //   g === null      → route not profile-constrained →
                  //                      render exactly as the default.
                  //   g.enabled       → project needs it → sequence #.
                  //   g.enabled false → not needed → smaller + greyed.
                  const g =
                    gate.active && !iconified ? gate.byRoute(item.to) : null;
                  const notNeeded = g != null && !g.enabled;
                  return (
                    <li
                      key={item.to}
                      className={clsx('oe-stagger', notNeeded && 'opacity-45')}
                      style={{ animationDelay: `${i * 18}ms` }}
                    >
                      <SidebarItem
                        item={item}
                        label={t(item.labelKey)}
                        onClick={onClose}
                        badge={badgeMap[item.to]}
                        compact={notNeeded}
                        activeRoute={activeRoute}
                        iconified={iconified}
                      />
                    </li>
                  );
                })}
              </ul>
            </NavGroupSection>
          );
        })}
      </nav>

      <div className={clsx('relative py-1', iconified ? 'px-2' : 'px-3')}>
        {!iconified && <UpdateNotification />}
      </div>

      {/* User account panel pinned to sidebar bottom */}
      <div className={clsx('border-t border-white/10', iconified ? 'px-2 py-2' : 'px-3 py-2')}>
        <SidebarUserPanel iconified={iconified} onClose={onClose} />
      </div>
    </aside>
  );
}

function SidebarUserPanel({ iconified, onClose }: { iconified: boolean; onClose?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const userEmail = useAuthStore((s) => s.userEmail);
  const userRole = useAuthStore((s) => s.userRole);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';
  const displayName =
    userEmail?.split('@')[0]?.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ??
    'User';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-secondary transition-colors',
          iconified && 'justify-center',
        )}
        title={iconified ? (userEmail ?? undefined) : undefined}
      >
        <div className="relative h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-oe-blue to-[#38bdf8] flex items-center justify-center text-white text-xs font-semibold">
          {userInitial}
          <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#0F1729]" />
        </div>
        {!iconified && (
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-semibold text-content-primary truncate">{displayName}</div>
            <div className="text-xs text-content-tertiary capitalize truncate">{userRole ?? 'User'}</div>
          </div>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full mb-1 left-0 right-0 rounded-lg border border-white/10 bg-[#16213A] shadow-xl py-1 animate-scale-in"
        >
          {userEmail && (
            <div className="px-3 py-1.5 text-2xs text-content-tertiary truncate">{userEmail}</div>
          )}
          <div className="my-1 border-t border-white/10" />
          <button
            role="menuitem"
            onClick={() => { setOpen(false); onClose?.(); navigate('/settings'); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-content-primary hover:bg-surface-secondary transition-colors"
          >
            <Settings size={14} className="text-content-tertiary" />
            {t('nav.settings', 'Settings')}
          </button>
          <div className="my-1 border-t border-white/10" />
          <button
            role="menuitem"
            onClick={() => { logout(); navigate('/login'); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-semantic-error hover:bg-semantic-error-bg transition-colors"
          >
            <LogOut size={14} />
            {t('auth.logout', 'Sign out')}
          </button>
        </div>
      )}
    </div>
  );
}

function NavGroupSection({
  label,
  isCollapsed,
  onToggle,
  children,
  iconified,
}: {
  label: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  iconified?: boolean;
}) {
  const { t } = useTranslation();
  // In icon-only mode there is no room for the group header chevron;
  // we surface group boundaries as a thin centred hairline and keep
  // the items always-expanded (per-group collapse is irrelevant when
  // labels aren't visible).
  if (iconified) {
    return (
      <div className="mb-1">
        <div className="my-1.5 mx-auto h-px w-6 bg-border-light/60" aria-hidden />
        {children}
      </div>
    );
  }
  return (
    <div className="mb-0.5">
      <button
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? t('common.expand_section', { defaultValue: 'Expand {{label}}‌⁠‍', label }) : t('common.collapse_section', { defaultValue: 'Collapse {{label}}‌⁠‍', label })}
        className="mt-3 mb-0.5 flex w-full items-center justify-between px-2.5 group cursor-pointer"
      >
        <span className="text-2xs font-medium uppercase tracking-wider text-content-tertiary group-hover:text-content-secondary transition-colors">
          {label}
        </span>
        <ChevronDown
          size={12}
          strokeWidth={2}
          className={clsx(
            'text-content-quaternary group-hover:text-content-secondary',
            'transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
            isCollapsed && '-rotate-90',
          )}
        />
      </button>
      {!isCollapsed && children}
    </div>
  );
}

function SidebarItem({
  item,
  label,
  onClick,
  badge: numericBadge,
  activeRoute,
  iconified,
  compact,
}: {
  item: NavItem;
  label: string;
  onClick?: () => void;
  badge?: number;
  activeRoute?: string | null;
  iconified?: boolean;
  compact?: boolean;
}) {
  const Icon = item.icon;

  // Single source of truth for active state — Sidebar picks one winning
  // route across all visible items, so only the most-specific match
  // lights up (no more "/bim" + "/bim/rules" both glowing blue).
  const isActive = activeRoute === item.to;
  const hasQuery = item.to.includes('?');

  // Icon-only branch — short-circuits the full row layout. Native
  // `title` surfaces the label on hover; the active-state dot replaces
  // the 2px accent bar (which would clip the centred icon at 48px wide).
  if (iconified) {
    const hasBadge =
      (numericBadge != null && numericBadge > 0) || Boolean(item.badge);
    return (
      <NavLink
        to={item.to}
        end={item.to === '/' || hasQuery}
        onClick={onClick}
        title={label}
        aria-label={label}
        {...(item.tourId ? { 'data-tour': item.tourId } : {})}
        className={() =>
          clsx(
            'relative mx-auto flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-fast ease-oe',
            isActive
              ? 'bg-surface-secondary text-content-primary'
              : 'text-content-secondary hover:bg-surface-secondary hover:text-content-primary',
          )
        }
      >
        <Icon size={16} strokeWidth={isActive ? 2 : 1.75} />
        {hasBadge && (
          <span
            className={clsx(
              'absolute top-1 right-1 h-1.5 w-1.5 rounded-full',
              isActive ? 'bg-oe-blue' : 'bg-semantic-error/80',
            )}
            aria-hidden
          />
        )}
      </NavLink>
    );
  }

  return (
      <NavLink
        to={item.to}
        end={item.to === '/' || hasQuery}
        onClick={onClick}
        title={label}
        {...(item.tourId ? { 'data-tour': item.tourId } : {})}
        className={() => {
          const active = isActive;
          return clsx(
            // 2px transparent left border on every item — when active
            // it flips to oe-blue. No layout shift between states. The
            // accent bar is the entire visual change for "active",
            // alongside the subtle background tint and bolded label.
            // This is the Linear/Vercel pattern — solid, calm, fast.
            'relative flex items-center rounded-md border-l-2 border-transparent',
            'transition-colors duration-fast ease-oe',
            compact
              ? 'gap-1.5 pl-2 pr-1.5 py-[3px] text-[12px]'
              : 'gap-2 pl-[10px] pr-2.5 py-1 text-[13px]',
            item.highlight && !active
              ? 'font-medium bg-gradient-to-r from-[#7c3aed]/10 to-[#0ea5e9]/10 text-[#6d28d9] hover:from-[#7c3aed]/15 hover:to-[#0ea5e9]/15'
              : active
                ? 'font-semibold border-oe-blue bg-surface-secondary text-content-primary'
                : 'font-medium text-content-secondary hover:bg-surface-secondary hover:text-content-primary',
          );
        }}
      >
        <Icon size={compact ? 14 : 16} strokeWidth={isActive ? 2 : 1.75} className={clsx('shrink-0', isActive && 'text-oe-blue')} />
        {/* Hover-tooltip via title falls back to the full label even when
            CSS truncates with an ellipsis. The visible width is now
            264px (was 232) so most labels render in full at default
            zoom; this is the safety net for narrow sidebars / dense
            translations / large-text accessibility settings. */}
        <span className="truncate" title={label}>
          {label}
        </span>
        {/* Right-edge cluster — kbd hint first, badges last, so the
            BETA / NEW chips always sit at the absolute right margin
            (flush against the row edge) instead of being pushed inward
            by the fixed-width keyboard hint column. Reserve the 26px
            kbd column ONLY when this row actually has a shortcut —
            empty rows previously paid the same 26px tax for nothing,
            squeezing the label width and triggering avoidable
            ellipsis truncation. */}
        {numericBadge != null && numericBadge > 0 && (
          <span
            className={clsx(
              'ms-auto flex h-4 min-w-[1.25rem] items-center justify-center rounded-full text-2xs font-bold px-1 transition-colors',
              isActive
                ? 'bg-oe-blue text-white'
                : 'bg-surface-tertiary text-content-secondary',
            )}
          >
            {numericBadge > 99 ? '99+' : numericBadge}
          </span>
        )}
      </NavLink>
  );
}

const RECENT_TYPE_ICONS: Record<string, LucideIcon> = {
  project: FolderOpen,
  boq: Table2,
  schedule: CalendarDays,
  task: ClipboardList,
  rfi: HelpCircle,
  contact: Users,
};

/** Floating Recent button — rendered by AppLayout in the bottom-right corner. */
export function FloatingRecentButton() {
  const { t } = useTranslation();
  const recentItems = useRecentStore((s) => s.items);
  const [open, setOpen] = useState(false);

  if (recentItems.length === 0) return null;
  const displayed = recentItems.slice(0, 5);

  return (
    // Smaller, slightly higher than the Chat FAB so they stack visually
    <div className="fixed bottom-24 end-4 z-40">
      {/* Popover */}
      {open && (
        <div className="absolute bottom-12 end-0 w-72 rounded-xl border border-border-light bg-surface-primary shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-light">
            <span className="text-xs font-semibold text-content-primary">{t('nav.recent', { defaultValue: 'Recent‌⁠‍' })}</span>
            <button onClick={() => setOpen(false)} className="p-0.5 rounded text-content-tertiary hover:text-content-primary">
              <X size={14} />
            </button>
          </div>
          <ul className="py-1.5 max-h-60 overflow-y-auto">
            {displayed.map((item) => {
              const Icon = RECENT_TYPE_ICONS[item.type] || FolderOpen;
              return (
                <li key={item.id}>
                  <NavLink
                    to={item.url}
                    onClick={() => setOpen(false)}
                    title={item.title}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-content-secondary hover:bg-surface-secondary hover:text-content-primary transition-all"
                  >
                    <Icon size={14} strokeWidth={1.75} className="shrink-0 text-content-tertiary" />
                    <span className="truncate flex-1">{item.title}</span>
                    <span className="text-[10px] text-content-quaternary shrink-0 tabular-nums">
                      {new Date(item.visitedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className={clsx(
          'w-10 h-10 rounded-full flex items-center justify-center shadow-lg border transition-all duration-200 hover:scale-105 active:scale-95',
          open
            ? 'bg-oe-blue text-white border-oe-blue shadow-oe-blue/20'
            : 'bg-surface-primary text-content-secondary border-border-light hover:border-oe-blue/30 hover:text-oe-blue',
        )}
        title={t('nav.recent', { defaultValue: 'Recent' })}
      >
        <History size={18} strokeWidth={2} />
      </button>
    </div>
  );
}

/** Floating AI Chat button — large pill-shaped FAB in bottom-right that
 *  navigates to /chat. Hidden when already on the chat page. */
export function FloatingChatButton() {
  const { t } = useTranslation();
  const location = useLocation();

  // Hide when already on the chat page so it doesn't overlap the chat itself
  if (location.pathname.startsWith('/chat')) return null;

  return (
    <NavLink
      to="/chat"
      className="fixed bottom-6 end-6 z-40 group flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-oe-blue to-blue-600 text-white shadow-xl shadow-oe-blue/30 hover:shadow-2xl hover:shadow-oe-blue/40 hover:scale-105 active:scale-95 transition-all duration-200 border border-oe-blue/50"
      title={t('nav.erp_chat', { defaultValue: 'AI Chat' })}
    >
      <MessageSquare size={20} strokeWidth={2.25} className="shrink-0" />
      <span className="text-sm font-semibold whitespace-nowrap">
        {t('nav.erp_chat', { defaultValue: 'AI Chat' })}
      </span>
      {/* Subtle pulse indicator */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>
    </NavLink>
  );
}
