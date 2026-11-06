// Unduh materi sebagai PPTX atau DOCX. Dibuat di browser (tanpa API tambahan); pustaka dimuat saat dibutuhkan.
import type PptxGenJS from 'pptxgenjs';
import { ambilGayaPpt, type DefinisiGayaPpt } from './gaya-ppt';
import type { IsiMateri } from './tipe';

type SlidePptx = ReturnType<PptxGenJS['addSlide']>;

const HURUF = ['A', 'B', 'C', 'D'] as const;

function simpanBerkas(blob: Blob, nama: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nama;
  a.click();
  URL.revokeObjectURL(url);
}

function namaBerkas(judul: string, ekstensi: string) {
  const dasar = judul.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'materi';
  return `${dasar}.${ekstensi}`;
}

function nomorSlide(indeks: number, total: number) {
  return `${String(indeks + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
}

function potongJudul(judul: string, highlight: string | undefined, gaya: DefinisiGayaPpt) {
  if (!highlight) return judul;
  const posisi = judul.toLowerCase().indexOf(highlight.toLowerCase());
  if (posisi < 0) return judul;
  return [
    { text: judul.slice(0, posisi), options: { color: gaya.teks } },
    {
      text: judul.slice(posisi, posisi + highlight.length),
      options: { color: gaya.aksen, bold: true },
    },
    { text: judul.slice(posisi + highlight.length), options: { color: gaya.teks } },
  ];
}

function tambahGaris(
  slide: SlidePptx,
  ppt: PptxGenJS,
  x: number,
  y: number,
  w: number,
  h: number,
  warna: string,
) {
  slide.addShape(ppt.ShapeType.rect, {
    x,
    y,
    w,
    h,
    fill: { color: warna },
    line: { color: warna, width: 0 },
  });
}

/** `denganLatihan: false` untuk siswa: hanya slide materi, tanpa soal latihan dan kunci jawabannya. */
export async function unduhPptx(isi: IsiMateri, opsi: { denganLatihan?: boolean } = {}) {
  const denganLatihan = opsi.denganLatihan ?? isi.format_utama !== 'ppt';
  const { default: Pptx } = await import('pptxgenjs');
  const ppt = new Pptx();
  ppt.layout = 'LAYOUT_16x9';

  const gaya = ambilGayaPpt(isi.slide_ppt.gaya);
  const total = isi.slide_ppt.slide.length;

  function dasarSlide() {
    const s = ppt.addSlide();
    s.background = { color: gaya.latar };
    return s;
  }

  function footer(s: SlidePptx, indeks: number) {
    tambahGaris(s, ppt, 0.6, 5.05, 8.8, 0.015, gaya.aksen);
    s.addText(isi.slide_ppt.judul, {
      x: 0.6,
      y: 5.1,
      w: 6.6,
      h: 0.25,
      fontFace: gaya.mono,
      fontSize: 8,
      color: gaya.muted,
    });
    s.addText(nomorSlide(indeks, total), {
      x: 7.5,
      y: 5.1,
      w: 1.9,
      h: 0.25,
      fontFace: gaya.mono,
      fontSize: 8,
      color: gaya.muted,
      align: 'right',
    });
  }

  isi.slide_ppt.slide.forEach((slide, indeks) => {
    const s = dasarSlide();
    const jenis = slide.jenis ?? (indeks === 0 ? 'cover' : indeks === total - 1 ? 'penutup' : 'konten');

    if (jenis === 'cover') {
      s.addText(slide.nomor_besar ?? String(indeks + 1).padStart(2, '0'), {
        x: 0.6,
        y: 0.45,
        w: 4,
        h: 1.25,
        fontFace: gaya.font,
        fontSize: 54,
        bold: true,
        color: gaya.aksen,
      });
      s.addText(potongJudul(slide.judul, slide.highlight, gaya), {
        x: 0.6,
        y: 1.75,
        w: 8.8,
        h: 1.3,
        fontFace: gaya.font,
        fontSize: 30,
        bold: true,
        color: gaya.teks,
        valign: 'top',
        fit: 'shrink',
      });
      s.addText(slide.subjudul ?? slide.poin[0], {
        x: 0.6,
        y: 3.15,
        w: 8.8,
        h: 0.6,
        fontFace: gaya.font,
        fontSize: 13,
        color: gaya.muted,
        valign: 'top',
      });
      tambahGaris(s, ppt, 0.6, 4.0, 1.1, 0.035, gaya.aksen);
      footer(s, indeks);
      return;
    }

    if (jenis === 'penutup') {
      s.addText('PENUTUP', {
        x: 0.6,
        y: 1.55,
        w: 8.8,
        h: 0.25,
        fontFace: gaya.mono,
        fontSize: 9,
        bold: true,
        color: gaya.aksen,
        align: 'center',
      });
      s.addText(slide.penutup?.pernyataan ?? slide.judul, {
        x: 1.0,
        y: 1.95,
        w: 8.0,
        h: 1.1,
        fontFace: gaya.font,
        fontSize: 30,
        bold: true,
        color: gaya.teks,
        align: 'center',
        valign: 'top',
        fit: 'shrink',
      });
      tambahGaris(s, ppt, 4.7, 3.25, 0.6, 0.035, gaya.aksen);
      s.addText(slide.penutup?.dukungan ?? slide.subjudul ?? slide.poin[0], {
        x: 1.4,
        y: 3.5,
        w: 7.2,
        h: 0.6,
        fontFace: gaya.font,
        fontSize: 12,
        color: gaya.muted,
        align: 'center',
        valign: 'top',
      });
      s.addText(slide.penutup?.cta ?? 'Simpan untuk dipelajari lagi', {
        x: 3.3,
        y: 4.2,
        w: 3.4,
        h: 0.42,
        fontFace: gaya.mono,
        fontSize: 10,
        bold: true,
        color: gaya.aksenTeks,
        fill: { color: gaya.aksen },
        align: 'center',
        valign: 'middle',
      });
      footer(s, indeks);
      return;
    }

    s.addText(jenis === 'konten' ? 'MATERI' : jenis.toUpperCase(), {
      x: 0.6,
      y: 0.35,
      w: 6,
      h: 0.22,
      fontFace: gaya.mono,
      fontSize: 8,
      bold: true,
      color: gaya.aksen,
    });
    s.addText(potongJudul(slide.judul, slide.highlight, gaya), {
      x: 0.6,
      y: 0.65,
      w: 8.8,
      h: 0.7,
      fontFace: gaya.font,
      fontSize: 24,
      bold: true,
      color: gaya.teks,
      valign: 'top',
      fit: 'shrink',
    });
    if (slide.subjudul) {
      s.addText(slide.subjudul, {
        x: 0.6,
        y: 1.35,
        w: 8.8,
        h: 0.4,
        fontFace: gaya.font,
        fontSize: 11,
        color: gaya.muted,
        valign: 'top',
      });
    }

    const mulai = slide.subjudul ? 1.9 : 1.55;

    if (jenis === 'kode' && slide.kode) {
      s.addText(slide.kode, {
        x: 0.6,
        y: mulai,
        w: 8.8,
        h: 2.55,
        fontFace: gaya.mono,
        fontSize: 10,
        color: gaya.aksen,
        fill: { color: '1A1A1A' },
        valign: 'top',
        margin: 8,
      });
    } else if (jenis === 'banding' && slide.banding) {
      s.addText('KURANG TEPAT', {
        x: 0.6,
        y: mulai,
        w: 4.2,
        h: 0.25,
        fontFace: gaya.mono,
        fontSize: 8,
        bold: true,
        color: 'B45309',
      });
      s.addText(slide.banding.buruk, {
        x: 0.6,
        y: mulai + 0.28,
        w: 4.2,
        h: 1.55,
        fontFace: gaya.font,
        fontSize: 10,
        color: '4A2A0A',
        fill: { color: 'F4E3D3' },
        valign: 'top',
        margin: 6,
      });
      s.addText('LEBIH TEPAT', {
        x: 5.1,
        y: mulai,
        w: 4.2,
        h: 0.25,
        fontFace: gaya.mono,
        fontSize: 8,
        bold: true,
        color: '2F7D4A',
      });
      s.addText(slide.banding.baik, {
        x: 5.1,
        y: mulai + 0.28,
        w: 4.2,
        h: 1.55,
        fontFace: gaya.font,
        fontSize: 10,
        color: '173A22',
        fill: { color: 'E7F3E8' },
        valign: 'top',
        margin: 6,
      });
    } else if (jenis === 'opsi' && slide.opsi) {
      slide.opsi.forEach((opsi, i) => {
        const y = mulai + i * 0.72;
        s.addText(opsi.nama, {
          x: 0.6,
          y,
          w: 8.8,
          h: 0.26,
          fontFace: gaya.font,
          fontSize: 11,
          bold: true,
          color: gaya.aksen,
          fill: { color: gaya.kertas },
          margin: 4,
        });
        s.addText(opsi.deskripsi, {
          x: 0.6,
          y: y + 0.24,
          w: 8.8,
          h: 0.3,
          fontFace: gaya.font,
          fontSize: 9,
          color: gaya.muted,
          fill: { color: gaya.kertas },
          margin: 4,
        });
      });
    } else if (jenis === 'langkah' && slide.langkah) {
      slide.langkah.forEach((langkah, i) => {
        s.addText(String(i + 1).padStart(2, '0'), {
          x: 0.6,
          y: mulai + i * 0.48,
          w: 0.5,
          h: 0.3,
          fontFace: gaya.mono,
          fontSize: 12,
          bold: true,
          color: gaya.aksen,
        });
        s.addText(langkah, {
          x: 1.2,
          y: mulai + i * 0.48,
          w: 8.2,
          h: 0.32,
          fontFace: gaya.font,
          fontSize: 10,
          color: gaya.teks,
          valign: 'top',
        });
      });
    } else if (jenis === 'kutipan' && slide.kutipan) {
      tambahGaris(s, ppt, 0.6, mulai, 0.035, 1.25, gaya.aksen);
      s.addText(`“${slide.kutipan}”`, {
        x: 0.85,
        y: mulai,
        w: 8.55,
        h: 1.25,
        fontFace: gaya.font,
        fontSize: 13,
        italic: true,
        color: gaya.teks,
        valign: 'top',
      });
    } else {
      s.addText(
        slide.poin.map((poin) => ({ text: poin, options: { bullet: true, breakLine: true } })),
        {
          x: 0.6,
          y: mulai,
          w: 8.8,
          h: 2.75,
          fontFace: gaya.font,
          fontSize: 12,
          color: gaya.teks,
          valign: 'top',
          fit: 'shrink',
          paraSpaceAfter: 8,
        },
      );
    }

    footer(s, indeks);
  });

  (denganLatihan ? isi.latihan : []).forEach((soal, i) => {
    const s = dasarSlide();
    s.addText(`Latihan ${i + 1}`, {
      x: 0.6,
      y: 0.4,
      w: 8.8,
      h: 0.5,
      fontFace: gaya.font,
      fontSize: 24,
      bold: true,
      color: gaya.aksen,
    });
    s.addText(soal.soal, {
      x: 0.6,
      y: 1.05,
      w: 8.8,
      h: 1.0,
      fontFace: gaya.font,
      fontSize: 14,
      bold: true,
      color: gaya.teks,
      valign: 'top',
    });
    s.addText(
      soal.pilihan.map((p, j) => ({ text: `${HURUF[j]}. ${p}`, options: { breakLine: true } })),
      {
        x: 0.6,
        y: 2.2,
        w: 8.8,
        h: 2.2,
        fontFace: gaya.font,
        fontSize: 11,
        color: gaya.teks,
        valign: 'top',
      },
    );
    s.addText(`${i + 1} / ${isi.latihan.length}`, {
      x: 7.5,
      y: 5.1,
      w: 1.9,
      h: 0.25,
      fontFace: gaya.mono,
      fontSize: 8,
      color: gaya.muted,
      align: 'right',
    });

    const kunci = dasarSlide();
    const indeksKunci = HURUF.indexOf(soal.kunci);
    kunci.addText(`Pembahasan ${i + 1}`, {
      x: 0.6,
      y: 0.4,
      w: 8.8,
      h: 0.5,
      fontFace: gaya.font,
      fontSize: 24,
      bold: true,
      color: '2F7D4A',
    });
    kunci.addText(`Jawaban: ${soal.pilihan[indeksKunci]}`, {
      x: 0.6,
      y: 1.1,
      w: 8.8,
      h: 0.5,
      fontFace: gaya.font,
      fontSize: 14,
      bold: true,
      color: gaya.teks,
    });
    kunci.addText(soal.pembahasan, {
      x: 0.6,
      y: 1.8,
      w: 8.8,
      h: 2.6,
      fontFace: gaya.font,
      fontSize: 11,
      color: gaya.teks,
      valign: 'top',
    });
  });

  const hasil = (await ppt.write({ outputType: 'blob' })) as Blob;
  simpanBerkas(hasil, namaBerkas(isi.judul, 'pptx'));
}

export async function unduhDocx(isi: IsiMateri) {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import('docx');
  const p = (teks: string) => new Paragraph({ children: [new TextRun(teks)], spacing: { after: 120 } });
  const h = (teks: string) => new Paragraph({ text: teks, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });

  const anak = [
    new Paragraph({ text: isi.judul, heading: HeadingLevel.TITLE }),
    h('Ringkasan'),
    p(isi.ringkasan),
    h('Naskah audio'),
    p(isi.naskah_audio),
    h('Ide video'),
    new Paragraph({ children: [new TextRun({ text: isi.ide_video.judul, bold: true })], spacing: { after: 120 } }),
    p(isi.ide_video.deskripsi),
    p(`Kata kunci pencarian: ${isi.ide_video.kata_kunci_pencarian}`),
    h('Kerangka slide PPT'),
    ...isi.slide_ppt.slide.flatMap((slide, i) => [
      new Paragraph({ children: [new TextRun({ text: `Slide ${i + 1}: ${slide.judul}`, bold: true })], spacing: { before: 120, after: 60 } }),
      ...slide.poin.map((poin) => p(`• ${poin}`)),
    ]),
    h('Latihan'),
    ...isi.latihan.flatMap((soal, i) => [
      new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${soal.soal}`, bold: true })], spacing: { before: 160, after: 80 } }),
      ...soal.pilihan.map((pil, j) => p(`${HURUF[j]}. ${pil}`)),
    ]),
    h('Kunci dan pembahasan'),
    ...isi.latihan.map((soal, i) => p(`${i + 1}. Jawaban: ${soal.pilihan[HURUF.indexOf(soal.kunci)]}. ${soal.pembahasan}`)),
  ];

  const blob = await Packer.toBlob(new Document({ sections: [{ children: anak }] }));
  simpanBerkas(blob, namaBerkas(isi.judul, 'docx'));
}
