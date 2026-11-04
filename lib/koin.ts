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
