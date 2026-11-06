import { ambilGayaBacaan } from './gaya-bacaan';
import type { IsiMateri } from './tipe';

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 52;
const LEBAR = A4.width - MARGIN * 2;
const ATAS = A4.height - MARGIN;
const BAWAH = 64;

type Font = import('pdf-lib').PDFFont;
type Page = import('pdf-lib').PDFPage;
type Warna = import('pdf-lib').RGB;

type Konteks = { page: Page; y: number };

function namaBerkas(judul: string): string {
  const slug = judul
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'ebook'}.pdf`;
}

function bersihkan(teks: string): string {
  return teks
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x20-\x7E\n\u00A0-\u00FF]/g, '');
}

function bungkus(teks: string, font: Font, ukuran: number, lebar: number): string[] {
  const hasil: string[] = [];
  for (const paragraf of bersihkan(teks).split('\n')) {
    const kata = paragraf.trim().split(/\s+/).filter(Boolean);
    let baris = '';
    for (const bagian of kata) {
      const coba = baris ? `${baris} ${bagian}` : bagian;
      if (!baris || font.widthOfTextAtSize(coba, ukuran) <= lebar) {
        baris = coba;
      } else {
        hasil.push(baris);
        baris = bagian;
      }
    }
    if (baris) hasil.push(baris);
  }
  return hasil.length > 0 ? hasil : [' '];
}

export async function buatPdfBacaan(isi: IsiMateri): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const gaya = ambilGayaBacaan(isi.gaya_bacaan);
  const doc = await PDFDocument.create();
  const fontIsi = await doc.embedFont(
    gaya.fontPdf === 'Times-Roman' ? StandardFonts.TimesRoman : StandardFonts.Helvetica,
  );
  const fontJudul = await doc.embedFont(
    gaya.fontPdf === 'Times-Roman' ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold,
  );
  const fontKecil = await doc.embedFont(StandardFonts.Helvetica);
  const warna = (hex: string): Warna => {
    const bersih = hex.replace('#', '');
    return rgb(
      Number.parseInt(bersih.slice(0, 2), 16) / 255,
      Number.parseInt(bersih.slice(2, 4), 16) / 255,
      Number.parseInt(bersih.slice(4, 6), 16) / 255,
    );
  };
  const warnaTeks = warna(gaya.teks);
  const warnaMuted = warna(gaya.muted);
  const warnaAksen = warna(gaya.aksen);
  const warnaKertas = warna(gaya.kertas);
  const warnaLatar = warna(gaya.latar);
  const warnaKotak = warnaLatar;
  const halamanKonten: Page[] = [];

  function halamanBaru(): Page {
    const page = doc.addPage([A4.width, A4.height]);
    page.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: warnaLatar });
    halamanKonten.push(page);
    return page;
  }

  function pastikanRuang(ctx: Konteks, tinggi: number): void {
    if (ctx.y - tinggi < BAWAH) {
      ctx.page = halamanBaru();
      ctx.y = ATAS;
    }
  }

  function tulis(
    ctx: Konteks,
    teks: string,
    opsi: { font: Font; ukuran: number; warna: Warna; lineHeight?: number; lebar?: number; x?: number },
  ): void {
    const lineHeight = opsi.lineHeight ?? opsi.ukuran * 1.55;
    const x = opsi.x ?? MARGIN;
    const lebar = opsi.lebar ?? LEBAR;
    for (const baris of bungkus(teks, opsi.font, opsi.ukuran, lebar)) {
      pastikanRuang(ctx, lineHeight);
      ctx.page.drawText(baris, { x, y: ctx.y - opsi.ukuran, size: opsi.ukuran, font: opsi.font, color: opsi.warna });
      ctx.y -= lineHeight;
    }
  }

  function kotak(
    ctx: Konteks,
    judul: string,
    isiTeks: string,
    warnaJudul: Warna,
    warnaKotak: Warna,
  ): void {
    const ukuran = 10.5;
    const lineHeight = 16;
    const padding = 12;
    const baris = bungkus(isiTeks, fontIsi, ukuran, LEBAR - padding * 2);
    const tinggi = padding * 2 + 18 + baris.length * lineHeight;
    pastikanRuang(ctx, tinggi + 8);
    const atas = ctx.y;
    ctx.page.drawRectangle({
      x: MARGIN,
      y: atas - tinggi,
      width: LEBAR,
      height: tinggi,
      color: warnaKotak,
      opacity: 0.65,
    });
    ctx.page.drawRectangle({
      x: MARGIN,
      y: atas - tinggi,
      width: 3,
      height: tinggi,
      color: warnaJudul,
    });
    ctx.page.drawText(bersihkan(judul), {
      x: MARGIN + padding,
      y: atas - padding - 10,
      size: 8,
      font: fontKecil,
      color: warnaJudul,
    });
    let y = atas - padding - 23;
    for (const bagian of baris) {
      ctx.page.drawText(bagian, {
        x: MARGIN + padding,
        y,
        size: ukuran,
        font: fontIsi,
        color: warnaTeks,
      });
      y -= lineHeight;
    }
    ctx.y = atas - tinggi - 10;
  }

  // Sampul
  const sampul = doc.addPage([A4.width, A4.height]);
  sampul.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: warnaLatar });
  sampul.drawCircle({
    x: A4.width - 92,
    y: A4.height - 108,
    size: 118,
    color: warnaAksen,
    opacity: 0.12,
  });
  sampul.drawRectangle({
    x: A4.width - 190,
    y: A4.height - 225,
    width: 140,
    height: 96,
    color: warnaKertas,
    borderColor: warnaAksen,
    borderWidth: 1.5,
  });
  sampul.drawLine({
    start: { x: A4.width - 120, y: A4.height - 135 },
    end: { x: A4.width - 120, y: A4.height - 215 },
    thickness: 1,
    color: warnaAksen,
    opacity: 0.5,
  });
  for (let i = 0; i < 3; i += 1) {
    sampul.drawLine({
      start: { x: A4.width - 180, y: A4.height - 160 - i * 17 },
      end: { x: A4.width - 130, y: A4.height - 160 - i * 17 },
      thickness: 1,
      color: warnaAksen,
      opacity: 0.3,
    });
    sampul.drawLine({
      start: { x: A4.width - 110, y: A4.height - 160 - i * 17 },
      end: { x: A4.width - 60, y: A4.height - 160 - i * 17 },
      thickness: 1,
      color: warnaAksen,
      opacity: 0.3,
    });
  }

  let ySampul = ATAS - 12;
  sampul.drawRectangle({
    x: MARGIN,
    y: ySampul - 18,
    width: 74,
    height: 22,
    color: warnaAksen,
  });
  sampul.drawText('E-BOOK', {
    x: MARGIN + 11,
    y: ySampul - 12,
    size: 8,
    font: fontKecil,
    color: warnaKertas,
  });
  ySampul -= 62;

  const judul = isi.bacaan?.judul ?? isi.judul;
  for (const baris of bungkus(judul, fontJudul, 30, LEBAR - 180)) {
    sampul.drawText(baris, { x: MARGIN, y: ySampul, size: 30, font: fontJudul, color: warnaTeks });
    ySampul -= 37;
  }
  if (isi.bacaan?.subjudul) {
    ySampul -= 8;
    for (const baris of bungkus(isi.bacaan.subjudul, fontIsi, 13, LEBAR - 180)) {
      sampul.drawText(baris, { x: MARGIN, y: ySampul, size: 13, font: fontIsi, color: warnaMuted });
      ySampul -= 20;
    }
  }

  const totalKata = isi.bacaan?.bab.flatMap((bab) => bab.paragraf).join(' ').split(/\s+/).filter(Boolean).length ?? 0;
  const menit = Math.max(1, Math.ceil(totalKata / 150));
  ySampul -= 22;
  sampul.drawText(`${isi.bacaan?.bab.length ?? 0} bab  ·  ± ${menit} menit baca  ·  ${totalKata} kata`, {
    x: MARGIN,
    y: ySampul,
    size: 10,
    font: fontKecil,
    color: warnaMuted,
  });
  sampul.drawText(`Gaya ${gaya.kode} - ${gaya.nama}`, {
    x: MARGIN,
    y: ySampul - 18,
    size: 9,
    font: fontKecil,
    color: warnaAksen,
  });
  sampul.drawText('Guru Pintarku', {
    x: MARGIN,
    y: MARGIN - 12,
    size: 9,
    font: fontKecil,
    color: warnaMuted,
  });

  if (!isi.bacaan) {
    const ctx: Konteks = { page: halamanBaru(), y: ATAS };
    tulis(ctx, 'Ringkasan', { font: fontJudul, ukuran: 24, warna: warnaTeks });
    ctx.y -= 8;
    tulis(ctx, isi.ringkasan, { font: fontIsi, ukuran: 12, warna: warnaTeks });
    return doc.save();
  }

  // Daftar isi
  const isiKonteks: Konteks = { page: halamanBaru(), y: ATAS };
  tulis(isiKonteks, 'Daftar Isi', { font: fontJudul, ukuran: 26, warna: warnaTeks });
  isiKonteks.y -= 12;
  isiKonteks.page.drawLine({
    start: { x: MARGIN, y: isiKonteks.y },
    end: { x: MARGIN + 56, y: isiKonteks.y },
    thickness: 2,
    color: warnaAksen,
  });
  isiKonteks.y -= 22;
  isi.bacaan.bab.forEach((bab, i) => {
    pastikanRuang(isiKonteks, 42);
    isiKonteks.page.drawText(String(i + 1).padStart(2, '0'), {
      x: MARGIN,
      y: isiKonteks.y - 10,
      size: 9,
      font: fontKecil,
      color: warnaAksen,
    });
    tulis(isiKonteks, bab.judul, {
      font: fontJudul,
      ukuran: 13,
      warna: warnaTeks,
      lineHeight: 18,
      x: MARGIN + 30,
      lebar: LEBAR - 30,
    });
    isiKonteks.y -= 8;
  });

  // Bab
  isi.bacaan.bab.forEach((bab, i) => {
    const ctx: Konteks = { page: halamanBaru(), y: ATAS };
    ctx.page.drawText(`BAB ${String(i + 1).padStart(2, '0')}`, {
      x: MARGIN,
      y: ctx.y - 9,
      size: 9,
      font: fontKecil,
      color: warnaAksen,
    });
    ctx.y -= 28;
    tulis(ctx, bab.judul, { font: fontJudul, ukuran: 23, warna: warnaTeks, lineHeight: 29 });
    ctx.y -= 5;
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y },
      end: { x: MARGIN + 48, y: ctx.y },
      thickness: 2,
      color: warnaAksen,
    });
    ctx.y -= 18;

    for (const paragraf of bab.paragraf) {
      tulis(ctx, paragraf, { font: fontIsi, ukuran: 11.5, warna: warnaTeks, lineHeight: 19 });
      ctx.y -= 8;
    }

    if (bab.poin && bab.poin.length > 0) {
      kotak(ctx, 'POIN PENTING', bab.poin.map((poin) => `- ${poin}`).join('\n'), warnaAksen, warnaKotak);
    }
    if (bab.contoh) {
      kotak(ctx, 'CONTOH', bab.contoh, warnaAksen, warnaKotak);
    }
  });

  // Nomor halaman
  halamanKonten.forEach((page, i) => {
    page.drawLine({
      start: { x: MARGIN, y: 42 },
      end: { x: A4.width - MARGIN, y: 42 },
      thickness: 0.5,
      color: warnaMuted,
      opacity: 0.25,
    });
    page.drawText('Guru Pintarku', {
      x: MARGIN,
      y: 28,
      size: 8,
      font: fontKecil,
      color: warnaMuted,
    });
    page.drawText(String(i + 1), {
      x: A4.width - MARGIN - fontKecil.widthOfTextAtSize(String(i + 1), 8),
      y: 28,
      size: 8,
      font: fontKecil,
      color: warnaMuted,
    });
  });

  doc.setTitle(judul);
  doc.setAuthor('Guru Pintarku');
  return doc.save();
}

export async function unduhPdfBacaan(isi: IsiMateri): Promise<void> {
  const bytes = await buatPdfBacaan(isi);
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const tautan = document.createElement('a');
  tautan.href = url;
  tautan.download = namaBerkas(isi.bacaan?.judul ?? isi.judul);
  tautan.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
