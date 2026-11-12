'use client';

import { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, ClipboardCheck, Copy, Loader2, X } from 'lucide-react';
import { KartuKaca } from '@/components/KartuKaca';
import { StatusHalaman } from '@/components/StatusHalaman';
import { Tombol } from '@/components/Tombol';
import { usePolling } from '@/hooks/use-polling';
import { ambilDetailUjian, ErrorApi, nilaiEsaiUjian, rilisUjian } from '@/lib/api-klien';
import { formatJadwal } from '@/lib/jadwal-kuis';
import { INTERVAL_POLLING_GURU_MS } from '@/lib/konstanta';

export default function HalamanMonitorUjian() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const ambil = useCallback((signal: AbortSignal) => ambilDetailUjian(id, signal), [id]);
  const { data, galat, memuat, muatUlang } = usePolling(id ? ambil : null, INTERVAL_POLLING_GURU_MS);
  const [memproses, setMemproses] = useState<string | null>(null);
  const [galatAksi, setGalatAksi] = useState<string | null>(null);

  async function nilai(soalId: string, siswaId: string, benar: boolean) {
    setMemproses(`${soalId}:${siswaId}`);
    setGalatAksi(null);
    try {
      await nilaiEsaiUjian({ ujianId: id, soalId, siswaId, benar });
      muatUlang();
    } catch (err) {
      setGalatAksi(err instanceof ErrorApi ? err.message : 'Nilai esai belum tersimpan.');
    } finally {
      setMemproses(null);
    }
  }

  async function rilis() {
    setMemproses('rilis');
    setGalatAksi(null);
    try {
      await rilisUjian(id);
      muatUlang();
    } catch (err) {
      setGalatAksi(err instanceof ErrorApi ? err.message : 'Hasil belum bisa dirilis.');
    } finally {
      setMemproses(null);
    }
  }

  if (memuat && !data) return <StatusHalaman jenis="memuat" judul="Memuat ujian" />;
  if (!data) {
    return (
      <StatusHalaman
        jenis="gagal"
        judul="Ujian belum bisa dimuat"
        pesan={galat ?? undefined}
        aksi={{ label: 'Coba lagi', onClick: muatUlang }}
      />
    );
  }

  const { ujian, peserta, esai } = data;
  const esaiBelumDinilai = esai.filter((e) => e.benar === null).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="aura-eyebrow">Monitor ujian</span>
          <h1 className="font-display text-[26px] leading-[34px] font-extrabold tracking-[-0.025em] text-aura-ink">{ujian.judul}</h1>
          <p className="font-body text-[14px] text-aura-muted">
            {ujian.namaKelas} · {formatJadwal(ujian.mulaiPada)} — {formatJadwal(ujian.selesaiPada)} · {ujian.durasiMenit} menit
          </p>
        </div>
        <span className="rounded-full bg-aura-primary/10 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-primary">
          {ujian.status}
        </span>
      </header>

      <KartuKaca className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.05em] text-aura-muted">Token ujian</p>
          <p className="mt-1 font-display text-[32px] font-extrabold tracking-[0.18em] text-aura-ink">{ujian.token}</p>
        </div>
        <button
          type="button"
          onClick={() => void navigator.clipboard?.writeText(ujian.token)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-display text-[12px] font-semibold text-aura-primary hover:bg-aura-primary/5"
        >
          <Copy aria-hidden="true" className="size-4" /> Salin token
        </button>
      </KartuKaca>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Peserta', nilai: ujian.jumlahPeserta },
          { label: 'Mengerjakan', nilai: ujian.jumlahMengerjakan },
          { label: 'Selesai', nilai: ujian.jumlahSelesai },
          { label: 'Diblokir', nilai: ujian.jumlahDiblokir },
        ].map((item) => (
          <KartuKaca key={item.label} className="p-4">
            <p className="font-display text-[24px] font-extrabold text-aura-ink">{item.nilai}</p>
            <p className="font-body text-[12px] text-aura-muted">{item.label}</p>
          </KartuKaca>
        ))}
      </div>

      {galatAksi && <p role="alert" className="text-[13px] font-medium text-belum-teks">{galatAksi}</p>}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[18px] font-bold text-aura-ink">Peserta</h2>
        <KartuKaca className="divide-y divide-white/60 p-2">
          {peserta.length === 0 ? (
            <p className="p-4 text-[14px] text-aura-muted">Belum ada peserta di kelas ini.</p>
          ) : peserta.map((p) => (
            <div key={p.siswaId} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
              <div>
                <p className="font-display text-[14px] font-semibold text-aura-ink">{p.nama}</p>
                <p className="font-body text-[11px] text-aura-muted">
                  {p.status} · {p.jumlahPelanggaran} pelanggaran
                  {p.batasPada ? ` · batas ${formatJadwal(p.batasPada)}` : ''}
                </p>
              </div>
              <p className="font-display text-[13px] font-bold text-aura-ink">
                {p.total > 0 ? `${p.skor}/${p.total} (${p.persen ?? 0}%)` : 'Belum dinilai'}
              </p>
            </div>
          ))}
        </KartuKaca>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-[18px] font-bold text-aura-ink">Jawaban esai</h2>
          <span className="font-body text-[12px] text-aura-muted">{esaiBelumDinilai} belum dinilai</span>
        </div>
        <KartuKaca className="flex flex-col divide-y divide-white/60 p-2">
          {esai.length === 0 ? (
            <p className="p-4 text-[14px] text-aura-muted">Tidak ada jawaban esai.</p>
          ) : esai.map((e) => (
            <div key={`${e.soalId}:${e.siswaId}`} className="flex flex-col gap-2 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-[13px] font-semibold text-aura-ink">
                  Soal {e.nomorSoal} · {e.namaSiswa}
                </p>
                <span className={`font-display text-[11px] font-bold ${e.benar === null ? 'text-setengah-teks' : e.benar ? 'text-sudah-teks' : 'text-belum-teks'}`}>
                  {e.benar === null ? 'Belum dinilai' : e.benar ? 'Benar' : 'Salah'}
                </span>
              </div>
              <p className="whitespace-pre-line font-body text-[13px] leading-[21px] text-aura-muted">{e.jawaban || '(tidak dijawab)'}</p>
              {e.benar === null && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={memproses === `${e.soalId}:${e.siswaId}`}
                    onClick={() => void nilai(e.soalId, e.siswaId, true)}
                    className="inline-flex min-h-10 items-center gap-1 rounded-full bg-sudah-latar px-3 text-[12px] font-semibold text-sudah-teks"
                  >
                    {memproses === `${e.soalId}:${e.siswaId}` ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />} Benar
                  </button>
                  <button
                    type="button"
                    disabled={memproses === `${e.soalId}:${e.siswaId}`}
                    onClick={() => void nilai(e.soalId, e.siswaId, false)}
                    className="inline-flex min-h-10 items-center gap-1 rounded-full bg-belum-latar px-3 text-[12px] font-semibold text-belum-teks"
                  >
                    <X className="size-3" /> Salah
                  </button>
                </div>
              )}
            </div>
          ))}
        </KartuKaca>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Tombol
          varian="utama"
          type="button"
          ikon={ClipboardCheck}
          memuat={memproses === 'rilis'}
          disabled={esaiBelumDinilai > 0 || Boolean(ujian.dirilisPada)}
          onClick={() => void rilis()}
        >
          {ujian.dirilisPada ? 'Hasil sudah dirilis' : 'Rilis hasil ke siswa'}
        </Tombol>
        {esaiBelumDinilai > 0 && <p className="text-[12px] font-medium text-setengah-teks">Nilai semua esai sebelum merilis.</p>}
      </div>
    </div>
  );
}
