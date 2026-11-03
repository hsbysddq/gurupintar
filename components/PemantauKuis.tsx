"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, ShieldAlert, TriangleAlert } from "lucide-react";
import { Tombol } from "@/components/Tombol";
import { ambilSoal, ErrorApi, laporPelanggaran } from "@/lib/api-klien";
import {
  BATAS_PELANGGARAN,
  CATATAN_KOSONG,
  catatPelanggaran,
  kunciPenyimpanan,
  pesanPeringatan,
  terblokir,
  uraiCatatan,
  type CatatanPelanggaran,
} from "@/lib/deteksi-curang";

function bacaTersimpan(sesiId: string): CatatanPelanggaran {
  try {
    return uraiCatatan(sessionStorage.getItem(kunciPenyimpanan(sesiId)));
  } catch {
    return CATATAN_KOSONG;
  }
}

function simpan(sesiId: string, catatan: CatatanPelanggaran) {
  try {
    sessionStorage.setItem(kunciPenyimpanan(sesiId), JSON.stringify(catatan));
  } catch {
    // Penyimpanan tidak tersedia: hitungan tetap berjalan selama halaman terbuka.
  }
}

/** Dipanggil setelah jawaban terkirim supaya pengerjaan ulang mulai dari nol. */
export function hapusCatatanPelanggaran(sesiId: string) {
  try {
    sessionStorage.removeItem(kunciPenyimpanan(sesiId));
  } catch {
    // Tidak ada yang perlu dihapus.
  }
}

/**
 * Dipanggil saat soal berhasil dimuat: server hanya melayani siswa yang tidak terblokir, jadi blokir yang masih
 * tersimpan di browser berarti guru sudah membukanya dan hitungan kembali ke nol.
 */
export function lepasBlokirLokal(sesiId: string) {
  if (terblokir(bacaTersimpan(sesiId))) hapusCatatanPelanggaran(sesiId);
}

/**
 * Layar blokir: siswa menunggu guru membuka. Tombol "Cek lagi" memuat soal; berhasil berarti blokir sudah dibuka.
 */
export function LayarDiblokir({
  jumlah = BATAS_PELANGGARAN,
  onCek,
  mengecek,
  pesanCek,
}: {
  jumlah?: number;
  onCek: () => void;
  mengecek: boolean;
  pesanCek: string | null;
}) {
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="judul-blokir" aria-describedby="isi-blokir" className="flex flex-col gap-4">
      <span className="flex size-12 items-center justify-center rounded-full bg-belum-latar text-belum-teks">
        <ShieldAlert aria-hidden="true" className="size-6" />
      </span>
      <h2 id="judul-blokir" className="font-display text-[22px] leading-snug font-extrabold text-aura-ink">
        Kuis diblokir karena curang
      </h2>
      <p id="isi-blokir" className="text-aura-muted">
        Kamu meninggalkan halaman kuis sebanyak {jumlah} kali, jadi kuis ini dihentikan. Kamu tidak bisa mengerjakan
        lagi sampai gurumu membuka blokirnya. Beri tahu gurumu, lalu tekan &ldquo;Cek lagi&rdquo;.
      </p>
      {pesanCek && (
        <p role="status" className="text-[13px] leading-normal font-medium text-belum-teks">
          {pesanCek}
        </p>
      )}
      <button
        type="button"
        onClick={onCek}
        disabled={mengecek}
        aria-busy={mengecek || undefined}
        className="aura-btn aura-btn-primary inline-flex min-h-13 w-full items-center justify-center gap-2 px-6 disabled:opacity-60"
      >
        {mengecek && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        Cek lagi
      </button>
      <Tombol varian="sekunder" ukuran="besar" lebarPenuh href="/siswa">
        Ke dasbor
      </Tombol>
    </div>
  );
}

/** Pesan hasil "Cek lagi": 423 berarti guru belum membuka blokir. */
export async function cekBlokirDibuka(sesiId: string): Promise<{ dibuka: boolean; pesan: string | null }> {
  try {
    await ambilSoal(sesiId);
    return { dibuka: true, pesan: null };
  } catch (err) {
    if (err instanceof ErrorApi && err.status === 423) return { dibuka: false, pesan: "Gurumu belum membuka blokir." };
    return { dibuka: false, pesan: err instanceof ErrorApi ? err.message : "Belum bisa dicek. Coba lagi sebentar." };
  }
}

