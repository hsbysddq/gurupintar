'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldAlert, TriangleAlert } from 'lucide-react';
import { Lapisan } from '@/components/PemantauKuis';
import { laporPelanggaranUjian } from '@/lib/api-klien';

export function PemantauUjian({ ujianId, onTerblokir }: { ujianId: string; onTerblokir: () => void }) {
  const [peringatan, setPeringatan] = useState<string | null>(null);
  const [diblokir, setDiblokir] = useState(false);
  const terakhir = useRef(0);

  useEffect(() => {
    let aktif = true;

    function lapor(jenis: 'pindah_tab' | 'keluar_fullscreen' | 'copy' | 'paste' | 'menu_klik_kanan') {
      const sekarang = Date.now();
      if (sekarang - terakhir.current < 800) return;
      terakhir.current = sekarang;
      laporPelanggaranUjian({ ujianId, jenis })
        .then((hasil) => {
          if (!aktif) return;
          if (hasil.terblokir) {
            setDiblokir(true);
            onTerblokir();
          } else {
            setPeringatan(`Indikasi kecurangan ${hasil.jumlah} dari 3. Jangan meninggalkan halaman ujian.`);
          }
        })
        .catch(() => {});
    }

    function visibilitas() {
      if (document.visibilityState === 'hidden') lapor('pindah_tab');
    }
    function layar() {
      if (!document.fullscreenElement) lapor('keluar_fullscreen');
    }
    function salin() {
      lapor('copy');
    }
    function tempel() {
      lapor('paste');
    }
    function klikKanan(e: MouseEvent) {
      e.preventDefault();
      lapor('menu_klik_kanan');
    }

    document.addEventListener('visibilitychange', visibilitas);
    document.addEventListener('fullscreenchange', layar);
    document.addEventListener('copy', salin);
    document.addEventListener('paste', tempel);
    document.addEventListener('contextmenu', klikKanan);
    return () => {
      aktif = false;
      document.removeEventListener('visibilitychange', visibilitas);
      document.removeEventListener('fullscreenchange', layar);
      document.removeEventListener('copy', salin);
      document.removeEventListener('paste', tempel);
      document.removeEventListener('contextmenu', klikKanan);
    };
  }, [ujianId, onTerblokir]);

  if (diblokir) {
    return (
      <Lapisan>
        <div role="alertdialog" aria-modal="true" className="flex flex-col gap-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-belum-latar text-belum-teks">
            <ShieldAlert aria-hidden="true" className="size-6" />
          </span>
          <h2 className="font-display text-[22px] leading-snug font-extrabold text-aura-ink">Ujian diblokir</h2>
          <p className="text-aura-muted">
            Kamu meninggalkan halaman ujian tiga kali. Ujian dihentikan sementara. Hubungi admin sekolah untuk membuka blokir.
          </p>
        </div>
      </Lapisan>
    );
  }

  if (!peringatan) return null;

  return (
    <Lapisan>
      <div role="alertdialog" aria-modal="true" className="flex flex-col gap-4">
        <span className="flex size-12 items-center justify-center rounded-full bg-setengah-latar text-setengah-teks">
          <TriangleAlert aria-hidden="true" className="size-6" />
        </span>
        <h2 className="font-display text-[22px] leading-snug font-extrabold text-aura-ink">Jangan tinggalkan halaman ujian</h2>
        <p className="text-aura-muted">{peringatan}</p>
        <button type="button" onClick={() => setPeringatan(null)} className="aura-btn aura-btn-primary min-h-12 px-5">
          Kembali ke ujian
        </button>
      </div>
    </Lapisan>
  );
}
