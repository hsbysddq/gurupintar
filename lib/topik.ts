import { TOPIK_DEMO_ID } from './konstanta';

export interface TopikKepemilikan {
  id: string;
  dibuatOleh: string | null;
}

/** Guru hanya boleh memakai topik miliknya sendiri atau topik demo bersama. */
export function bolehPakaiTopik(topik: TopikKepemilikan, guruId: string): boolean {
  return topik.id === TOPIK_DEMO_ID || topik.dibuatOleh === guruId;
}
