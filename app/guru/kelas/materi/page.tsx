import { redirect } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { KepalaKelas } from '@/components/KepalaKelas';
import { PustakaMateriKelas } from '@/components/PustakaMateriKelas';
import { profilWajib } from '@/lib/server/auth';
import { ambilKelasGuru, ambilMateriPustakaKelas } from '@/lib/server/kelas';
import { tabelBelumAda } from '@/lib/server/respons';
import { ambilSupabase } from '@/lib/server/supabase';
import type { MateriPustaka } from '@/lib/tipe';

// Tab Materi: pustaka materi mandiri kelas, dikelompokkan per bab/topik.
export default async function HalamanMateriKelas({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string }>;
}) {
  const { kelas } = await searchParams;
  const profil = await profilWajib('guru');
  const db = ambilSupabase();
  const daftarKelas = await ambilKelasGuru(db, profil.id);
  if (daftarKelas.length === 0) redirect('/guru');

  const dipilih = daftarKelas.find((k) => k.id === kelas);
  if (!dipilih) redirect(`/guru/kelas/materi?kelas=${daftarKelas[0].id}`);

  let materi: MateriPustaka[] | null = null;
  let perluMigrasi = false;
  try {
    materi = await ambilMateriPustakaKelas(db, profil.id, dipilih.id);
  } catch (err) {
    if (tabelBelumAda(err)) perluMigrasi = true;
    else throw err;
  }
  if (!perluMigrasi && !materi) redirect('/guru');

  return (
    <div className="flex flex-col gap-6">
      <KepalaKelas kelas={dipilih} />
      {perluMigrasi ? <PemberitahuanMigrasi /> : <PustakaMateriKelas kelas={dipilih} daftar={materi ?? []} />}
    </div>
  );
}

function PemberitahuanMigrasi() {
  return (
    <section className="aura-glass flex flex-col gap-3 rounded-[24px] p-6">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary ring-1 ring-white/70">
        <AlertTriangle aria-hidden="true" className="size-5" />
      </span>
      <h2 className="font-display text-[20px] leading-[28px] font-bold tracking-[-0.01em] text-aura-ink">
        Pustaka materi belum aktif
      </h2>
      <p className="max-w-2xl font-body text-[14px] leading-[22px] text-aura-muted">
        Jalankan file <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-[12px]">supabase/migrasi-materi-pustaka.sql</code>{' '}
        di Supabase SQL Editor, lalu muat ulang halaman ini.
      </p>
    </section>
  );
}
