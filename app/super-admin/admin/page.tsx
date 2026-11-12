import { KartuKaca } from '@/components/KartuKaca';
import { daftarSekolah } from '@/lib/server/sekolah';
import { ambilSupabase } from '@/lib/server/supabase';
import { FormAdminSekolah } from './FormAdminSekolah';

export default async function HalamanAdminSuper({ searchParams }: { searchParams: Promise<{ sekolah?: string }> }) {
  const { sekolah: awal } = await searchParams;
  const sekolah = await daftarSekolah(ambilSupabase());

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-aura-primary">Super-admin</span>
        <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
          Tambah admin sekolah
        </h1>
        <p className="font-body text-[14px] leading-[22px] text-aura-muted">
          Admin sekolah dapat membuat akun guru/siswa dan membuka peserta ujian yang diblokir.
        </p>
      </header>
      <KartuKaca className="p-5 sm:p-6">
        {sekolah.length === 0 ? (
          <p className="text-[14px] text-aura-muted">Buat sekolah terlebih dahulu.</p>
        ) : (
          <FormAdminSekolah sekolah={sekolah} awal={awal} />
        )}
      </KartuKaca>
    </div>
  );
}
