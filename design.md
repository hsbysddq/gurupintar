# design.md: Guru Pintar

| Atribut | Isi |
| --- | --- |
| Versi | 1.0 |
| Tanggal | 27 September 2026 |
| Gaya | Glassmorphism terang, cerah, modern |
| Dokumen terkait | `PRD.md` (kebutuhan), `architecture.md` (teknis), `agenda.md` (urutan kerja) |

> **Aturan untuk Claude Code**
> - Semua warna, ukuran, dan radius **hanya** diambil dari token di bagian 2. Jangan menulis kode warna hex di dalam `className`.
> - Bangun komponen persis seperti daftar di bagian 4 dan ikuti aturan penulisan di bagian 5.
> - Jika sebuah tampilan tidak dijelaskan di sini, ikuti pola komponen yang sudah ada, lalu tanyakan.

---

## 1. Prinsip Desain

1. **Jelas dalam 3 detik.** Di halaman hasil, guru langsung tahu siapa yang belum paham.
2. **Satu aksi utama per layar.** Hanya ada satu tombol varian `utama` di setiap layar.
3. **Mendukung, bukan menghakimi.** Warna dan kata-kata tidak membuat siswa terkesan gagal. Siswa tidak pernah melihat label kelompoknya.
4. **Cantik tapi terbaca.** Efek kaca tidak boleh mengurangi kontras teks. Jika teks samar, naikkan opasitas kartu, jangan mencerahkan teks.
5. **Satu elemen yang diingat.** Keberanian visual dihabiskan di **peta kelas** (donut + tiga kolom kelompok) di halaman hasil. Elemen lain tenang dan rapi.
6. **Ringan di HP.** Tampilan siswa satu kolom, tombol besar, tanpa gambar besar.

---

## 2. Design System dan Styling

### 2.1 Warna

| Token | Nilai | Penggunaan |
| --- | --- | --- |
| `primer` | `#2F6BFF` | Tombol utama, menu aktif, garis fokus, tautan |
| `primer-hover` | `#1F55E0` | Tombol utama saat disorot |
| `primer-lembut` | `#E8EFFF` | Latar elemen biru sekunder, pilihan terpilih |
| `tinta` | `#1A1D29` | Judul dan teks utama |
| `tinta-lembut` | `#5B6275` | Keterangan dan label |
| `latar` | `#F7F8FC` | Latar dasar halaman |
| `ai` | `#7C5CFF` | Label "Dibuat AI" |

**Warna kelompok** (warna utama hanya untuk grafik dan titik penanda; teks memakai varian `-teks`):

| Kelompok | Utama | Teks | Latar badge | Label untuk guru |
| --- | --- | --- | --- | --- |
| `sudah` | `#22A06B` | `#146B47` | `#E3F7EE` | Sudah Paham |
| `setengah` | `#F2B705` | `#8A6400` | `#FFF4D1` | Setengah Paham |
| `belum` | `#F2765A` | `#B4432B` | `#FFE7E0` | Belum Paham |

**Gumpalan latar (blob):** `#C9B8FF` (lavender), `#FFC6E0` (pink), `#FFD8BF` (peach), `#BFE3FF` (biru muda), diberi blur besar dan opasitas 40–60%, hanya di tepi dan sudut layar.

### 2.2 Tipografi

Font: **Plus Jakarta Sans** melalui `next/font/google`, variabel `--font-jakarta`, cadangan `system-ui, sans-serif`.

| Gaya | Ukuran / tinggi baris | Tebal | Penggunaan |
| --- | --- | --- | --- |
| Angka besar | 40px / 1.1 | 700 | Jumlah siswa per kelompok, kode kelas (kode kelas: 56px) |
| H1 | 28px / 1.25 | 700 | Judul halaman |
| H2 | 20px / 1.3 | 600 | Judul kartu |
| H3 | 16px / 1.4 | 600 | Subjudul |
| Isi | 15px / 1.6 (siswa: 16px) | 400 | Teks umum |
| Kecil | 13px / 1.5 | 500 | Label, badge |

Aturan: tidak ada huruf kapital semua untuk label; panjang baris isi maksimal ±70 karakter (`max-w-prose`).

