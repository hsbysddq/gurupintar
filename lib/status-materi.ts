import type { StatusMateri, StatusMateriSesi } from './tipe';

/** Ringkasan status materi dari daftar materi satu sesi. */
export function ringkasStatusMateri(materi: { status: StatusMateri }[]): StatusMateriSesi {
  if (materi.length === 0) return 'belum-ada';

  const adaDraf = materi.some((m) => m.status === 'draf');
  const adaDibagikan = materi.some((m) => m.status === 'dibagikan');

  if (adaDraf && adaDibagikan) return 'campuran';
  return adaDibagikan ? 'dibagikan' : 'draf';
}
