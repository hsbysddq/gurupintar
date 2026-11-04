'use client';

import { useId, useState, type FormEvent } from 'react';
import { CalendarClock, Check, Clock3, Loader2, Pencil, X } from 'lucide-react';
import {
  formatJadwal,
  isoKeNilaiLokal,
  ringkasJadwal,
  validasiJadwalIso,
  waktuLokalKeIso,
} from '@/lib/jadwal-kuis';
import { aturJadwalSesi, ErrorApi } from '@/lib/api-klien';

export type NilaiJadwalForm = { buka: string; tutup: string };
export type GalatJadwalForm = { buka?: string; tutup?: string };

export const JADWAL_FORM_KOSONG: NilaiJadwalForm = { buka: '', tutup: '' };

const KELAS_INPUT =
  'h-11 w-full min-w-0 rounded-xl border border-aura-primary/20 bg-white/80 px-3 font-body text-[13px] text-aura-ink shadow-sm outline-none transition-colors focus:border-aura-primary focus:ring-2 focus:ring-aura-primary/15';

function nilaiLokalSekarang(): string {
  return isoKeNilaiLokal(new Date().toISOString());
}

function nilaiLokalDariMenit(menit: number, dasar: string): string {
  const mulai = dasar ? new Date(dasar).getTime() : Date.now();
  const basis = Number.isFinite(mulai) ? Math.max(mulai, Date.now()) : Date.now();
  return isoKeNilaiLokal(new Date(basis + menit * 60_000).toISOString());
}

/**
 * Form jadwal yang dikendalikan induk. Dipakai saat membuat kuis (nilai dikirim bersama simpan soal)
 * dan saat mengubah jadwal sesi yang sudah ada.
 */
