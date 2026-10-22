import { skemaBodyGabungKelas } from '@/lib/skema-api';
import { PESAN_NAMA_DIPAKAI, tambahAnggotaKelas } from '@/lib/server/anggota';
import { kolomArsipBelumAda, wajibPeranApi } from '@/lib/server/auth';
import { ambilSupabase } from '@/lib/server/supabase';
import {
  bacaBodyJson,
  petakanErrorDb,
  PESAN_INPUT_TIDAK_VALID,
  responsError,
  responsOk,
} from '@/lib/server/respons';
import type { KelasSiswa } from '@/lib/tipe';

const PESAN_KODE_TIDAK_DITEMUKAN = 'Kode kelas tidak ditemukan. Periksa lagi kode dari gurumu.';

type BarisSesiAktif = { kelas_id: string; kode_kelas: string };

// GET /api/siswa/kelas: daftar kelas yang diikuti siswa + kuis aktifnya.
export async function GET() {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  try {
    const db = ambilSupabase();
    const anggota = await db
      .from('keanggotaan_kelas')
      .select('kelas_id')
      .eq('siswa_id', auth.profil.id);
    if (anggota.error) return petakanErrorDb(anggota.error);

    const ids = [...new Set(anggota.data.map((a) => a.kelas_id as string))];
    if (ids.length === 0) return responsOk<KelasSiswa[]>([]);

    const dasarKelas = () =>
      db.from('kelas').select('id, nama, mapel, kode_undangan, guru_id').in('id', ids);
    let kelas = await dasarKelas().is('diarsipkan_pada', null);
    if (kelas.error && kolomArsipBelumAda(kelas.error)) kelas = await dasarKelas();
    if (kelas.error) return petakanErrorDb(kelas.error);
    if (kelas.data.length === 0) return responsOk<KelasSiswa[]>([]);

    const idKelas = kelas.data.map((k) => k.id as string);
    const idGuru = [...new Set(kelas.data.map((k) => k.guru_id as string))];

    const [guru, sesi] = await Promise.all([
      db.from('pengguna').select('id, nama').in('id', idGuru),
      db.from('sesi_kuis').select('kelas_id, kode_kelas').in('kelas_id', idKelas).eq('status', 'aktif'),
    ]);
    if (guru.error) return petakanErrorDb(guru.error);
    if (sesi.error) return petakanErrorDb(sesi.error);

    const petaGuru = new Map(guru.data.map((g) => [g.id as string, g.nama as string]));
    const petaSesi = new Map((sesi.data as BarisSesiAktif[]).map((s) => [s.kelas_id, s.kode_kelas]));

    const respons: KelasSiswa[] = kelas.data
      .map((k) => ({
        id: k.id as string,
        nama: k.nama as string,
        mapel: k.mapel as string,
        namaGuru: petaGuru.get(k.guru_id as string) ?? '',
        kodeUndangan: k.kode_undangan as string,
        kuisAktif: petaSesi.has(k.id as string) ? { kodeKelas: petaSesi.get(k.id as string)! } : null,
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));

    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

// POST /api/siswa/kelas: bergabung ke kelas lewat kode undangan, tanpa perlu kuis aktif.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('siswa');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyGabungKelas.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    const dasarKelas = () =>
      db.from('kelas').select('id, nama, mapel').eq('kode_undangan', input.data.kode);
    let kelas = await dasarKelas().is('diarsipkan_pada', null).maybeSingle();
    if (kelas.error && kolomArsipBelumAda(kelas.error)) kelas = await dasarKelas().maybeSingle();
    if (kelas.error) return petakanErrorDb(kelas.error);
    if (!kelas.data) return responsError(PESAN_KODE_TIDAK_DITEMUKAN, 404);

    const anggota = await db
      .from('keanggotaan_kelas')
      .select('siswa_id')
      .eq('kelas_id', kelas.data.id)
      .eq('siswa_id', auth.profil.id)
      .maybeSingle();
    if (anggota.error) return petakanErrorDb(anggota.error);

    if (!anggota.data) {
      const tambah = await tambahAnggotaKelas(db, kelas.data.id, auth.profil.id, auth.profil.nama);
      if (!tambah.ok) {
        if (tambah.konflikNama) return responsError(PESAN_NAMA_DIPAKAI, 409);
        return petakanErrorDb(tambah.error);
      }
    }

    return responsOk({ ok: true, kelas: { id: kelas.data.id, nama: kelas.data.nama, mapel: kelas.data.mapel } });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
