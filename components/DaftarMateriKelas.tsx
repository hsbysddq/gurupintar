import { KartuKaca } from '@/components/KartuKaca';
import { Tombol } from '@/components/Tombol';
import type { KelasRingkas, MateriKelasRingkas } from '@/lib/tipe';

const FORMAT_TANGGAL = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function ringkas(baris: MateriKelasRingkas): string {
  if (baris.materi.length === 0) return 'Belum ada materi';
  const draf = baris.materi.filter((m) => m.status === 'draf').length;
  const dibagikan = baris.materi.filter((m) => m.status === 'dibagikan').length;
  const bagian = [draf > 0 ? `${draf} draf` : '', dibagikan > 0 ? `${dibagikan} dibagikan` : ''];
  return bagian.filter(Boolean).join(' · ');
}

export function DaftarMateriKelas({ kelas, daftar }: { kelas: KelasRingkas; daftar: MateriKelasRingkas[] }) {
  if (daftar.length === 0) {
    return (
      <KartuKaca as="section" className="flex flex-col gap-3 p-6">
        <h2 className="text-xl leading-snug font-semibold">Belum ada sesi kuis</h2>
        <p className="text-tinta-lembut">
          Materi dibuat dari hasil kuis. Buka kuis dulu di tab Kuis, lalu kembali ke sini setelah siswa menjawab.
        </p>
        <div>
          <Tombol varian="utama" href={`/guru/kelas?kelas=${kelas.id}`}>
            Ke tab Kuis
          </Tombol>
        </div>
      </KartuKaca>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl leading-snug font-semibold">Materi kelas</h2>
        <p className="text-tinta-lembut">Satu baris per sesi kuis, beserta status materinya.</p>
      </div>

      <ul className="flex flex-col gap-3">
        {daftar.map((s) => (
          <li key={s.sesiId}>
            <KartuKaca as="article" className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[12px] leading-normal font-medium text-tinta-lembut">
                    {FORMAT_TANGGAL.format(new Date(s.dibuatPada))} · Kode {s.kodeKelas}
                  </p>
                  <h3 className="text-lg leading-snug font-semibold">{s.namaTopik}</h3>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[12px] leading-normal font-semibold ${
                    s.status === 'aktif' ? 'bg-primer-lembut text-primer' : 'bg-tinta/5 text-tinta-lembut'
                  }`}
                >
                  {s.status === 'aktif' ? 'Aktif' : 'Selesai'}
                </span>
              </div>

              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] leading-normal text-tinta-lembut">
                <span>{s.jumlahMenjawab} menjawab</span>
                <span aria-hidden="true">·</span>
                <span>{ringkas(s)}</span>
              </p>

              <div className="flex flex-wrap gap-2">
                <Tombol varian="sekunder" href={`/guru/materi?sesi=${s.sesiId}&kelas=${kelas.id}`}>
                  {s.materi.length > 0 ? 'Kelola materi' : 'Buat materi'}
                </Tombol>
                <Tombol varian="teks" href={`/guru/hasil?sesi=${s.sesiId}&kelas=${kelas.id}`}>
                  Lihat hasil
                </Tombol>
              </div>
            </KartuKaca>
          </li>
        ))}
      </ul>
    </section>
  );
}
