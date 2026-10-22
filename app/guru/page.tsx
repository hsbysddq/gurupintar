import Link from 'next/link';
import { KeyRound, PlayCircle, Users } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { profilWajib } from '@/lib/server/auth';
import { ambilKelasGuru } from '@/lib/server/kelas';
import { ambilSupabase } from '@/lib/server/supabase';
import { FormBuatKelas } from './FormBuatKelas';

// Daftar kelas milik guru. Satu kartu per kelas, dengan status kuis aktifnya.
export default async function HalamanDaftarKelas() {
  const profil = await profilWajib('guru');
  const daftar = await ambilKelasGuru(ambilSupabase(), profil.id);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-tight font-bold">Kelas saya</h1>
        <p className="text-tinta-lembut">
          {daftar.length > 0
            ? `${daftar.length} kelas. Pilih kelas untuk membuka kuis, melihat hasil, dan membagikan materi.`
            : 'Belum ada kelas. Buat kelas pertama untuk mulai mengajar.'}
        </p>
      </header>

      {daftar.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {daftar.map((kelas) => (
            <li key={kelas.id}>
              <Link href={`/guru/kelas?kelas=${kelas.id}`} className="group block h-full">
                <KartuKaca
                  as="article"
                  className="flex h-full flex-col gap-4 p-5 transition-colors group-hover:bg-primer-lembut/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-xl leading-snug font-semibold">{kelas.nama}</h2>
                      <p className="text-tinta-lembut">{kelas.mapel}</p>
                    </div>
                    {kelas.kuisAktif ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primer-lembut px-2.5 py-1 text-[12px] leading-normal font-semibold text-primer">
                        <PlayCircle aria-hidden="true" className="size-3.5" />
                        Kuis aktif
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-tinta/5 px-2.5 py-1 text-[12px] leading-normal font-semibold text-tinta-lembut">
                        Belum ada kuis
                      </span>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-[12px] leading-normal font-medium text-tinta-lembut">Siswa</dt>
                      <dd className="flex items-center gap-1.5 font-semibold">
                        <Users aria-hidden="true" className="size-4 text-tinta-lembut" />
                        {kelas.jumlahSiswa}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-[12px] leading-normal font-medium text-tinta-lembut">Kode undangan</dt>
                      <dd className="flex items-center gap-1.5 font-semibold tracking-wide">
                        <KeyRound aria-hidden="true" className="size-4 text-tinta-lembut" />
                        {kelas.kodeUndangan}
                      </dd>
                    </div>
                  </dl>

                  {kelas.kuisAktif && (
                    <p className="text-[14px] leading-normal text-tinta-lembut">
                      Kode kuis <strong className="tracking-wide text-tinta">{kelas.kuisAktif.kodeKelas}</strong> ·{' '}
                      {kelas.kuisAktif.jumlahMenjawab}/{kelas.jumlahSiswa} menjawab
                    </p>
                  )}

                  <span className="mt-auto text-[15px] font-semibold text-primer">Kelola kelas →</span>
                </KartuKaca>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <FormBuatKelas pertamaKali={daftar.length === 0} />
    </div>
  );
}
