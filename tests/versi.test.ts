import { afterEach, describe, expect, it, vi } from 'vitest';
import { maintenanceAktif, versiBuild } from '@/lib/server/versi';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('maintenanceAktif', () => {
  it.each(['1', 'true', 'TRUE', ' ya ', 'Ya'])('aktif untuk nilai %j', (nilai) => {
    vi.stubEnv('MAINTENANCE_MODE', nilai);
    expect(maintenanceAktif()).toBe(true);
  });

  it.each(['', '0', 'false', 'tidak', 'maintenance'])('tidak aktif untuk nilai %j', (nilai) => {
    vi.stubEnv('MAINTENANCE_MODE', nilai);
    expect(maintenanceAktif()).toBe(false);
  });

  it('tidak aktif saat variabel tidak diisi', () => {
    vi.stubEnv('MAINTENANCE_MODE', undefined);
    expect(maintenanceAktif()).toBe(false);
  });
});

describe('versiBuild', () => {
  it('memakai "dev" di luar produksi', () => {
    vi.stubEnv('NODE_ENV', 'test');
    expect(versiBuild()).toBe('dev');
  });
});
