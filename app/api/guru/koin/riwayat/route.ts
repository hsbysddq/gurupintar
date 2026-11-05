import { wajibPeranApi } from '@/lib/server/auth';
import { perluMigrasiKoin, PESAN_MIGRASI_KOIN } from '@/lib/server/koin';
import { ambilSupabase } from '@/lib/server/supabase';
import { petakanErrorDb, responsError, responsOk } from '@/lib/server/respons';
import type { JenisTransaksiKoin, RiwayatKoin, TransaksiKoin } from '@/lib/tipe';

export const dynamic = 'force-dynamic';

type BarisTransaksi = {
  id: string;
  jumlah: number;
  jenis: JenisTransaksiKoin;
  keterangan: string | null;
  dibuat_pada: string;
};

// GET /api/guru/koin/riwayat: transaksi koin terbaru milik guru yang login.
export async function GET() {
  const auth = await wajibPeranApi('guru');
  if (!auth.ok) return auth.respons;

  try {
    const { data, error } = await ambilSupabase()
      .from('transaksi_koin')
      .select('id, jumlah, jenis, keterangan, dibuat_pada')
      .eq('guru_id', auth.profil.id)
      .order('dibuat_pada', { ascending: false })
      .limit(60);

    if (error) {
      if (perluMigrasiKoin(error)) {
        console.error('Tabel transaksi_koin belum tersedia:', error);
        return responsError(PESAN_MIGRASI_KOIN, 503);
      }
      return petakanErrorDb(error);
    }

    const transaksi: TransaksiKoin[] = (data as BarisTransaksi[]).map((baris) => ({
      id: baris.id,
      jumlah: Number(baris.jumlah),
      jenis: baris.jenis,
      keterangan: baris.keterangan,
      dibuatPada: baris.dibuat_pada,
    }));

    return responsOk<RiwayatKoin>({ transaksi });
  } catch (err) {
    console.error('Gagal membaca riwayat koin:', err);
    return petakanErrorDb(err);
  }
}
