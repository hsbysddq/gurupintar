import type { NextRequest } from 'next/server';
import { validasiJadwalIso, statusSesiEfektif } from '@/lib/jadwal-kuis';
import { adalahBentrokKode, cobaDenganKodeBaru, type HasilPercobaan } from '@/lib/kode-kelas';
import { SOAL_MINIMAL_TOPIK, TOPIK_DEMO_ID } from '@/lib/konstanta';
import { skemaBodyBukaSesi, skemaBodyJadwalSesi, skemaQueryKelasOpsional } from '@/lib/skema-api';
import { bolehPakaiTopik } from '@/lib/topik';
import { idKelasMilikGuru, kelasMilikGuru, sesiMilikGuru, wajibPeranApi } from '@/lib/server/auth';
import {
  bacaJadwalBanyak,
  simpanJadwalSesi,
  tabelJadwalBelumAda,
  tutupSesiKedaluwarsa,
} from '@/lib/server/jadwal-kuis';
import { ambilSupabase } from '@/lib/server/supabase';
import { bacaBodyJson, petakanErrorDb, PESAN_INPUT_TIDAK_VALID, responsError, responsOk } from '@/lib/server/respons';
import type { SesiBaru, SesiGuru } from '@/lib/tipe';

const PESAN_KODE_GAGAL = 'Kode kelas belum berhasil dibuat. Coba buka kuis lagi.';
const PESAN_TOPIK_TIDAK_ADA = 'Topik tidak ditemukan.';
const PESAN_JUMLAH_SOAL = `Topik harus punya minimal ${SOAL_MINIMAL_TOPIK} soal.`;
const PESAN_BELUM_PUNYA_KELAS = 'Buat kelas dulu sebelum membuka kuis.';
const PESAN_MIGRASI_JADWAL = 'Layanan jadwal kuis belum siap. Coba lagi beberapa saat.';
const PESAN_SESI_SELESAI = 'Kuis ini sudah ditutup, jadwalnya tidak bisa diubah lagi.';
const PESAN_SUDAH_DIKERJAKAN =
  'Kuis ini sudah mulai dikerjakan. Waktu buka tidak bisa dipindah ke masa depan.';