export function FormJadwalKuis({
  nilai,
  onUbah,
  galat,
  judul = 'Jadwal kuis',
  deskripsi = 'Kosongkan waktu tutup jika ingin menutup manual. Siswa otomatis berhenti saat waktu tutup lewat.',
}: {
  nilai: NilaiJadwalForm;
  onUbah: (nilai: NilaiJadwalForm) => void;
  galat?: GalatJadwalForm;
  judul?: string;
  deskripsi?: string;
}) {
  const idBuka = useId();
  const idTutup = useId();
  const [minimal] = useState(nilaiLokalSekarang);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-aura-primary/15 bg-aura-primary/[0.035] p-3.5">
      <div className="flex items-start gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-aura-primary/10 text-aura-primary">
          <CalendarClock aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[14px] leading-snug font-bold text-aura-ink">{judul}</p>
          <p className="mt-0.5 font-body text-[12px] leading-[18px] text-aura-muted">{deskripsi}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={idBuka} className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
            Dibuka
          </label>
          <input
            id={idBuka}
            type="datetime-local"
            value={nilai.buka}
            min={minimal}
            aria-invalid={Boolean(galat?.buka)}
            aria-describedby={galat?.buka ? `${idBuka}-galat` : `${idBuka}-bantuan`}
            onChange={(e) => onUbah({ ...nilai, buka: e.target.value })}
            className={KELAS_INPUT}
          />
          <p id={`${idBuka}-bantuan`} className="font-body text-[11px] leading-[16px] text-aura-muted">
            Kosongkan untuk membuka sekarang.
          </p>
          {galat?.buka && (
            <p id={`${idBuka}-galat`} className="font-body text-[11px] leading-[16px] font-medium text-belum-teks">
              {galat.buka}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={idTutup} className="font-display text-[11px] font-bold uppercase tracking-[0.04em] text-aura-muted">
            Tutup otomatis
          </label>
          <input
            id={idTutup}
            type="datetime-local"
            value={nilai.tutup}
            min={nilai.buka || minimal}
            aria-invalid={Boolean(galat?.tutup)}
            aria-describedby={galat?.tutup ? `${idTutup}-galat` : `${idTutup}-bantuan`}
            onChange={(e) => onUbah({ ...nilai, tutup: e.target.value })}
            className={KELAS_INPUT}
          />
          <p id={`${idTutup}-bantuan`} className="font-body text-[11px] leading-[16px] text-aura-muted">
            Kosongkan jika ingin menutup manual.
          </p>
          {galat?.tutup && (
            <p id={`${idTutup}-galat`} className="font-body text-[11px] leading-[16px] font-medium text-belum-teks">
              {galat.tutup}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 inline-flex items-center gap-1 font-body text-[11px] leading-[16px] font-semibold text-aura-muted">
          <Clock3 aria-hidden="true" className="size-3.5" />
          Tutup setelah
        </span>
        {[30, 60, 120].map((menit) => (
          <button
            key={menit}
            type="button"
            onClick={() => onUbah({ ...nilai, tutup: nilaiLokalDariMenit(menit, nilai.buka) })}
            className="inline-flex min-h-8 items-center rounded-full border border-aura-primary/20 bg-white/75 px-2.5 font-display text-[11px] font-semibold text-aura-primary transition-colors hover:bg-aura-primary/10"
          >
            {menit < 60 ? `${menit} menit` : `${menit / 60} jam`}
          </button>
        ))}
        {nilai.tutup && (
          <button
            type="button"
            onClick={() => onUbah({ ...nilai, tutup: '' })}
            className="inline-flex min-h-8 items-center rounded-full px-2 font-display text-[11px] font-semibold text-aura-muted hover:text-aura-ink"
          >
            Hapus batas
          </button>
        )}
      </div>

      {nilai.tutup && !galat?.tutup && (
        <p className="inline-flex items-center gap-1.5 rounded-xl bg-aura-emerald/10 px-2.5 py-2 font-body text-[11px] leading-[16px] font-medium text-[#047857]">
          <Check aria-hidden="true" className="size-3.5 shrink-0" />
          Kuis ditutup otomatis {formatJadwal(waktuLokalKeIso(nilai.tutup))}.
        </p>
      )}
    </div>
  );
}

/** Ringkasan + tombol atur jadwal untuk sesi yang sudah dibuat (panel kuis aktif/terjadwal). */
export function PengaturanJadwalSesi({
  sesiId,
  bukaPada,
  tutupPada,
  onTersimpan,
}: {
  sesiId: string;
  bukaPada: string | null;
  tutupPada: string | null;
  onTersimpan: () => void;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [nilai, setNilai] = useState<NilaiJadwalForm>({
    buka: isoKeNilaiLokal(bukaPada),
    tutup: isoKeNilaiLokal(tutupPada),
  });
  const [galat, setGalat] = useState<GalatJadwalForm>({});
  const [pesan, setPesan] = useState<string | null>(null);
  const [memuat, setMemuat] = useState(false);

  async function simpan(e: FormEvent) {
    e.preventDefault();
    setPesan(null);

    const bukaIso = waktuLokalKeIso(nilai.buka);
    const tutupIso = waktuLokalKeIso(nilai.tutup);
    if (nilai.buka.trim() && !bukaIso) {
      setGalat({ buka: 'Waktu buka belum valid.' });
      return;
    }
    if (nilai.tutup.trim() && !tutupIso) {
      setGalat({ tutup: 'Waktu tutup belum valid.' });
      return;
    }

    const validasi = validasiJadwalIso(bukaIso, tutupIso);
    if (!validasi.ok) {
      setGalat(validasi.kolom === 'bukaPada' ? { buka: validasi.pesan } : { tutup: validasi.pesan });
      return;
    }

    setGalat({});
    setMemuat(true);
    try {
      await aturJadwalSesi({
        sesiId,
        ...(validasi.jadwal.bukaPada ? { bukaPada: validasi.jadwal.bukaPada } : {}),
        tutupPada: validasi.jadwal.tutupPada,
      });
      setTerbuka(false);
      onTersimpan();
    } catch (err) {
      setPesan(err instanceof ErrorApi ? err.message : 'Jadwal belum berhasil disimpan. Coba lagi.');
    } finally {
      setMemuat(false);
    }
  }

  function bukaSekarang() {
    const sekarang = nilaiLokalSekarang();
    setNilai((lama) => ({ ...lama, buka: sekarang, tutup: lama.tutup && lama.tutup <= sekarang ? '' : lama.tutup }));
    setGalat({});
  }

  return (
    <section aria-labelledby="judul-jadwal-sesi" className="aura-glass rounded-[24px] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-aura-primary/10 text-aura-primary">
            <CalendarClock aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 id="judul-jadwal-sesi" className="font-display text-[16px] leading-[24px] font-bold text-aura-ink">
              Jadwal otomatis
            </h2>
            <p className="mt-0.5 font-body text-[13px] leading-[20px] text-aura-muted">
              {ringkasJadwal({ bukaPada, tutupPada })}. Siswa tidak bisa mengerjakan di luar jadwal ini.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setTerbuka((v) => !v);
            setPesan(null);
            setGalat({});
          }}
          className="aura-btn aura-btn-secondary h-10 px-3 text-[12px]"
        >
          {terbuka ? <X aria-hidden="true" className="size-3.5" /> : <Pencil aria-hidden="true" className="size-3.5" />}
          {terbuka ? 'Batal' : 'Atur jadwal'}
        </button>
      </div>

      {terbuka && (
        <form onSubmit={(e) => void simpan(e)} className="mt-4 flex flex-col gap-3" noValidate>
          <FormJadwalKuis
            nilai={nilai}
            onUbah={(baru) => {
              setNilai(baru);
              setGalat({});
            }}
            galat={galat}
            judul="Ubah jadwal"
            deskripsi="Perubahan berlaku langsung. Waktu buka tidak bisa dipindah ke masa depan setelah ada siswa yang mengerjakan."
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={memuat}
              className="aura-btn aura-btn-primary h-11 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {memuat ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Check aria-hidden="true" className="size-4" />}
              Simpan jadwal
            </button>
            <button
              type="button"
              onClick={bukaSekarang}
              disabled={memuat}
              className="aura-btn aura-btn-secondary h-11 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Buka sekarang
            </button>
          </div>
          {pesan && (
            <p role="alert" className="font-body text-[12px] leading-[18px] font-medium text-belum-teks">
              {pesan}
            </p>
          )}
        </form>
      )}

      {!terbuka && pesan && (
        <p role="alert" className="mt-3 font-body text-[12px] leading-[18px] font-medium text-belum-teks">
          {pesan}
        </p>
      )}
    </section>
  );
}