### 2.3 Jarak, radius, bayangan

| Token | Nilai | Penggunaan |
| --- | --- | --- |
| Jarak | kelipatan 4px: 4, 8, 12, 16, 24, 32, 48 | Pakai skala bawaan Tailwind (`1, 2, 3, 4, 6, 8, 12`) |
| `radius-kartu` | 20px | Kartu kaca |
| `radius-tombol` | 14px | Tombol, input |
| `radius-kecil` | 10px | Badge persegi, chip skor |
| `shadow-kaca` | `0 8px 32px rgba(31,38,135,0.08)` | Kartu kaca |

### 2.4 Implementasi token (`app/globals.css`)

Untuk Tailwind v4 (bawaan `create-next-app` terbaru). Jika proyek memakai Tailwind v3, pindahkan nilai yang sama ke `tailwind.config.ts` bagian `theme.extend`.

```css
@import "tailwindcss";

@theme {
  --color-primer: #2F6BFF;
  --color-primer-hover: #1F55E0;
  --color-primer-lembut: #E8EFFF;
  --color-tinta: #1A1D29;
  --color-tinta-lembut: #5B6275;
  --color-latar: #F7F8FC;
  --color-ai: #7C5CFF;

  --color-sudah: #22A06B;
  --color-sudah-teks: #146B47;
  --color-sudah-latar: #E3F7EE;
  --color-setengah: #F2B705;
  --color-setengah-teks: #8A6400;
  --color-setengah-latar: #FFF4D1;
  --color-belum: #F2765A;
  --color-belum-teks: #B4432B;
  --color-belum-latar: #FFE7E0;

  --font-sans: var(--font-jakarta), system-ui, sans-serif;
  --radius-kartu: 20px;
  --radius-tombol: 14px;
  --radius-kecil: 10px;
  --shadow-kaca: 0 8px 32px rgba(31, 38, 135, 0.08);
}

@utility kaca {
  background-color: rgb(255 255 255 / 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgb(255 255 255 / 0.7);
  border-radius: var(--radius-kartu);
  box-shadow: var(--shadow-kaca);
}

@utility kaca-pekat {
  background-color: rgb(255 255 255 / 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgb(255 255 255 / 0.8);
  border-radius: var(--radius-kartu);
  box-shadow: var(--shadow-kaca);
}

body {
  background-color: var(--color-latar);
  color: var(--color-tinta);
}

:focus-visible {
  outline: 3px solid var(--color-primer);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Contoh pemakaian: `className="kaca p-6"`, `className="bg-primer text-white rounded-tombol"`, `className="text-belum-teks bg-belum-latar"`.

---

## 3. Layout dan Struktur Halaman

### 3.1 Kerangka

| Kerangka | Dipakai di | Struktur |
| --- | --- | --- |
| `KerangkaGuru` | Semua `/guru/*` | Sidebar kaca 248px di kiri + area konten dengan padding 32px, lebar konten maksimal 1200px, rata kiri |
| `KerangkaSiswa` | Semua `/siswa/*` | Satu kolom, lebar maksimal 430px, di tengah, padding samping 16px, tombol aksi utama menempel di bawah layar |
| Halaman `/` | Beranda | Dua kartu pilihan di tengah layar: "Saya guru" dan "Saya siswa" |

Latar semua halaman: `LatarPastel` (warna `latar` + blob pastel di sudut).

**Sidebar guru** (urutan tetap): Dashboard (`/guru`), Ubah Modul (`/guru/modul`), Perlu Pendampingan (`/guru/pendampingan`). Menu aktif: pill `bg-primer` teks putih. Di bawah menu: nama kelas "Kelas 7A" dan nama guru "Bu Rina".

### 3.2 Guru: Dashboard (`/guru`)

```text
┌──────────┬────────────────────────────────────────────────────┐
│ SIDEBAR  │ Kelas 7A                                           │
│          │ Matematika, Bu Rina           [ Buka kuis baru ]   │
│          │ ┌──────────────────────────────────────────────┐   │
│          │ │ PanelKodeKelas (muncul setelah kuis dibuka)  │   │
│          │ │  A7K2P (besar)     [QR]    [Lihat hasil]     │   │
│          │ │                            [Tutup kuis]      │   │
│          │ └──────────────────────────────────────────────┘   │
│          │ Riwayat kuis                                       │
│          │ ┌──────────────────────────────────────────────┐   │
│          │ │ Senin, 28 September 2026  Aktif   12 menjawab│   │
│          │ │ Senin, 21 September 2026  Selesai 32 menjawab│   │
│          │ └──────────────────────────────────────────────┘   │
└──────────┴────────────────────────────────────────────────────┘
```

### 3.3 Guru: Hasil (`/guru/hasil?sesi=`), layar utama demo

```text
┌──────────┬────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Hasil cek pemahaman                                    │
│          │ Pecahan Senilai, Kelas 7A                              │
│          │ 28 dari 32 siswa menjawab (aria-live)                  │
│          │ ┌──────────────────────────────┬─────────────────────┐ │
│          │ │ PETA KELAS                   │ DonutKelompok       │ │
│          │ │ Sudah 18 │ Setengah 6 │ Belum 4                   │ │
│          │ ├──────────┴────────────┴─────────┴─────────────────┤ │
│          │ │ DaftarSiswaKelompok x3 (tiga kolom sejajar)       │ │
│          │ └───────────────────────────────────────────────────┘ │
│          │ KartuSoalTersulit                                      │
│          │ [ ✨ Buat Materi Lanjutan dengan AI ]  (tombol utama)  │
│          │ Lihat siswa yang perlu pendampingan (tautan teks)      │
└──────────┴────────────────────────────────────────────────────────┘
```

Peta kelas adalah **satu kartu besar** (bukan tiga kartu terpisah) agar terbaca sebagai satu gambaran kelas. Urutan kolom selalu: Belum, Setengah, Sudah (kiri ke kanan), karena guru paling butuh melihat Belum Paham lebih dulu.

### 3.4 Guru: Materi (`/guru/materi?sesi=`)

```text
┌──────────┬────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Materi lanjutan                                        │
│          │ Periksa dan sesuaikan materi sebelum dibagikan.        │
│          │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│          │ │Penguatan      │ │Latihan        │ │Tantangan      │  │
│          │ │Konsep         │ │Terarah        │ │               │  │
│          │ │Belum Paham, 4 │ │Setengah, 6    │ │Sudah, 18      │  │
│          │ │[Dibuat AI]    │ │               │ │               │  │
│          │ │KartuMateriGuru│ │…              │ │…              │  │
│          │ └───────────────┘ └───────────────┘ └───────────────┘  │
│          │ [Buat ulang]                     [ Bagikan ke Siswa ]  │
└──────────┴────────────────────────────────────────────────────────┘
```

### 3.5 Guru: Perlu Pendampingan (`/guru/pendampingan`)

```text
┌──────────┬────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Perlu pendampingan          [🔒 Hanya terlihat oleh guru]│
│          │ TabelPendampingan: Nama | Alasan | Tren skor | Saran   │
│          │ Mengalami kemajuan                                     │
│          │ DaftarKemajuan: Dimas Saputra, Belum → Setengah Paham  │
└──────────┴────────────────────────────────────────────────────────┘
```

### 3.6 Siswa (HP)

```text
/siswa              /siswa/format        /siswa/kuis          /siswa/selesai       /siswa/materi
┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Guru Pintar   │   │ Kamu lebih    │   │ Soal 2 dari 5 │   │ Jawabanmu     │   │ Materi untukmu│
│ Masukkan kode │   │ suka belajar  │   │ ▓▓▓▓░░░░░░    │   │ sudah terkirim│   │ Pecahan       │
│ [ A7K2P     ] │   │ lewat apa?    │   │ Teks soal     │   │ Tunggu gurumu │   │ Senilai       │
│ [ Lanjut    ] │   │ [Video][Audio]│   │ [A. 3/4     ] │   │ membagikan    │   │ Video|Audio|  │
│ ─────────────│   │ [Bacaan][Lat.]│   │ [B. 4/6     ] │   │ materi untuk- │   │ Bacaan|Latihan│
│ Pilih namamu  │   │ Kamu bisa     │   │ [C. 4/5     ] │   │ mu.           │   │ Isi tab       │
│ (daftar nama) │   │ ganti kapan   │   │ [D. 2/6     ] │   │ [Lihat materi]│   │               │
│               │   │ saja.         │   │[Sebelumnya]   │   │               │   │               │
│ [ Masuk     ] │   │ [ Lanjut    ] │   │[ Berikutnya ] │   │               │   │               │
└───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
```

Siswa **tidak pernah** melihat kata "Sudah Paham", "Setengah Paham", "Belum Paham", atau "kelompok".

### 3.7 Responsif

| Lebar | Perilaku |
| --- | --- |
| ≥ 1280px | Sidebar penuh, tiga kolom kelompok sejajar |
| 768–1279px | Sidebar hanya ikon (72px), kolom kelompok tetap tiga jika muat, jika tidak dua |
| < 768px | Halaman guru: sidebar menjadi bar atas, kolom bertumpuk. Halaman siswa: satu kolom |

### 3.8 Guru: Ubah Modul (`/guru/modul`)

```text
┌──────────┬────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Ubah modul                                             │
│          │ Tempelkan teks modul matematika kelas 7, lalu ubah …   │
│          │ ┌────────────────────────────────────────────────────┐ │
│          │ │ Teks modul                                         │ │
│          │ │ [ textarea                                       ] │ │
│          │ │ Jangan tempelkan nama siswa…    1234 / 8000 karakter│ │
│          │ │ [ Ubah jadi 4 bentuk belajar ]                     │ │
│          │ └────────────────────────────────────────────────────┘ │
│          │ Pratinjau                                              │
│          │ Hasil ini tidak disimpan. Periksa isinya sebelum …     │
│          │ TabMateriSiswa: Video | Audio | Bacaan | Latihan       │
└──────────┴────────────────────────────────────────────────────────┘
```

- Satu aksi utama: "Ubah jadi 4 bentuk belajar" (varian utama, ikon `Sparkles`). Tombol nonaktif jika panjang teks di luar 200–8000 karakter; penghitung memakai `aria-live="polite"` dan berwarna `belum-teks` saat di luar batas.
- Saat memproses: `StatusHalaman` jenis `memuat`. Saat gagal: `StatusHalaman` jenis `gagal` dengan aksi "Coba lagi" (bukan `GagalBuatMateri`, karena tidak ada materi cadangan untuk modul).
- Pratinjau memakai `TabMateriSiswa` dengan `formatAwal = null` (tab Bacaan terbuka lebih dulu), dipasang ulang setiap hasil baru.

---

## 4. Komponen Spesifik (Instruksi untuk AI)

Setiap komponen: satu file `components/NamaKomponen.tsx`, named export. Tabel "Jangan" wajib dipatuhi.

### 4.1 `LatarPastel`
- **Tujuan:** latar halaman dengan blob pastel. Server Component.
- **Perilaku:** `fixed inset-0 -z-10 overflow-hidden`; 4 lingkaran blur (`blur-3xl`) di sudut dengan warna blob bagian 2.1; `aria-hidden="true"`.
- **Jangan:** animasi, gambar eksternal, blob di tengah layar di belakang teks.

### 4.2 `KartuKaca`
- **Props:** `{ varian?: 'standar' | 'pekat'; as?: 'div' | 'section' | 'article'; className?: string; children: ReactNode }`
- **Perilaku:** `standar` → kelas `kaca`; `pekat` → `kaca-pekat` (untuk kartu dengan banyak teks, misalnya materi).
- **Jangan:** menumpuk kartu kaca di dalam kartu kaca.

### 4.3 `Tombol`
- **Props:** `{ varian: 'utama' | 'sekunder' | 'teks'; ikon?: LucideIcon; memuat?: boolean; lebarPenuh?: boolean; type?: 'button' | 'submit'; disabled?: boolean; onClick?: () => void; children: ReactNode }`
- **Tampilan:** `utama` = `bg-primer text-white hover:bg-primer-hover`, tinggi 48px (siswa 52px); `sekunder` = kaca + teks `primer`; `teks` = tanpa latar, teks `primer`, garis bawah saat hover.
- **Perilaku:** saat `memuat`, tampil ikon putar kecil + teks tetap, tombol `disabled` dan `aria-busy="true"`.
- **Jangan:** simbol panah di teks tombol; lebih dari satu `utama` per layar; teks "Submit" atau "OK".

### 4.4 `BadgeKelompok`
- **Props:** `{ kelompok: Kelompok }`
- **Tampilan:** pill `rounded-full`, latar `{kelompok}-latar`, teks `{kelompok}-teks`, titik 8px warna utama di kiri, label dari tabel 2.1.
- **Jangan:** dipakai di halaman siswa.

### 4.5 `KerangkaGuru` dan `KerangkaSiswa`
- Sesuai bagian 3.1. `KerangkaGuru` memakai `usePathname()` untuk menu aktif (Client Component). `KerangkaSiswa` Server Component.

### 4.6 `PanelKodeKelas`
- **Props:** `{ kodeKelas: string; urlGabung: string; onTutup: () => void; sedangMenutup: boolean }`
- **Perilaku:** kode tampil 56px, spasi antarhuruf lebar, bisa disalin (tombol teks "Salin kode"); QR dibuat dengan `QRCode.toDataURL(urlGabung, { margin: 1, width: 240 })` dan ditampilkan sebagai `<img alt="QR untuk bergabung ke kuis">`.
- **Jangan:** mengambil QR dari layanan web eksternal.

### 4.7 `PetaKelas` (elemen yang paling diingat)
- **Props:** `{ kelompok: Record<Kelompok, SiswaHasil[]>; jumlahSiswa: number }`
- **Isi:** satu `KartuKaca` berisi baris ringkasan tiga kelompok (angka besar + label), `DonutKelompok` di kanan, dan tiga `DaftarSiswaKelompok` di bawahnya dengan urutan Belum, Setengah, Sudah.
- **Perilaku:** saat angka berubah karena polling, angka yang berubah diberi sorotan latar lembut 600ms satu kali (dinonaktifkan jika `prefers-reduced-motion`).

### 4.8 `DonutKelompok`
- **Props:** `{ jumlah: Record<Kelompok, number> }`
- **Perilaku:** `recharts` `PieChart` dengan `innerRadius` 60%; warna utama kelompok; di tengah angka total yang menjawab; legenda berupa teks label + angka (bukan hanya warna); `role="img"` dan `aria-label` berisi ringkasan, misalnya "18 sudah paham, 6 setengah paham, 4 belum paham".
- **Jangan:** animasi masuk bawaan recharts (`isAnimationActive={false}`).

### 4.9 `DaftarSiswaKelompok`
- **Props:** `{ kelompok: Kelompok; siswa: { nama: string; skor: number; total: number }[] }`
- **Perilaku:** judul dengan `BadgeKelompok`, daftar nama urut abjad dengan chip skor `4/5` (`rounded-kecil`). Jika kosong: "Tidak ada siswa."

### 4.10 `KartuSoalTersulit`
- **Props:** `{ data: { nomor: number; teks: string; persenSalah: number; miskonsepsi: string | null } | null; jumlahMenjawab: number }`
- **Isi:** ikon `Lightbulb`, judul "Soal paling banyak salah: Nomor {n}", teks soal, "{p}% siswa menjawab salah", lalu miskonsepsi. Jika `null`: "Belum ada jawaban masuk." Jika `null` tetapi `jumlahMenjawab > 0` (ada hasil siswa tanpa data jawaban per soal, misalnya kuis riwayat): "Rincian jawaban per soal tidak tersedia untuk kuis ini."

### 4.11 `PilihanFormat`
- **Props:** `{ nilai: Format | null; onPilih: (f: Format) => void }`
- **Perilaku:** grid 2×2 kartu pilihan (ikon `PlayCircle`, `Headphones`, `FileText`, `Pencil`) dengan `role="radiogroup"`, tiap kartu `role="radio"` dan `aria-checked`; terpilih = latar `primer-lembut` + garis `primer` 2px.
- **Jangan:** kata "gaya belajar" atau istilah tipe siswa.

### 4.12 `KartuSoalKuis` dan `ProgressKuis`
- **`ProgressKuis` props:** `{ saatIni: number; total: number }` → teks "Soal {saatIni} dari {total}" + bar `role="progressbar"` dengan `aria-valuenow`.
- **`KartuSoalKuis` props:** `{ teks: string; pilihan: { kode: string; teks: string }[]; terpilih: string | null; onPilih: (kode: string) => void }`
- **Perilaku:** pilihan sebagai tombol lebar penuh, tinggi minimal 52px, `role="radio"` dalam `radiogroup`; terpilih = latar `primer-lembut` + garis `primer`.
- **Jangan:** menandai benar/salah di kuis (siswa tidak melihat nilai).

### 4.13 `KartuMateriGuru`
- **Props:** `{ materi: { id: string; kelompok: Kelompok; isi: IsiMateri; status: 'draf' | 'dibagikan'; sumber: 'ai' | 'cadangan'; versi: number; jumlahSiswa: number }; onSimpan: (isi: IsiMateri, versi: number) => Promise<void> }`
- **Judul per kelompok:** `belum` → "Penguatan Konsep", `setengah` → "Latihan Terarah", `sudah` → "Tantangan".
- **Isi:** badge kelompok + jumlah siswa, label sumber ("Dibuat AI" dengan warna `ai` atau "Materi cadangan"), pratinjau ringkasan, tombol "Ubah" membuka mode edit berisi `textarea` untuk ringkasan, naskah audio, dan setiap soal latihan (soal, 4 pilihan, kunci, pembahasan).
- **Perilaku:** tombol "Simpan perubahan" (varian sekunder, karena tombol utama halaman adalah "Bagikan ke Siswa"); error `409` tampil sebagai pesan di dalam kartu. Jika `status = 'dibagikan'`, mode edit tidak tersedia dan tampil "Sudah dibagikan".

### 4.14 `TabMateriSiswa`, `TombolDengarkan`, `LatihanInteraktif`
- **`TabMateriSiswa` props:** `{ isi: IsiMateri; formatAwal: Format | null }` → tab Video, Audio, Bacaan, Latihan (`role="tablist"`, navigasi panah kiri/kanan); tab awal = `formatAwal` atau Bacaan.
- **`TombolDengarkan` props:** `{ teks: string }` → memakai `window.speechSynthesis` dengan `lang = 'id-ID'`; tombol berubah "Berhenti" saat berbicara; disembunyikan jika `speechSynthesis` tidak ada.
- **`LatihanInteraktif` props:** `{ latihan: IsiMateri['latihan'] }` → setelah memilih, tampil "Benar" (ikon centang, warna `sudah-teks`) atau "Belum tepat" (warna `belum-teks`) + pembahasan; tombol "Coba soal berikutnya".
- Tab Video: judul + deskripsi ide video + tautan `https://www.youtube.com/results?search_query={encodeURIComponent(kata_kunci_pencarian)}` dengan `target="_blank" rel="noopener noreferrer"`.

### 4.15 `TabelPendampingan`, `DaftarKemajuan`, `LabelHanyaGuru`
- **`TabelPendampingan` props:** `{ data: { nama: string; alasan: string[]; saran: string[]; trenSkor: number[] }[] }` → tabel semantik (`<table>`, `<th scope>`), tren skor sebagai angka "5, 4, 3" plus ikon `TrendingDown` bila menurun. Jika kosong: "Tidak ada siswa yang perlu pendampingan saat ini."
- **`DaftarKemajuan` props:** `{ data: { nama: string; dari: Kelompok; ke: Kelompok }[] }` → ikon `TrendingUp` warna `sudah-teks`, teks "{nama}: {label dari} ke {label ke}".
- **`LabelHanyaGuru`:** ikon `Lock` + "Hanya terlihat oleh guru".

### 4.16 `StatusHalaman`
- **Props:** `{ jenis: 'memuat' | 'kosong' | 'gagal'; judul: string; pesan?: string; aksi?: { label: string; onClick: () => void } }`
- **Perilaku:** `memuat` → kerangka abu-abu berdenyut halus (tanpa spinner besar); `gagal` → pesan jelas apa yang terjadi + tombol aksi; `role="status"` dan `aria-live="polite"`.

### 4.17 `GagalBuatMateri`
- **Props:** `{ onCobaLagi: () => void; onGunakanCadangan: () => void; onBatal?: () => void; sibuk?: boolean }`
- **Isi:** pesan "Materi belum berhasil dibuat." (PRD AC-6.3) dan dua tombol: "Coba lagi" (varian sekunder) dan "Gunakan materi cadangan" (varian utama). Jika `onBatal` diisi, tampil tombol teks "Batal".
- **Perilaku:** `role="alert"`; semua tombol nonaktif saat `sibuk` agar tidak ditekan dua kali. Dipakai di `/guru/hasil` dan `/guru/materi`; selama komponen ini tampil, tombol utama halaman disembunyikan (satu aksi utama per layar).

---

## 5. Aturan Penulisan Komponen (Frontend)

1. **Server Component secara bawaan.** Tambahkan `'use client'` hanya jika memakai state, efek, event handler, atau hook browser.
2. **Penamaan:** komponen `PascalCase.tsx` di `components/`, named export `export function NamaKomponen`. Hook di `hooks/` berawalan `use`. Modul lain `kebab-case.ts`.
3. **Props bertipe eksplisit:** `type NamaKomponenProps = { ... }`. Dilarang `any`. Tipe bersama diambil dari `lib/tipe.ts`.
4. **Komponen presentasional.** Komponen di `components/` tidak mengambil data sendiri; data datang lewat props dari halaman. Halaman mengambil data hanya melalui `lib/api-klien.ts` dan `hooks/use-polling.ts`.
5. **Batas impor:** komponen dan halaman **dilarang** mengimpor apa pun dari `lib/server/*`. `localStorage` hanya boleh dipakai di `lib/sesi-lokal.ts`.
6. **Styling:** hanya utilitas Tailwind dan token bagian 2. `style={{}}` hanya untuk nilai dinamis (misalnya lebar progress bar). Tidak ada CSS module atau file CSS tambahan.
7. **Setiap halaman berbasis data menangani tiga keadaan:** memuat, gagal, kosong, dengan `StatusHalaman`.
8. **Aksesibilitas:** aksi memakai `<button>`, navigasi memakai `<Link>`; setiap input punya `<label>`; ikon dekoratif `aria-hidden="true"`; pembaruan otomatis (jumlah jawaban, status materi) memakai `aria-live="polite"`; area sentuh minimal 48×48px.
9. **Gerak:** hanya transisi yang menanggapi aksi pengguna, durasi 150–250ms. Tidak ada animasi masuk halaman atau kartu.
10. **Format:** skor `4/5`; persentase `60%`; tanggal `new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })`.
11. **Teks:** bahasa Indonesia, huruf kapital hanya di awal kalimat dan nama, tanpa huruf kapital semua, tanpa simbol panah di tombol atau tautan, tombol memakai kata kerja yang sesuai aksi dan konsisten di seluruh alur (tombol "Bagikan ke Siswa" → konfirmasi "Materi sudah dibagikan.").

---

## 6. Bahasa dan Nada

| Gunakan | Hindari |
| --- | --- |
| Perlu Pendampingan | Siswa bermasalah, siswa lemah |
| Belum Paham (hanya untuk guru) | Gagal, tidak lulus |
| Materi untukmu | Materi remedial |
| Belum tepat | Salah! |
| Kamu bisa mencobanya lagi | Nilaimu rendah |

- Untuk guru: singkat, informatif, langsung ke tindakan.
- Untuk siswa: ramah, menyemangati, memakai "kamu".
- Pesan error menjelaskan apa yang terjadi dan apa yang bisa dilakukan, tanpa kata maaf.

---

## 7. Checklist Desain

- [ ] Guru dapat menyebut siswa Belum Paham dalam 3 detik di halaman hasil.
- [ ] Hanya satu tombol varian `utama` per layar.
- [ ] Tidak ada kode warna hex di `className`.
- [ ] Siswa tidak melihat label kelompok di layar mana pun.
- [ ] Semua teks terbaca saat layar diproyeksikan dan saat kecerahan layar diturunkan.
- [ ] Fokus keyboard terlihat di semua elemen interaktif.
- [ ] Halaman siswa nyaman di lebar 360px.
