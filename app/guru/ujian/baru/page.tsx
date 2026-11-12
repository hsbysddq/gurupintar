'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { Tombol } from '@/components/Tombol';
import { ambilDaftarKelas, ambilDaftarTopik, ambilDetailTopik, buatUjian, ErrorApi } from '@/lib/api-klien';
import { LABEL_TIPE_SOAL } from '@/lib/soal-tka';
import { waktuLokalKeIso } from '@/lib/jadwal-kuis';
import type { KelasRingkas, TipeSoalUjian, TopikDetail, TopikRingkas } from '@/lib/tipe';

const INPUT =
  'h-12 w-full rounded-2xl border border-white/70 bg-white/70 px-3 font-body text-[14px] text-aura-ink outline-none focus:border-aura-primary/40';
const TIPE_DIDUKUNG: TipeSoalUjian[] = ['pilgan', 'pilgan_kompleks', 'esai'];

function nilaiLokal(date: Date): string {
  const dua = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${dua(date.getMonth() + 1)}-${dua(date.getDate())}T${dua(date.getHours())}:${dua(date.getMinutes())}`;
}

export default function HalamanBuatUjian() {
  const router = useRouter();
  const [kelas, setKelas] = useState<KelasRingkas[] | null>(null);
  const [topik, setTopik] = useState<TopikRingkas[] | null>(null);
  const [kelasId, setKelasId] = useState('');
  const [topikId, setTopikId] = useState('');
  const [detail, setDetail] = useState<TopikDetail | null>(null);
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [token, setToken] = useState('');
  const [mulai, setMulai] = useState(() => nilaiLokal(new Date()));
  const [selesai, setSelesai] = useState(() => nilaiLokal(new Date(Date.now() + 2 * 60 * 60_000)));
  const [durasi, setDurasi] = useState(60);
  const [acakSoal, setAcakSoal] = useState(false);
  const [dipilih, setDipilih] = useState<Record<string, number>>({});
  const [memuat, setMemuat] = useState(true);
  const [memuatDetail, setMemuatDetail] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    Promise.all([ambilDaftarKelas(), ambilDaftarTopik()])
      .then(([daftarKelas, daftarTopik]) => {
        if (batal) return;
        setKelas(daftarKelas);
        setTopik(daftarTopik);
        setKelasId(daftarKelas[0]?.id ?? '');
        setTopikId(daftarTopik[0]?.id ?? '');
        setMemuatDetail(Boolean(daftarTopik[0]));
        setJudul(daftarTopik[0] ? `Ujian ${daftarTopik[0].nama}` : '');
      })
      .catch((err) => {
        if (!batal) setGalat(err instanceof ErrorApi ? err.message : 'Data kelas/topik gagal dimuat.');
      })
      .finally(() => {
        if (!batal) setMemuat(false);
      });
    return () => {
      batal = true;
    };
  }, []);

  useEffect(() => {
    if (!topikId) return;
    let batal = false;
    ambilDetailTopik(topikId)
      .then((data) => {
        if (batal) return;
        setDetail(data);
        const berdasarkanId: Record<string, number> = {};
        for (const s of data.soal) {
          if (TIPE_DIDUKUNG.includes((s.tipe ?? 'pilgan') as TipeSoalUjian)) berdasarkanId[s.id] = 1;
        }
        setDipilih(berdasarkanId);
        setJudul(`Ujian ${data.nama}`);
      })
      .catch((err) => {
        if (!batal) setGalat(err instanceof ErrorApi ? err.message : 'Soal topik gagal dimuat.');
      })
      .finally(() => {
        if (!batal) setMemuatDetail(false);
      });
    return () => {
      batal = true;
    };
  }, [topikId]);

  const soalDidukung = useMemo(
    () => (detail?.soal ?? []).filter((s) => TIPE_DIDUKUNG.includes((s.tipe ?? 'pilgan') as TipeSoalUjian)),
    [detail],
  );
  const totalJumlah = Object.keys(dipilih).length;

  function toggleSoal(id: string) {
    setDipilih((lama) => {
      const salinan = { ...lama };
      if (salinan[id] !== undefined) delete salinan[id];
      else salinan[id] = 1;
      return salinan;
    });
  }

  async function kirim(e: FormEvent) {
    e.preventDefault();
    setGalat(null);
    const mulaiIso = waktuLokalKeIso(mulai);
    const selesaiIso = waktuLokalKeIso(selesai);
    if (!mulaiIso || !selesaiIso) {
      setGalat('Waktu mulai dan selesai wajib diisi.');
      return;
    }
    if (!detail || totalJumlah === 0) {
      setGalat('Pilih minimal satu soal.');
      return;
    }
    const soal = soalDidukung
      .filter((s) => dipilih[s.id] !== undefined)
      .map((s) => ({
        soalId: s.id,
        bobot: Math.min(100, Math.max(1, Number(dipilih[s.id]) || 1)),
      }));
    if (soal.length === 0) {
      setGalat('Soal terpilih tidak memiliki ID. Muat ulang halaman.');
      return;
    }

    try {
      setMemuatDetail(true);
      const ujian = await buatUjian({
        kelasId,
        topikId,
        judul,
        deskripsi: deskripsi || undefined,
        token: token || undefined,
        mulaiPada: mulaiIso,
        selesaiPada: selesaiIso,
        durasiMenit: Math.min(300, Math.max(5, Number(durasi) || 60)),
        acakSoal,
        soal,
      });
      router.push(`/guru/ujian/${ujian.id}`);
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Ujian belum berhasil dibuat.');
      setMemuatDetail(false);
    }
  }

  if (memuat) {
    return (
      <div className="flex items-center gap-2 p-6 text-aura-muted">
        <Loader2 className="size-5 animate-spin" /> Memuat data…
      </div>
    );
  }

  return (
    <form onSubmit={kirim} className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <span className="aura-eyebrow">Ujian formal</span>
        <h1 className="font-display text-[28px] leading-[36px] font-extrabold tracking-[-0.025em] text-aura-ink">
          Buat ujian
        </h1>
        <p className="font-body text-[14px] leading-[22px] text-aura-muted">
          Pilih kelas dan topik, atur bobot setiap soal, lalu tentukan token dan waktu.
        </p>
      </header>

      <KartuKaca className="grid gap-4 p-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Kelas
          <select value={kelasId} onChange={(e) => setKelasId(e.target.value)} required className={INPUT}>
            {(kelas ?? []).map((k) => (
              <option key={k.id} value={k.id}>{k.nama} · {k.mapel}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Topik sumber soal
          <select value={topikId} onChange={(e) => { setMemuatDetail(true); setTopikId(e.target.value); }} required className={INPUT}>
            {(topik ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.nama} ({t.jumlahSoal} soal)</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted sm:col-span-2">
          Judul ujian
          <input value={judul} onChange={(e) => setJudul(e.target.value)} required className={INPUT} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted sm:col-span-2">
          Deskripsi (opsional)
          <input value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className={INPUT} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Mulai
          <input type="datetime-local" value={mulai} onChange={(e) => setMulai(e.target.value)} required className={INPUT} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Selesai
          <input type="datetime-local" value={selesai} onChange={(e) => setSelesai(e.target.value)} required className={INPUT} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Durasi per siswa (menit)
          <input type="number" min={5} max={300} value={durasi} onChange={(e) => setDurasi(Number(e.target.value))} required className={INPUT} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-aura-muted">
          Token (opsional)
          <input value={token} onChange={(e) => setToken(e.target.value.toUpperCase())} placeholder="Kosongkan untuk otomatis" className={INPUT} />
        </label>
        <label className="flex items-center gap-2 text-[13px] font-semibold text-aura-ink sm:col-span-2">
          <input type="checkbox" checked={acakSoal} onChange={(e) => setAcakSoal(e.target.checked)} className="size-4 accent-aura-primary" />
          Acak urutan soal
        </label>
      </KartuKaca>

      <KartuKaca className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-[18px] font-bold text-aura-ink">Soal dan bobot</h2>
          <span className="font-body text-[12px] text-aura-muted">{totalJumlah} soal dipilih</span>
        </div>
        {memuatDetail ? (
          <p className="flex items-center gap-2 text-[14px] text-aura-muted"><Loader2 className="size-4 animate-spin" /> Memuat soal…</p>
        ) : soalDidukung.length === 0 ? (
          <p className="text-[14px] text-aura-muted">Topik ini belum punya soal pilihan ganda atau esai.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/60">
            {soalDidukung.map((s) => {
              const aktif = dipilih[s.id] !== undefined;
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <input type="checkbox" checked={aktif} onChange={() => toggleSoal(s.id)} className="size-4 accent-aura-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[13px] font-semibold text-aura-ink">
                      {s.nomor}. {s.teks}
                    </p>
                    <p className="font-body text-[11px] text-aura-muted">{LABEL_TIPE_SOAL[(s.tipe ?? 'pilgan') as keyof typeof LABEL_TIPE_SOAL]}</p>
                  </div>
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-aura-muted">
                    Bobot
                    <input
                      type="number"
                      min={1}
                      max={100}
                      disabled={!aktif}
                      value={dipilih[s.id] ?? 1}
                      onChange={(e) => setDipilih((lama) => ({ ...lama, [s.id]: Number(e.target.value) }))}
                      className="h-10 w-20 rounded-xl border border-white/70 bg-white/70 px-2 text-center text-aura-ink"
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </KartuKaca>

      {galat && <p role="alert" className="text-[13px] font-medium text-belum-teks">{galat}</p>}
      <div className="flex flex-wrap gap-2">
        <Tombol varian="utama" type="submit" memuat={memuatDetail} ikon={ClipboardCheck} disabled={!kelasId || !topikId || !judul || totalJumlah === 0}>
          Publikasikan ujian
        </Tombol>
        <Tombol varian="sekunder" type="button" onClick={() => router.push('/guru/ujian')}>
          Batal
        </Tombol>
      </div>
    </form>
  );
}
