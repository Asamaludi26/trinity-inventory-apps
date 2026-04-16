import { describe, it, expect } from 'vitest';
import { NAV_ITEMS } from './navigation';

describe('Navigation config', () => {
  it('has Dashboard as first item', () => {
    expect(NAV_ITEMS[0].title).toBe('Dashboard');
    expect(NAV_ITEMS[0].href).toBe('/dashboard');
  });

  it('all items have required fields', () => {
    const checkItem = (item: (typeof NAV_ITEMS)[number]) => {
      expect(item.title).toBeTruthy();
      expect(item.href).toBeTruthy();
      expect(item.icon).toBeDefined();
      item.children?.forEach(checkItem);
    };
    NAV_ITEMS.forEach(checkItem);
  });

  it('contains management section items', () => {
    const managementItems = NAV_ITEMS.filter((i) => i.group === 'MANAJEMEN');
    expect(managementItems.length).toBeGreaterThanOrEqual(2);
  });

  it('contains system settings with role restrictions', () => {
    const settings = NAV_ITEMS.find((i) => i.title === 'Pengaturan');
    expect(settings).toBeDefined();
    const auditTrail = settings?.children?.find((c) => c.title === 'Audit Trail');
    expect(auditTrail?.roles).toContain('SUPERADMIN');
  });

  it('projects section exists', () => {
    const projects = NAV_ITEMS.find((i) => i.group === 'PROYEK');
    expect(projects).toBeDefined();
    expect(projects?.href).toBe('/projects');
  });
});
