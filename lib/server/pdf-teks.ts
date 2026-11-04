import 'server-only';
import { PDFParse } from 'pdf-parse';

/**
 * Ekstrak teks dari PDF. Provider API Command Code tidak menerima lampiran dokumen,
 * jadi isi PDF harus diubah menjadi teks sebelum dikirim ke model.
 */
export async function ekstrakTeksPdf(base64: string): Promise<string> {
  const data = new Uint8Array(Buffer.from(base64, 'base64'));
  const parser = new PDFParse({ data });
  try {
    const hasil = await parser.getText();
    return hasil.text
      .replace(/\u0000/g, '')
      .replace(/^-- \d+ of \d+ --$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } finally {
    await parser.destroy().catch(() => {});
  }
}
