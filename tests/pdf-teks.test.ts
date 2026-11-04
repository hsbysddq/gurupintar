import { describe, expect, it } from 'vitest';
import { ekstrakTeksPdf } from '@/lib/server/pdf-teks';

const PDF_SEDERHANA = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj
4 0 obj << /Length 44 >> stream
BT /F1 18 Tf 50 100 Td (Pecahan senilai 1/2) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
trailer << /Root 1 0 R >>
%%EOF`;

describe('ekstrakTeksPdf', () => {
  it('mengambil teks dari PDF dan membuang penanda halaman', async () => {
    const teks = await ekstrakTeksPdf(Buffer.from(PDF_SEDERHANA).toString('base64'));
    expect(teks).toContain('Pecahan senilai 1/2');
    expect(teks).not.toContain('-- 1 of 1 --');
  });

  it('melempar error untuk data yang bukan PDF', async () => {
    await expect(ekstrakTeksPdf(Buffer.from('bukan pdf').toString('base64'))).rejects.toBeTruthy();
  });
});
