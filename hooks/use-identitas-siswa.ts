'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { bacaIdentitasMentah, berlanggananIdentitas, uraiIdentitas, type IdentitasSiswa } from '@/lib/sesi-lokal';

/**
 * Identitas siswa yang tersimpan di perangkat.
 * `undefined` = belum terbaca (render server/hidrasi), `null` = belum ada identitas.
 */
export function useIdentitasSiswa(): IdentitasSiswa | null | undefined {
  const mentah = useSyncExternalStore<string | null | undefined>(
    berlanggananIdentitas,
    bacaIdentitasMentah,
    () => undefined,
  );
  return useMemo(() => (mentah === undefined ? undefined : uraiIdentitas(mentah)), [mentah]);
}
