// Unduh materi sebagai DOCX. Dibuat di browser (tanpa API tambahan).
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

export async function unduhDocx(isi: IsiMateri) {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import('docx');
  const p = (teks: string) => new Paragraph({ children: [new TextRun(teks)], spacing: { after: 120 } });
  const h = (teks: string) =>
    new Paragraph({ text: teks, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });

  const isiBacaan = isi.bacaan
    ? [
        h('E-book'),
        ...(isi.bacaan.subjudul ? [p(isi.bacaan.subjudul)] : []),
        ...isi.bacaan.bab.flatMap((bab, i) => [
          new Paragraph({
            children: [new TextRun({ text: `Bab ${i + 1}: ${bab.judul}`, bold: true })],
            spacing: { before: 200, after: 80 },
          }),
          ...bab.paragraf.map((paragraf) => p(paragraf)),
          ...(bab.poin ?? []).map((poin) => p(`- ${poin}`)),
          ...(bab.contoh ? [p(`Contoh: ${bab.contoh}`)] : []),
        ]),
      ]
    : [];

  const anak = [
    new Paragraph({ text: isi.judul, heading: HeadingLevel.TITLE }),
    ...isiBacaan,
    h('Ringkasan'),
    p(isi.ringkasan),
    h('Naskah audio'),
    p(isi.naskah_audio),
    h('Ide video'),
    new Paragraph({ children: [new TextRun({ text: isi.ide_video.judul, bold: true })], spacing: { after: 120 } }),
    p(isi.ide_video.deskripsi),
    p(`Kata kunci pencarian: ${isi.ide_video.kata_kunci_pencarian}`),
    h('Latihan'),
    ...isi.latihan.flatMap((soal, i) => [
      new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${soal.soal}`, bold: true })],
        spacing: { before: 160, after: 80 },
      }),
      ...soal.pilihan.map((pil, j) => p(`${HURUF[j]}. ${pil}`)),
    ]),
    h('Kunci dan pembahasan'),
    ...isi.latihan.map((soal, i) =>
      p(`${i + 1}. Jawaban: ${soal.pilihan[HURUF.indexOf(soal.kunci)]}. ${soal.pembahasan}`),
    ),
  ];

  const blob = await Packer.toBlob(new Document({ sections: [{ children: anak }] }));
  simpanBerkas(blob, namaBerkas(isi.judul, 'docx'));
}