// GET /api/guru/sesi?kelas=: sesi milik guru, terbaru di atas, beserta jumlah siswa yang menjawab.
export async function GET(request: NextRequest) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaQueryKelasOpsional.safeParse({
    kelas: request.nextUrl.searchParams.get('kelas') ?? undefined,
  });
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  try {
    const db = ambilSupabase();
    let ids: string[];
    if (input.data.kelas) {
      if (!(await kelasMilikGuru(db, auth.profil.id, input.data.kelas))) {
        return responsError('Kelas tidak ditemukan.', 404);
      }
      ids = [input.data.kelas];
    } else {
      ids = await idKelasMilikGuru(db, auth.profil.id);
    }
    if (ids.length === 0) return responsOk<SesiGuru[]>([]);

    await tutupSesiKedaluwarsa(db);

    const { data, error } = await db
      .from('sesi_kuis')
      .select('id, kelas_id, kode_kelas, status, dibuat_pada, kelas(nama), hasil_siswa(count)')
      .in('kelas_id', ids)
      .order('dibuat_pada', { ascending: false });
    if (error) return petakanErrorDb(error);

    const jadwal = await bacaJadwalBanyak(db, data.map((s) => s.id as string));
    const sekarang = new Date();
    const respons: SesiGuru[] = data.map((s) => {
      const jadwalSesi = jadwal.get(s.id as string);
      return {
        id: s.id,
        kelasId: s.kelas_id,
        namaKelas: (s.kelas as unknown as { nama: string }).nama,
        kodeKelas: s.kode_kelas,
        status: statusSesiEfektif(s.status === 'aktif' ? 'aktif' : 'selesai', jadwalSesi, sekarang),
        dibuatPada: s.dibuat_pada,
        jumlahMenjawab: (s.hasil_siswa as { count: number }[])[0]?.count ?? 0,
        bukaPada: jadwalSesi?.bukaPada ?? s.dibuat_pada,
        tutupPada: jadwalSesi?.tutupPada ?? null,
      };
    });
    return responsOk(respons);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

// POST /api/guru/sesi: buka_sesi menutup kuis aktif lain di kelas yang sama dan membuat yang baru
// dalam satu transaksi. Kode bentrok dicoba ulang dengan kode baru, maksimal 5 kali.
export async function POST(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyBukaSesi.safeParse((await bacaBodyJson(request)) ?? {});
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);
  const topikId = input.data.topikId ?? TOPIK_DEMO_ID;

  const validasiJadwal = validasiJadwalIso(input.data.bukaPada ?? null, input.data.tutupPada ?? null);
  if (!validasiJadwal.ok) return responsError(validasiJadwal.pesan, 400);
  const mintaJadwal = Boolean(input.data.bukaPada || input.data.tutupPada);

  try {
    const db = ambilSupabase();

    // Jangan membuat sesi dengan jadwal yang tidak bisa disimpan saat migrasi belum dijalankan.
    if (mintaJadwal) {
      const cek = await db.from('jadwal_kuis').select('sesi_id').limit(1);
      if (cek.error) {
        if (tabelJadwalBelumAda(cek.error)) return responsError(PESAN_MIGRASI_JADWAL, 503);
        return petakanErrorDb(cek.error);
      }
    }

    let kelasId = input.data.kelasId;
    if (kelasId) {
      if (!(await kelasMilikGuru(db, auth.profil.id, kelasId))) {
        return responsError('Kelas tidak ditemukan.', 404);
      }
    } else {
      const ids = await idKelasMilikGuru(db, auth.profil.id);
      if (ids.length === 0) return responsError(PESAN_BELUM_PUNYA_KELAS, 400);
      kelasId = ids[0];
    }

    const topik = await db
      .from('topik')
      .select('id, dibuat_oleh, soal(count)')
      .eq('id', topikId)
      .maybeSingle();
    if (topik.error) return petakanErrorDb(topik.error);
    if (!topik.data) return responsError(PESAN_TOPIK_TIDAK_ADA, 404);
    if (!bolehPakaiTopik({ id: topik.data.id, dibuatOleh: topik.data.dibuat_oleh }, auth.profil.id)) {
      return responsError(PESAN_TOPIK_TIDAK_ADA, 404);
    }
    const jumlahSoal = (topik.data.soal as { count: number }[])[0]?.count ?? 0;
    if (jumlahSoal < SOAL_MINIMAL_TOPIK) return responsError(PESAN_JUMLAH_SOAL, 400);

    const hasil = await cobaDenganKodeBaru(async (kode): Promise<HasilPercobaan<string>> => {
      const { data, error } = await db.rpc('buka_sesi', {
        p_kelas: kelasId,
        p_topik: topikId,
        p_kode: kode,
      });
      if (!error) return { status: 'berhasil', nilai: data as string };
      return adalahBentrokKode(error) ? { status: 'bentrok' } : { status: 'gagal', error };
    });

    if (hasil.status === 'habis') return responsError(PESAN_KODE_GAGAL, 500);
    if (hasil.status === 'gagal') return petakanErrorDb(hasil.error);

    const simpan = await simpanJadwalSesi(db, hasil.nilai, validasiJadwal.jadwal);
    if (!simpan.ok && (!simpan.tabelBelumAda || mintaJadwal)) {
      if (simpan.tabelBelumAda) return responsError(PESAN_MIGRASI_JADWAL, 503);
      return petakanErrorDb(simpan.error);
    }

    const respons: SesiBaru = {
      id: hasil.nilai,
      kodeKelas: hasil.kode,
      bukaPada: validasiJadwal.jadwal.bukaPada ?? new Date().toISOString(),
      tutupPada: validasiJadwal.jadwal.tutupPada,
    };
    return responsOk(respons, 201);
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}

// PATCH /api/guru/sesi: atur kapan kuis dibuka dan ditutup otomatis.
export async function PATCH(request: Request) {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  const input = skemaBodyJadwalSesi.safeParse(await bacaBodyJson(request));
  if (!input.success) return responsError(PESAN_INPUT_TIDAK_VALID, 400);

  const validasiJadwal = validasiJadwalIso(input.data.bukaPada ?? null, input.data.tutupPada ?? null);
  if (!validasiJadwal.ok) return responsError(validasiJadwal.pesan, 400);

  try {
    const db = ambilSupabase();
    const sesi = await sesiMilikGuru(db, auth.profil.id, input.data.sesiId);
    if (!sesi) return responsError('Sesi kuis tidak ditemukan.', 404);

    const { data: statusSesi, error } = await db
      .from('sesi_kuis')
      .select('status')
      .eq('id', sesi.id)
      .maybeSingle();
    if (error) return petakanErrorDb(error);
    if (!statusSesi) return responsError('Sesi kuis tidak ditemukan.', 404);
    if (statusSesi.status !== 'aktif') return responsError(PESAN_SESI_SELESAI, 409);

    const bukaBaru = validasiJadwal.jadwal.bukaPada;
    if (bukaBaru && Date.parse(bukaBaru) > Date.now()) {
      const hasil = await db
        .from('hasil_siswa')
        .select('siswa_id')
        .eq('sesi_id', sesi.id)
        .limit(1);
      if (hasil.error) return petakanErrorDb(hasil.error);
      if (hasil.data.length > 0) return responsError(PESAN_SUDAH_DIKERJAKAN, 409);
    }

    const simpan = await simpanJadwalSesi(db, sesi.id, validasiJadwal.jadwal);
    if (!simpan.ok) {
      if (simpan.tabelBelumAda) return responsError(PESAN_MIGRASI_JADWAL, 503);
      return petakanErrorDb(simpan.error);
    }

    return responsOk({ ok: true });
  } catch (err) {
    console.error(err);
    return petakanErrorDb(err);
  }
}
