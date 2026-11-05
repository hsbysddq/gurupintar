/** Nomor WhatsApp Indonesia dinormalkan ke format internasional tanpa tanda plus. */
export function normalisasiNomorWhatsapp(nilai: string | null | undefined): string | null {
  const digit = (nilai ?? '').replace(/\D/g, '');
  if (!digit) return null;
  if (digit.startsWith('0')) return `62${digit.slice(1)}`;
  if (digit.startsWith('8')) return `62${digit}`;
  return digit;
}

/** Tautan chat admin untuk top up koin. Null jika nomor admin belum diatur. */
export function tautanTopUpKoin(
  nomorAdmin: string | null | undefined,
  saldo: number | null,
): string | null {
  const nomor = normalisasiNomorWhatsapp(nomorAdmin);
  if (!nomor) return null;
  const pesan = `Halo admin Guru Pintarku, saya ingin top up koin untuk fitur Ubah Modul. Saldo saya saat ini ${saldo ?? 0} koin.`;
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
}

export interface HariGrafikKoin {
  kunci: string;
  label: string;
  keluar: number;
  masuk: number;
}

const ZONA_WAKTU = 'Asia/Jakarta';
const FORMAT_KUNCI_HARI = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_WAKTU,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const FORMAT_LABEL_HARI = new Intl.DateTimeFormat('id-ID', {
  timeZone: ZONA_WAKTU,
  weekday: 'short',
});

function kunciHari(waktu: Date): string {
  const bagian = FORMAT_KUNCI_HARI.formatToParts(waktu);
  const ambil = (jenis: Intl.DateTimeFormatPartTypes) =>
    bagian.find((item) => item.type === jenis)?.value ?? '';
  return `${ambil('year')}-${ambil('month')}-${ambil('day')}`;
}

/** Aktivitas koin per hari untuk grafik 7 hari terakhir, mengikuti zona waktu Jakarta. */
export function susunGrafikKoin(
  transaksi: readonly { jumlah: number; dibuatPada: string }[],
  sekarang: Date = new Date(),
  jumlahHari = 7,
): HariGrafikKoin[] {
  const hasil: HariGrafikKoin[] = [];
  const peta = new Map<string, HariGrafikKoin>();

  for (let i = jumlahHari - 1; i >= 0; i--) {
    const tanggal = new Date(sekarang.getTime() - i * 86_400_000);
    const hari: HariGrafikKoin = {
      kunci: kunciHari(tanggal),
      label: FORMAT_LABEL_HARI.format(tanggal),
      keluar: 0,
      masuk: 0,
    };
    hasil.push(hari);
    peta.set(hari.kunci, hari);
  }

  for (const item of transaksi) {
    const waktu = new Date(item.dibuatPada);
    if (Number.isNaN(waktu.getTime())) continue;
    const hari = peta.get(kunciHari(waktu));
    if (!hari) continue;
    if (item.jumlah < 0) hari.keluar += Math.abs(item.jumlah);
    else hari.masuk += item.jumlah;
  }

  return hasil;
}
