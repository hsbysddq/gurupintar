'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { bacaSesiMentah, berlanggananSesi, uraiSesi, type SesiAktif } from '@/lib/sesi-lokal';

/**
 * Sesi kuis aktif yang tersimpan di perangkat.
 * `undefined` = belum terbaca (render server/hidrasi), `null` = belum ada sesi.
 */
export function useSesiAktif(): SesiAktif | null | undefined {
  const mentah = useSyncExternalStore<string | null | undefined>(
    berlanggananSesi,
    bacaSesiMentah,
    () => undefined,
  );
  return useMemo(() => (mentah === undefined ? undefined : uraiSesi(mentah)), [mentah]);
}