/**
 * Memantau apakah siswa meninggalkan halaman kuis (pindah tab, buka aplikasi lain, keluar dari browser).
 * Tiap pelanggaran dilaporkan ke server. Pelanggaran pertama dan kedua memunculkan peringatan; pada batas, server
 * memblokir siswa dan layar blokir muncul sampai guru membukanya.
 * Hanya dirender setelah soal tampil, jadi aman membaca sessionStorage saat inisialisasi.
 */
export function PemantauKuis({ sesiId }: { sesiId: string }) {
  const [catatan, setCatatan] = useState<CatatanPelanggaran>(() => bacaTersimpan(sesiId));
  const [peringatan, setPeringatan] = useState(false);
  const [mengecek, setMengecek] = useState(false);
  const [pesanCek, setPesanCek] = useState<string | null>(null);
  const terbaru = useRef(catatan);
  const tombolKembali = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function blokirDariServer() {
      const baru = { jumlah: BATAS_PELANGGARAN, terakhirPada: Date.now() };
      terbaru.current = baru;
      simpan(sesiId, baru);
      setCatatan(baru);
    }
    function lapor() {
      const hasil = catatPelanggaran(terbaru.current, Date.now());
      if (!hasil.dicatat) return;
      terbaru.current = hasil.catatan;
      simpan(sesiId, hasil.catatan);
      setCatatan(hasil.catatan);
      setPeringatan(true);
      // Server yang memutuskan blokir; kegagalan jaringan tidak membatalkan hitungan di browser.
      laporPelanggaran(sesiId)
        .then((res) => {
          if (res.terblokir) blokirDariServer();
        })
        .catch(() => {});
    }
    function saatVisibilitasBerubah() {
      if (document.visibilityState === "hidden") lapor();
    }
    document.addEventListener("visibilitychange", saatVisibilitasBerubah);
    window.addEventListener("blur", lapor);
    return () => {
      document.removeEventListener("visibilitychange", saatVisibilitasBerubah);
      window.removeEventListener("blur", lapor);
    };
  }, [sesiId]);

  const diblokir = terblokir(catatan);

  useEffect(() => {
    if (peringatan && !diblokir) tombolKembali.current?.focus();
  }, [peringatan, diblokir]);

  async function cek() {
    setMengecek(true);
    setPesanCek(null);
    const hasil = await cekBlokirDibuka(sesiId);
    setMengecek(false);
    if (hasil.dibuka) {
      hapusCatatanPelanggaran(sesiId);
      terbaru.current = CATATAN_KOSONG;
      setCatatan(CATATAN_KOSONG);
      setPeringatan(false);
    } else {
      setPesanCek(hasil.pesan);
    }
  }

  if (diblokir) {
    return (
      <Lapisan>
        <LayarDiblokir jumlah={catatan.jumlah} onCek={() => void cek()} mengecek={mengecek} pesanCek={pesanCek} />
      </Lapisan>
    );
  }

  if (!peringatan) return null;

  return (
    <Lapisan>
      <div role="alertdialog" aria-modal="true" aria-labelledby="judul-peringatan" aria-describedby="isi-peringatan" className="flex flex-col gap-4">
        <span className="flex size-12 items-center justify-center rounded-full bg-setengah-latar text-setengah-teks">
          <TriangleAlert aria-hidden="true" className="size-6" />
        </span>
        <h2 id="judul-peringatan" className="font-display text-[22px] leading-snug font-extrabold text-aura-ink">
          Jangan tinggalkan halaman kuis
        </h2>
        <p id="isi-peringatan" className="text-aura-muted">
          {pesanPeringatan(catatan)}
        </p>
        <button
          ref={tombolKembali}
          type="button"
          onClick={() => setPeringatan(false)}
          className="aura-btn aura-btn-primary min-h-13 w-full px-6"
        >
          Kembali ke kuis
        </button>
      </div>
    </Lapisan>
  );
}

export function Lapisan({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-ink/60 p-4 backdrop-blur-sm">
      <div className="aura-glass w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-xl">{children}</div>
    </div>
  );
}
