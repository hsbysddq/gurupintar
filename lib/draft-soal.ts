const NAMA_DB = 'gurupintar-draft';
const NAMA_STORE = 'draft-soal';
const ID_DRAFT = 'soal-baru';
const VERSI_DB = 1;

export interface DraftSoal<TIsian, TJadwal> {
  isian: TIsian;
  jadwal: TJadwal;
  disimpanPada: string;
}

interface BarisDraft<TIsian, TJadwal> extends DraftSoal<TIsian, TJadwal> {
  id: string;
}

let janjiDb: Promise<IDBDatabase> | null = null;

function bukaDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB tidak tersedia.'));
  if (janjiDb) return janjiDb;

  janjiDb = new Promise((selesai, gagal) => {
    const permintaan = indexedDB.open(NAMA_DB, VERSI_DB);
    permintaan.onupgradeneeded = () => {
      const db = permintaan.result;
      if (!db.objectStoreNames.contains(NAMA_STORE)) {
        db.createObjectStore(NAMA_STORE, { keyPath: 'id' });
      }
    };
    permintaan.onsuccess = () => selesai(permintaan.result);
    permintaan.onerror = () => gagal(permintaan.error ?? new Error('Database draft gagal dibuka.'));
  });

  return janjiDb;
}

/** Simpan draft tanpa mengganggu alur form jika browser menolak penyimpanan. */
export async function simpanDraftSoal<TIsian, TJadwal>(
  isian: TIsian,
  jadwal: TJadwal,
): Promise<void> {
  try {
    const db = await bukaDb();
    await new Promise<void>((selesai, gagal) => {
      const transaksi = db.transaction(NAMA_STORE, 'readwrite');
      const baris: BarisDraft<TIsian, TJadwal> = {
        id: ID_DRAFT,
        isian,
        jadwal,
        disimpanPada: new Date().toISOString(),
      };
      transaksi.objectStore(NAMA_STORE).put(baris);
      transaksi.oncomplete = () => selesai();
      transaksi.onerror = () => gagal(transaksi.error ?? new Error('Draft gagal disimpan.'));
      transaksi.onabort = () => gagal(transaksi.error ?? new Error('Penyimpanan draft dibatalkan.'));
    });
  } catch {
    // Draft lokal bersifat opsional; form tetap berjalan.
  }
}

export async function bacaDraftSoal<TIsian, TJadwal>(): Promise<DraftSoal<TIsian, TJadwal> | null> {
  try {
    const db = await bukaDb();
    const baris = await new Promise<BarisDraft<TIsian, TJadwal> | undefined>((selesai, gagal) => {
      const transaksi = db.transaction(NAMA_STORE, 'readonly');
      const permintaan = transaksi.objectStore(NAMA_STORE).get(ID_DRAFT);
      permintaan.onsuccess = () => selesai(permintaan.result as BarisDraft<TIsian, TJadwal> | undefined);
      permintaan.onerror = () => gagal(permintaan.error ?? new Error('Draft gagal dibaca.'));
    });
    if (!baris) return null;
    return { isian: baris.isian, jadwal: baris.jadwal, disimpanPada: baris.disimpanPada };
  } catch {
    return null;
  }
}

export async function hapusDraftSoal(): Promise<void> {
  try {
    const db = await bukaDb();
    await new Promise<void>((selesai, gagal) => {
      const transaksi = db.transaction(NAMA_STORE, 'readwrite');
      transaksi.objectStore(NAMA_STORE).delete(ID_DRAFT);
      transaksi.oncomplete = () => selesai();
      transaksi.onerror = () => gagal(transaksi.error ?? new Error('Draft gagal dihapus.'));
      transaksi.onabort = () => gagal(transaksi.error ?? new Error('Penghapusan draft dibatalkan.'));
    });
  } catch {
    // Abaikan; tidak ada yang perlu ditampilkan ke pengguna.
  }
}
