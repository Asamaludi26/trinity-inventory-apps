import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { NAV_ITEMS, type NavGroup, type NavItem } from '@/config/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const ROLE_GRADIENTS: Record<string, string> = {
  SUPERADMIN: 'from-violet-500 to-purple-600',
  ADMIN_LOGISTIK: 'from-sky-400 to-blue-500',
  ADMIN_PURCHASE: 'from-emerald-400 to-teal-500',
  LEADER: 'from-indigo-400 to-blue-500',
  STAFF: 'from-slate-400 to-gray-500',
};

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN_LOGISTIK: 'Admin Logistik',
  ADMIN_PURCHASE: 'Admin Purchase',
  LEADER: 'Leader',
  STAFF: 'Staff',
};

function hasAccess(item: NavItem, userRole: string | undefined): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  if (!userRole) return false;
  return item.roles.includes(userRole);
}

function filterNavItems(items: NavItem[], userRole: string | undefined): NavItem[] {
  return items
    .filter((item) => hasAccess(item, userRole))
    .map((item) => ({
      ...item,
      children: item.children ? filterNavItems(item.children, userRole) : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0);
}

function NavItemMenu({ item }: { item: NavItem }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');

  if (!item.children || item.children.length === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.title}
          isActive={isActive}
          onClick={() => navigate(item.href)}
        >
          <item.icon className="size-4" />
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  const hasActiveChild = item.children.some(
    (child) =>
      location.pathname === child.href ||
      location.pathname.startsWith(child.href + '/') ||
      child.children?.some(
        (sub) => location.pathname === sub.href || location.pathname.startsWith(sub.href + '/'),
      ),
  );

  return (
    <Collapsible asChild defaultOpen={hasActiveChild} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive && !hasActiveChild}>
            <item.icon className="size-4" />
            <span>{item.title}</span>
            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => (
              <NavSubItem key={child.href} item={child} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavSubItem({ item }: { item: NavItem }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === item.href;

  if (item.children && item.children.length > 0) {
    const hasActiveChild = item.children.some(
      (child) => location.pathname === child.href || location.pathname.startsWith(child.href + '/'),
    );

    return (
      <Collapsible asChild defaultOpen={hasActiveChild} className="group/sub-collapsible">
        <SidebarMenuSubItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton>
              <item.icon className="size-3.5" />
              <span>{item.title}</span>
              <ChevronRight className="ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/sub-collapsible:rotate-90" />
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton
                    isActive={location.pathname === child.href}
                    onClick={() => navigate(child.href)}
                  >
                    <child.icon className="size-3.5" />
                    <span>{child.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuSubItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton isActive={isActive} onClick={() => navigate(item.href)}>
        <item.icon className="size-3.5" />
        <span>{item.title}</span>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

export function AppSidebar() {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;
  const filteredItems = filterNavItems(NAV_ITEMS, userRole);

  const gradient = ROLE_GRADIENTS[userRole ?? ''] ?? ROLE_GRADIENTS.STAFF;
  const roleLabel = ROLE_LABELS[userRole ?? ''] ?? userRole ?? 'User';

  // Group items
  const dashboardItems = filteredItems.filter((item) => !('group' in item) || !item.group);
  const grouped = new Map<NavGroup, NavItem[]>();
  for (const item of filteredItems) {
    if (item.group) {
      const existing = grouped.get(item.group) ?? [];
      existing.push(item);
      grouped.set(item.group, existing);
    }
  }

  const GROUP_LABELS: Record<NavGroup, string> = {
    MANAJEMEN: 'Manajemen',
    PROYEK: 'Proyek',
    SISTEM: 'Sistem',
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg bg-gradient-to-r p-3 text-white',
            gradient,
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/20 font-bold text-sm">
            T
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">TrinityApps</span>
            <span className="truncate text-xs opacity-80">{user?.fullName ?? 'User'}</span>
            <span className="mt-0.5 inline-flex w-fit rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">
              {roleLabel}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard (ungrouped) */}
        <SidebarGroup>
          <SidebarMenu>
            {dashboardItems.map((item) => (
              <NavItemMenu key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Grouped sections */}
        {(['MANAJEMEN', 'PROYEK', 'SISTEM'] as NavGroup[]).map((groupKey) => {
          const items = grouped.get(groupKey);
          if (!items || items.length === 0) return null;
          return (
            <SidebarGroup key={groupKey}>
              <SidebarGroupLabel>{GROUP_LABELS[groupKey]}</SidebarGroupLabel>
              <SidebarMenu>
                {items.map((item) => (
                  <NavItemMenu key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-center p-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <span>v1.0 &middot; &copy; TrinityApps 2026</span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
