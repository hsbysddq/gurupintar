// Unduh materi sebagai PPTX atau DOCX. Dibuat di browser (tanpa API tambahan); pustaka dimuat saat dibutuhkan.
import type { IsiMateri } from './tipe';

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

/** `denganLatihan: false` untuk siswa: hanya slide materi, tanpa soal latihan dan kunci jawabannya. */
export async function unduhPptx(isi: IsiMateri, opsi: { denganLatihan?: boolean } = {}) {
  const denganLatihan = opsi.denganLatihan ?? true;
  const { default: Pptx } = await import('pptxgenjs');
  const ppt = new Pptx();
  ppt.layout = 'LAYOUT_16x9';

  const judul = ppt.addSlide();
  judul.addText(isi.slide_ppt.judul, { x: 0.7, y: 1.8, w: 8.6, h: 1.4, fontSize: 36, bold: true, color: '1F2937' });
  judul.addText('Materi belajar matematika kelas 7', { x: 0.7, y: 3.3, w: 8.6, h: 0.6, fontSize: 18, color: '6B7280' });

  // Satu slide untuk tiap slide di kerangka PPT materi.
  isi.slide_ppt.slide.forEach((slide, i) => {
    const s = ppt.addSlide();
    s.addText(slide.judul, { x: 0.7, y: 0.4, w: 8.6, h: 0.8, fontSize: 28, bold: true, color: '2563EB' });
    s.addText(
      slide.poin.map((poin) => ({ text: poin, options: { bullet: true, breakLine: true } })),
      { x: 0.7, y: 1.4, w: 8.6, h: 3.6, fontSize: 20, color: '1F2937', valign: 'top', fit: 'shrink', paraSpaceAfter: 10 },
    );
    s.addText(`${i + 1} / ${isi.slide_ppt.slide.length}`, { x: 8.4, y: 5.0, w: 1.2, h: 0.4, fontSize: 12, color: '6B7280', align: 'right' });
  });

  (denganLatihan ? isi.latihan : []).forEach((soal, i) => {
    const s = ppt.addSlide();
    s.addText(`Latihan ${i + 1}`, { x: 0.7, y: 0.4, w: 8.6, h: 0.8, fontSize: 28, bold: true, color: '2563EB' });
    s.addText(soal.soal, { x: 0.7, y: 1.2, w: 8.6, h: 1.2, fontSize: 20, bold: true, color: '1F2937', valign: 'top' });
    s.addText(soal.pilihan.map((p, j) => ({ text: `${HURUF[j]}. ${p}`, options: { breakLine: true } })), {
      x: 0.7, y: 2.5, w: 8.6, h: 2.6, fontSize: 18, color: '1F2937', valign: 'top',
    });
    // Kunci dan pembahasan di slide terpisah agar guru bisa menampilkannya setelah siswa menjawab.
    const kunci = ppt.addSlide();
    const indeks = HURUF.indexOf(soal.kunci);
    kunci.addText(`Pembahasan ${i + 1}`, { x: 0.7, y: 0.4, w: 8.6, h: 0.8, fontSize: 28, bold: true, color: '16A34A' });
    kunci.addText(`Jawaban: ${soal.pilihan[indeks]}`, { x: 0.7, y: 1.3, w: 8.6, h: 0.8, fontSize: 22, bold: true, color: '1F2937' });
    kunci.addText(soal.pembahasan, { x: 0.7, y: 2.2, w: 8.6, h: 2.8, fontSize: 18, color: '1F2937', valign: 'top' });
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
