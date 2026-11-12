'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Loader2, Send } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { KartuSoalKuis } from '@/components/KartuSoalKuis';
import { KerangkaSiswa } from '@/components/KerangkaSiswa';
import { NavigasiSoal } from '@/components/NavigasiSoal';
import { PemantauUjian } from '@/components/PemantauUjian';
import { ProgressKuis } from '@/components/ProgressKuis';
import { StatusHalaman } from '@/components/StatusHalaman';
import { ambilSoalUjian, ErrorApi, selesaikanUjian, simpanJawabanUjian } from '@/lib/api-klien';
import type { SoalUjianSiswa } from '@/lib/tipe';

type Muatan =
  | { status: 'memuat' }
  | { status: 'gagal'; pesan: string; sesiHilang: boolean }
  | { status: 'siap'; soal: SoalUjianSiswa[]; batasPada: string };

function formatSisa(detik: number): string {
  const menit = Math.floor(detik / 60);
  const sisa = detik % 60;
  return `${String(menit).padStart(2, '0')}:${String(sisa).padStart(2, '0')}`;
}

export default function HalamanKerjakanUjian() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ujianId = params.id;
  const [muatan, setMuatan] = useState<Muatan>({ status: 'memuat' });
  const [indeks, setIndeks] = useState(0);
  const [jawaban, setJawaban] = useState<Record<string, string>>({});
  const [menyimpan, setMenyimpan] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [sekarang, setSekarang] = useState(0);
  const [mengumpulkan, setMengumpulkan] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [diblokir, setDiblokir] = useState(false);
  const tandaiDiblokir = useCallback(() => setDiblokir(true), []);
  const timerSimpan = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const sudahAutoSubmit = useRef(false);

  useEffect(() => {
    let batal = false;
    ambilSoalUjian(ujianId)
      .then((hasil) => {
        if (batal) return;
        setJawaban(hasil.jawaban ?? {});
        setMuatan({ status: 'siap', soal: hasil.soal, batasPada: hasil.batasPada });
      })
      .catch((err) => {
        if (batal) return;
        const status = err instanceof ErrorApi ? err.status : 0;
        setMuatan({
          status: 'gagal',
          pesan: err instanceof ErrorApi ? err.message : 'Ujian belum bisa dimuat.',
          sesiHilang: status === 403 || status === 404 || status === 409 || status === 423,
        });
      });
    return () => {
      batal = true;
    };
  }, [ujianId]);

  useEffect(() => {
    const awal = window.setTimeout(() => setSekarang(Date.now()), 0);
    const timer = setInterval(() => setSekarang(Date.now()), 1000);
    return () => {
      window.clearTimeout(awal);
      clearInterval(timer);
    };
  }, []);

  const batasPada = muatan.status === 'siap' ? muatan.batasPada : null;
  const sisa = batasPada ? Math.max(0, Math.ceil((Date.parse(batasPada) - sekarang) / 1000)) : 0;

  const kirim = useCallback(async () => {
    if (mengumpulkan || selesai) return;
    setMengumpulkan(true);
    setGalat(null);
    try {
      await selesaikanUjian(ujianId);
      setSelesai(true);
    } catch (err) {
      setGalat(err instanceof ErrorApi ? err.message : 'Jawaban belum berhasil dikumpulkan.');
    } finally {
      setMengumpulkan(false);
    }
  }, [mengumpulkan, selesai, ujianId]);

  useEffect(() => {
    if (muatan.status !== 'siap' || sisa > 0 || sudahAutoSubmit.current || selesai) return;
    sudahAutoSubmit.current = true;
    void kirim();
  }, [muatan.status, sisa, selesai, kirim]);

  useEffect(() => {
    const timers = timerSimpan.current;
    return () => {
      for (const timer of Object.values(timers)) clearTimeout(timer);
    };
  }, []);

  function ubahJawaban(soalId: string, nilai: string) {
    setJawaban((lama) => ({ ...lama, [soalId]: nilai }));
    if (timerSimpan.current[soalId]) clearTimeout(timerSimpan.current[soalId]);
    setMenyimpan(true);
    timerSimpan.current[soalId] = setTimeout(() => {
      simpanJawabanUjian({ ujianId, soalId, jawaban: nilai })
        .catch(() => setGalat('Jawaban terakhir belum tersimpan. Periksa koneksi.'))
        .finally(() => setMenyimpan(false));
    }, 500);
  }

  if (muatan.status === 'memuat') {
    return <KerangkaSiswa><StatusHalaman jenis="memuat" judul="Menyiapkan ujian" /></KerangkaSiswa>;
  }
  if (muatan.status === 'gagal') {
    return (
      <KerangkaSiswa>
        <StatusHalaman
          jenis="gagal"
          judul="Ujian belum bisa dibuka"
          pesan={muatan.pesan}
          aksi={muatan.sesiHilang
            ? { label: 'Kembali ke daftar ujian', onClick: () => router.replace('/siswa/ujian') }
            : { label: 'Coba lagi', onClick: () => window.location.reload() }}
        />
      </KerangkaSiswa>
    );
  }

  if (selesai) {
    return (
      <KerangkaSiswa>
        <KartuKaca className="flex flex-col items-center gap-4 p-8 text-center">
          <CheckCircle2 className="size-12 text-sudah-teks" />
          <h1 className="font-display text-[26px] font-extrabold text-aura-ink">Jawaban sudah dikumpulkan</h1>
          <p className="text-aura-muted">Nilai akan terlihat setelah guru merilis hasil ujian.</p>
          <Link href="/siswa/ujian" className="aura-btn aura-btn-primary h-12 px-5 text-[13px]">Kembali ke daftar ujian</Link>
        </KartuKaca>
      </KerangkaSiswa>
    );
  }

  if (diblokir) {
    return (
      <KerangkaSiswa>
        <StatusHalaman jenis="gagal" judul="Ujian diblokir" pesan="Hubungi admin sekolah untuk membuka blokir." aksi={{ label: 'Kembali', onClick: () => router.replace('/siswa/ujian') }} />
      </KerangkaSiswa>
    );
  }

  const soalIni = muatan.soal[indeks];
  const terakhir = indeks === muatan.soal.length - 1;
  const terjawab = new Set(
    muatan.soal.flatMap((s, i) => (jawaban[s.id]?.trim() ? [i] : [])),
  );

  return (
    <KerangkaSiswa kunciDasbor>
      <PemantauUjian ujianId={ujianId} onTerblokir={tandaiDiblokir} />
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="aura-eyebrow">Ujian</span>
          <h1 className="font-display text-[24px] leading-[32px] font-extrabold tracking-[-0.02em] text-aura-ink">Kerjakan ujian</h1>
          <p className="text-aura-muted">Jawaban tersimpan otomatis. Jangan meninggalkan halaman.</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-display text-[14px] font-bold ${sisa <= 60 ? 'bg-belum-latar text-belum-teks' : 'bg-aura-primary/10 text-aura-primary'}`}>
          <Clock3 className="size-4" /> {formatSisa(sisa)}
        </span>
      </header>

      <ProgressKuis saatIni={indeks + 1} total={muatan.soal.length} />
      <div className="hidden lg:block">
        <NavigasiSoal total={muatan.soal.length} indeks={indeks} terjawab={terjawab} onPilih={setIndeks} />
      </div>

      {soalIni && (
        <KartuSoalKuis
          key={soalIni.id}
          nomor={soalIni.nomor}
          tipe={soalIni.tipe}
          teks={soalIni.teks}
          gambar={soalIni.gambar}
          pilihan={soalIni.pilihan}
          terpilih={jawaban[soalIni.id] ?? null}
          onPilih={(nilai) => ubahJawaban(soalIni.id, nilai)}
        />
      )}

      {galat && <p role="alert" className="text-[13px] font-medium text-belum-teks">{galat}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIndeks((i) => Math.max(0, i - 1))}
          disabled={indeks === 0 || mengumpulkan}
          className="inline-flex min-h-12 items-center gap-1 rounded-full px-4 font-semibold text-aura-primary hover:bg-aura-primary/5 disabled:opacity-40"
        >
          <ArrowLeft className="size-4" /> Sebelumnya
        </button>
        <span className="text-[12px] font-medium text-aura-muted">{menyimpan ? 'Menyimpan…' : 'Tersimpan'}</span>
        {terakhir ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Kumpulkan ujian sekarang? Jawaban tidak bisa diubah setelah dikumpulkan.')) void kirim();
            }}
            disabled={mengumpulkan}
            className="aura-btn aura-btn-primary inline-flex min-h-12 items-center gap-2 px-5 font-semibold"
          >
            {mengumpulkan ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Kumpulkan
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndeks((i) => Math.min(muatan.soal.length - 1, i + 1))}
            disabled={mengumpulkan}
            className="inline-flex min-h-12 items-center gap-1 rounded-full px-4 font-semibold text-aura-primary hover:bg-aura-primary/5 disabled:opacity-40"
          >
            Berikutnya <ArrowRight className="size-4" />
          </button>
        )}
      </div>
    </KerangkaSiswa>
  );
}
