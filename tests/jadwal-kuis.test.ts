import { describe, expect, it } from 'vitest';
import {
  formatJadwal,
  isoKeNilaiLokal,
  ringkasJadwal,
  statusSesiEfektif,
  validasiJadwalIso,
  waktuLokalKeIso,
} from '@/lib/jadwal-kuis';

const BUKA = '2026-11-03T01:00:00.000Z';
const TUTUP = '2026-11-03T02:00:00.000Z';

describe('statusSesiEfektif', () => {
  it('menjadi terjadwal sebelum waktu buka', () => {
    expect(statusSesiEfektif('aktif', { bukaPada: BUKA, tutupPada: TUTUP }, new Date('2026-11-03T00:59:59Z'))).toBe(
      'terjadwal',
    );
  });

  it('aktif tepat pada waktu buka dan selama rentang jadwal', () => {
    expect(statusSesiEfektif('aktif', { bukaPada: BUKA, tutupPada: TUTUP }, new Date(BUKA))).toBe('aktif');
    expect(statusSesiEfektif('aktif', { bukaPada: BUKA, tutupPada: TUTUP }, new Date('2026-11-03T01:30:00Z'))).toBe(
      'aktif',
    );
  });

  it('selesai tepat saat waktu tutup lewat', () => {
    expect(statusSesiEfektif('aktif', { bukaPada: BUKA, tutupPada: TUTUP }, new Date(TUTUP))).toBe('selesai');
  });

  it('sesi yang sudah ditutup manual tetap selesai', () => {
    expect(statusSesiEfektif('selesai', { bukaPada: BUKA, tutupPada: TUTUP }, new Date('2026-11-03T00:30:00Z'))).toBe(
      'selesai',
    );
  });

  it('tanpa jadwal dianggap aktif', () => {
    expect(statusSesiEfektif('aktif', undefined, new Date('2026-11-03T00:30:00Z'))).toBe('aktif');
    expect(statusSesiEfektif('aktif', { bukaPada: null, tutupPada: null })).toBe('aktif');
  });
});

describe('validasiJadwalIso', () => {
  it('menerima tutup setelah buka dan menormalkan ke ISO', () => {
    const hasil = validasiJadwalIso('2026-11-03T08:00:00+07:00', '2026-11-03T09:00:00+07:00', new Date('2026-11-03T00:00:00Z'));
    expect(hasil.ok).toBe(true);
    if (hasil.ok) {
      expect(hasil.jadwal.bukaPada).toBe('2026-11-03T01:00:00.000Z');
      expect(hasil.jadwal.tutupPada).toBe('2026-11-03T02:00:00.000Z');
    }
  });

  it('menolak tutup sebelum atau sama dengan buka', () => {
    const sebelum = validasiJadwalIso(BUKA, '2026-11-03T00:30:00Z', new Date('2026-11-03T00:00:00Z'));
    expect(sebelum).toMatchObject({ ok: false, kolom: 'tutupPada' });
    const sama = validasiJadwalIso(BUKA, BUKA, new Date('2026-11-03T00:00:00Z'));
    expect(sama.ok).toBe(false);
  });

  it('menolak waktu tutup yang sudah lewat', () => {
    const hasil = validasiJadwalIso(null, TUTUP, new Date('2026-11-03T03:00:00Z'));
    expect(hasil).toMatchObject({ ok: false, kolom: 'tutupPada' });
  });

  it('menolak format waktu yang tidak valid', () => {
    expect(validasiJadwalIso('besok pagi', null).ok).toBe(false);
    expect(validasiJadwalIso(null, 'nanti').ok).toBe(false);
  });

  it('boleh tanpa jadwal (buka sekarang, tutup manual)', () => {
    const hasil = validasiJadwalIso(null, null);
    expect(hasil).toEqual({ ok: true, jadwal: { bukaPada: null, tutupPada: null } });
  });
});

describe('konversi waktu lokal', () => {
  it('mengubah datetime-local ke ISO dan kembali ke nilai input', () => {
    const iso = waktuLokalKeIso('2026-11-03T08:30');
    expect(iso).toBeTruthy();
    expect(isoKeNilaiLokal(iso)).toBe('2026-11-03T08:30');
  });

  it('mengosongkan nilai kosong atau tidak valid', () => {
    expect(waktuLokalKeIso('')).toBeNull();
    expect(waktuLokalKeIso('bukan waktu')).toBeNull();
    expect(isoKeNilaiLokal(null)).toBe('');
  });
});

describe('ringkasJadwal', () => {
  it('menampilkan status yang sesuai untuk guru', () => {
    expect(ringkasJadwal({ bukaPada: BUKA, tutupPada: TUTUP }, new Date('2026-11-03T00:30:00Z'))).toContain(
      'Terbuka otomatis',
    );
    expect(ringkasJadwal({ bukaPada: BUKA, tutupPada: TUTUP }, new Date('2026-11-03T01:30:00Z'))).toContain(
      'Ditutup otomatis',
    );
    expect(ringkasJadwal({ bukaPada: null, tutupPada: null })).toBe('Dibuka sekarang · ditutup manual');
  });

  it('formatJadwal mengembalikan tanda pisah untuk nilai kosong', () => {
    expect(formatJadwal(null)).toBe('—');
  });
});
