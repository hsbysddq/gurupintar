import Link from 'next/link';
import { AlertCircle, KeyRound, PlayCircle, Users } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { profilWajib } from '@/lib/server/auth';
import { ambilRingkasanKelas } from '@/lib/server/ringkasan-kelas';
import { ambilSupabase } from '@/lib/server/supabase';

const FORMAT_TANGGAL = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export default async function HalamanRingkasan() {
  const profil = await profilWajib('guru');
  const daftar = await ambilRingkasanKelas(ambilSupabase(), profil.id);

  const totalSiswa = daftar.reduce((n, k) => n + k.jumlahSiswa, 0);
  const totalKuisAktif = daftar.filter((k) => k.kuisAktif).length;
  const totalPendampingan = daftar.reduce((n, k) => n + k.jumlahPerluPendampingan, 0);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-tight font-bold">Ringkasan</h1>
        <p className="text-tinta-lembut">Kondisi semua kelasmu dalam satu layar.</p>
      </header>

      {daftar.length === 0 ? (
        <KartuKaca as="section" className="flex flex-col gap-3 p-6">
          <h2 className="text-xl leading-snug font-semibold">Belum ada kelas</h2>
          <p className="text-tinta-lembut">Buat kelas pertamamu untuk melihat ringkasan di sini.</p>
          <div>
            <Link href="/guru" className="font-semibold text-primer hover:underline">
              Ke daftar kelas →
            </Link>
          </div>
        </KartuKaca>
      ) : (
        <>
          <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KartuKaca as="div" className="p-4">
              <dt className="text-[13px] leading-normal font-medium text-tinta-lembut">Kelas aktif</dt>
              <dd className="text-[28px] leading-tight font-bold">{daftar.length}</dd>
            </KartuKaca>
            <KartuKaca as="div" className="p-4">
              <dt className="text-[13px] leading-normal font-medium text-tinta-lembut">Total siswa</dt>
              <dd className="text-[28px] leading-tight font-bold">{totalSiswa}</dd>
            </KartuKaca>
            <KartuKaca as="div" className="p-4">
              <dt className="text-[13px] leading-normal font-medium text-tinta-lembut">Kuis aktif</dt>
              <dd className="text-[28px] leading-tight font-bold">{totalKuisAktif}</dd>
            </KartuKaca>
            <KartuKaca as="div" className="p-4">
              <dt className="text-[13px] leading-normal font-medium text-tinta-lembut">Perlu pendampingan</dt>
              <dd className="text-[28px] leading-tight font-bold">{totalPendampingan}</dd>
            </KartuKaca>
          </dl>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {daftar.map((kelas) => (
              <li key={kelas.id}>
                <KartuKaca as="article" className="flex h-full flex-col gap-4 p-5">
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
                        Tanpa kuis
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
                      <dt className="text-[12px] leading-normal font-medium text-tinta-lembut">Sesi</dt>
                      <dd className="font-semibold">
                        {kelas.jumlahSesi}
                        {kelas.sesiTerakhir && (
                          <span className="ml-1 text-[12px] leading-normal font-medium text-tinta-lembut">
                            · {FORMAT_TANGGAL.format(new Date(kelas.sesiTerakhir))}
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  {kelas.kuisAktif && (
                    <p className="text-[14px] leading-normal text-tinta-lembut">
                      <KeyRound aria-hidden="true" className="mr-1 inline size-4 align-text-bottom" />
                      Kode <strong className="tracking-wide text-tinta">{kelas.kuisAktif.kodeKelas}</strong> ·{' '}
                      {kelas.kuisAktif.jumlahMenjawab}/{kelas.jumlahSiswa} menjawab
                    </p>
                  )}

                  <p
                    className={`flex items-center gap-1.5 text-[14px] leading-normal font-medium ${
                      kelas.jumlahPerluPendampingan > 0 ? 'text-setengah-teks' : 'text-tinta-lembut'
                    }`}
                  >
                    <AlertCircle aria-hidden="true" className="size-4" />
                    {kelas.jumlahPerluPendampingan > 0
                      ? `${kelas.jumlahPerluPendampingan} siswa perlu pendampingan`
                      : 'Tidak ada yang perlu pendampingan'}
                  </p>

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link
                      href={`/guru/kelas?kelas=${kelas.id}`}
                      className="font-semibold text-primer hover:underline"
                    >
                      Buka kelas →
                    </Link>
                    <Link
                      href={`/guru/pendampingan?kelas=${kelas.id}`}
                      className="font-semibold text-tinta-lembut hover:text-primer"
                    >
                      Pendampingan
                    </Link>
                  </div>
                </KartuKaca>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
