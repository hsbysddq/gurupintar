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
5. **Satu elemen yang diingat.** Keberanian visual dihabiskan di **peta kelas** (donut + tiga kolom kelompok) di halaman hasil. Elemen lain tenang dan rapi. Di landing page (`/`), perannya diambil **donut kelompok** (`DonutKelompok` di dalam `PratinjauDasbor`) di hero.
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

/* Di atas latar primer (pita penutup landing page), garis fokus primer tidak terlihat. */
[data-latar="primer"] :focus-visible {
  outline-color: var(--color-white);
}

/* Pola titik halus untuk latar hero landing page (bagian 3.10). */
@utility pola-titik {
  background-image: radial-gradient(color-mix(in srgb, var(--color-tinta) 12%, transparent) 1px, transparent 1px);
  background-size: 22px 22px;
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
| Halaman `/` | Landing page | Hero dengan donut kelompok, lalu masalah, cara kerja, fitur, prinsip, dan penutup (bagian 3.10). Tanpa sidebar |

Latar semua halaman: `LatarPastel` (warna `latar` + blob pastel di sudut).

**Sidebar guru** (urutan tetap): Dashboard (`/guru`, juga aktif di `/guru/hasil` dan `/guru/materi`), Buat Soal (`/guru/soal`), Ubah Modul (`/guru/modul`), Perlu Pendampingan (`/guru/pendampingan`). Menu aktif: pill `bg-primer` teks putih. Di bawah menu: nama kelas "Kelas 7A" dan nama guru "Bu Rina".

### 3.2 Guru: Dashboard (`/guru`)

```text
┌──────────┬────────────────────────────────────────────────────┐
│ SIDEBAR  │ Kelas 7A                                           │
│          │ Matematika, Bu Rina   Topik kuis                   │
│          │               [Pecahan Senilai ▾][Buka kuis baru]  │
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
│ [ Lanjut    ] │   │ [PPT][Audio]│   │ [A. 3/4     ] │   │ membagikan    │   │ PPT|Audio|  │
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
│          │ TabMateriSiswa: Video | Audio | ... │       
└──────────┴────────────────────────────────────────────────────────┘
```

- Satu aksi utama: "Ubah jadi 4 bentuk belajar" (varian utama, ikon `Sparkles`). Tombol nonaktif jika panjang teks di luar 200–8000 karakter; penghitung memakai `aria-live="polite"` dan berwarna `belum-teks` saat di luar batas.
- Saat memproses: `StatusHalaman` jenis `memuat`. Saat gagal: `StatusHalaman` jenis `gagal` dengan aksi "Coba lagi" (bukan `GagalBuatMateri`, karena tidak ada materi cadangan untuk modul).
- Pratinjau memakai `TabMateriSiswa` dengan `formatAwal = null` (tab Bacaan terbuka lebih dulu), dipasang ulang setiap hasil baru.

### 3.9 Guru: Buat Soal (`/guru/soal`)

```text
┌──────────┬────────────────────────────────────────────────────────┐
│ SIDEBAR  │ Buat soal                                              │
│          │ Khusus soal matematika SMP kelas 7. …                  │
│          │ ┌────────────────────────────────────────────────────┐ │
│          │ │ Nama topik [                                     ] │ │
│          │ │ Capaian pembelajaran [                           ] │ │
│          │ └────────────────────────────────────────────────────┘ │
│          │ ┌─ Soal 1 ───────────────────────────────────────────┐ │
│          │ │ Teks soal [                                      ] │ │
│          │ │ Pilihan A [        ]   Pilihan B [        ]        │ │
│          │ │ Pilihan C [        ]   Pilihan D [        ]        │ │
│          │ │ Kunci jawaban  [A] [B] [C] [D]                     │ │
│          │ │ Jika memilih … (selain kunci) [        ] opsional  │ │
│          │ └────────────────────────────────────────────────────┘ │
│          │ … Soal 2 s.d. Soal 5                                   │
│          │ [ Simpan topik dan soal ]                              │
└──────────┴────────────────────────────────────────────────────────┘
```

- Satu aksi utama di bawah: "Simpan topik dan soal" (varian utama, ikon `Save`). Tidak ada tombol ubah atau hapus.
- Tiap soal adalah `fieldset` dengan `legend` "Soal n". Kunci jawaban berupa empat tombol radio A–D (minimal 48×48px); yang terpilih `bg-primer` teks putih, fokus keyboard tampak sebagai outline `primer`.
- Kolom kesalahan pemahaman ("Jika memilih B", dan seterusnya) hanya tampil untuk pilihan yang bukan kunci.
- Validasi saat menyimpan memakai skema yang sama dengan server (`skemaBodyTopikBaru` + `pesanGalatTopik`): pesan per kolom berwarna `belum-teks` di bawah kolomnya (`aria-invalid`, `aria-describedby`), ringkasan `role="alert"` "Ada isian yang belum sesuai. Periksa kolom yang ditandai.", dan fokus pindah ke kolom salah yang pertama.
- Setelah tersimpan: "Topik "{nama}" tersimpan. Pilih topik ini saat membuka kuis baru di Dashboard." (warna `sudah-teks`) dan form dikosongkan.
- Halaman ini tidak memakai komponen khusus; kolom isian memakai gaya yang sama dengan mode edit `KartuMateriGuru`.
- Di Dashboard (3.2), `<select>` berlabel "Topik kuis" berada di samping "Buka kuis baru", dengan bawaan Pecahan Senilai. Jika daftar topik gagal dimuat, tampil keterangan kecil "Daftar topik belum berhasil dimuat. Kuis baru memakai topik Pecahan Senilai."

### 3.10 Landing page (`/`)

```text
┌───────────────────────────────────────────────────────────────────┐
│ ( Guru Pintar       Masalah  Cara kerja     Gabung kuis           │
│                                        [Coba sebagai guru] )      │
│ (Untuk guru SMP · Kurikulum Merdeka)                              │
│ Tahu siapa yang tertinggal          ┌─────────────────────┐       │
│ HARI INI, bukan saat ulangan.       │ ●●● Peta kelas · 7A │       │
│ Cek pemahaman kilat … bantuan AI …  │ ● ● ● ● ● ● ● ●     │       │
│ [ Coba sebagai guru ] [Gabung kuis] │ (donut 38) Belum 16 │       │
│ (✓ Kuis 5 soal) (✓ Tanpa instal) …  │  menjawab  Setengah │       │
│ #masalah   [40 siswa] [80 menit] [2 menit per anak]               │
│ #cara-kerja   (1)──────────(2)──────────(3)                       │
│ #fitur   ┌ Peta kelas ┐┌ Materi AI 4 bentuk ┐                     │
│          │   2×2      │├ Soal ┐┌ Pendamping ┤                     │
│          └────────────┘├ Ubah Modul ┐┌ Buat soal ┐                │
│ #prinsip   4 butir dalam satu kartu, 2 kolom                      │
│ ▓ Coba satu siklus dalam lima menit          [ Coba sebagai guru ]│
│ Prototipe hackathon. Guru Pintar.                 Kembali ke atas │
└───────────────────────────────────────────────────────────────────┘
```

- Server Component, tanpa data dari database dan tanpa gambar. Lebar konten maksimal 1200px, jarak antarbagian 96px, tanpa sidebar. Isi `<main>` diberi `overflow-x-clip` agar kartu melayang dan gumpalan dekoratif tidak membuat scroll horizontal di 360px.
- **Navbar:** `NavbarLanding` (4.18), hanya di halaman ini (bukan di `layout.tsx`). Navbar hanya menautkan `#masalah` dan `#cara-kerja`; `#fitur` dan `#prinsip` tetap ada di halaman tanpa tautan navbar. Setiap bagian ber-`id` diberi `scroll-mt-28` agar judulnya tidak tertutup navbar saat dituju. Tanpa smooth scroll.
- **Satu tombol utama per layar:** hero memakai `utama` "Coba sebagai guru" dan `sekunder` "Gabung kuis sebagai siswa"; navbar hanya `sekunder` dan `teks`. Pita penutup memakai varian `terang` (4.3) sebagai aksi utama layar itu.
- **Hero:** dua kolom di ≥1024px, bertumpuk di bawahnya. Pill "Untuk guru SMP · Kurikulum Merdeka", H1 dengan "hari ini" berwarna `primer`, subjudul, dua tombol, lalu tiga chip kaca dengan ikon centang `sudah-teks` ("Kuis 5 soal", "Tanpa instal", "Hasil dalam 3 detik"). Kolom kanan: `PratinjauDasbor` (4.19), jendela dasbor berisi `DonutKelompok` (38 menjawab di tengah) dan legendanya, tanpa kartu melayang dan tanpa teks keterangan. Donut ini adalah visual utama landing page.
- **Pengecualian tipografi (hanya di landing page):** H1 36px di HP dan 56px/1.05 di ≥1024px, `font-extrabold`, `tracking-tight`. Judul bagian 28px (32px di ≥768px). Angka di bagian masalah 40px (48px di ≥768px).
- **#masalah:** tiga kartu kaca berisi angka besar dan satuan (40 siswa, 80 menit, 2 menit per anak) dengan keterangan singkat, lalu satu kalimat tentang zona buta sebelum ulangan.
- **#cara-kerja:** tiga langkah dengan lingkaran nomor `bg-primer` teks putih. Di ≥768px ada garis penghubung `bg-primer/20` di belakang lingkaran (`aria-hidden`); di HP langkah bertumpuk tanpa garis.
- **#fitur (bento):** ≥1024px empat kolom: Peta kelas 2×2, Materi AI 4 bentuk 2×1, Soal paling banyak salah 1×1, Perlu Pendampingan 1×1, Ubah Modul 2×1, Buat soal sendiri 2×1. 768–1023px dua kolom (Peta kelas dan Materi AI selebar penuh). Di bawahnya satu kolom. Kotak peta kelas berisi bilah bertumpuk 16/12/10 (`grow-[n]`, `role="img"` dengan `aria-label`); kotak materi AI berisi lima ubin Video, Audio, Bacaan, PPT, Latihan.
- **#prinsip:** empat butir dalam satu kartu kaca, dua kolom di ≥768px.
- **Penutup:** pita `bg-primer text-white rounded-kartu` dengan `data-latar="primer"` (garis fokus menjadi putih, bagian 2.4), tagline, satu kalimat, dan `Tombol varian="terang"`. Footer: teks kecil dan tautan "Kembali ke atas" (`#atas`).
- **Kontras:** teks kecil di atas `primer-lembut` memakai `primer-hover` (±5.3:1), bukan `primer` (±3.9:1). Putih di atas `primer` dan `primer` di atas putih ±4.5:1. "hari ini" berwarna `primer` lolos karena teks besar (≥3:1). Warna `ai` hanya untuk ikon, tidak untuk teks kecil.
- **Data contoh:** donut 16 belum, 12 setengah, 10 sudah (38 menjawab) sama dengan sesi demo `RIW004` (PRD 8.5). Angka 40 siswa, 80 menit (2 JP), dan 2 menit per anak adalah ilustrasi.
- Teks prinsip mengikuti PRD D-1, D-2, D-5, dan `architecture.md` 9.2. Ubah Modul disebut khusus modul matematika kelas 7 (PRD F-9).
- Tanpa animasi masuk dan tanpa efek melayang bergerak; hanya transisi hover bawaan, yang dimatikan oleh `prefers-reduced-motion`.

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
- **Props:** `{ varian: 'utama' | 'sekunder' | 'teks' | 'terang'; ikon?: LucideIcon; memuat?: boolean; lebarPenuh?: boolean; type?: 'button' | 'submit'; disabled?: boolean; onClick?: () => void; href?: string; children: ReactNode }`. Jika `href` diisi, dirender sebagai `<Link>`.
- **Tampilan:** `utama` = `bg-primer text-white hover:bg-primer-hover`, tinggi 48px (siswa 52px); `sekunder` = kaca + teks `primer`; `teks` = tanpa latar, teks `primer`, garis bawah saat hover; `terang` = `bg-white text-primer hover:bg-primer-lembut`, hanya di atas latar `primer` (pita penutup landing page) dan berperan sebagai aksi utama layar itu.
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
- **Dipakai di:** `PetaKelas` (halaman hasil) dan `PratinjauDasbor` (landing page, data tetap).

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
- **`TabMateriSiswa` props:** `{ isi: IsiMateri; formatAwal: Format | null }` → tab Video, Audio, Bacaan, PPT, Latihan (`role="tablist"`, navigasi panah kiri/kanan); tab awal = `formatAwal` atau Bacaan.
- **`TombolDengarkan` props:** `{ teks: string }` → memakai `window.speechSynthesis` dengan `lang = 'id-ID'`; tombol berubah "Berhenti" saat berbicara; disembunyikan jika `speechSynthesis` tidak ada.
- **`LatihanInteraktif` props:** `{ latihan: IsiMateri['latihan'] }` → setelah memilih, tampil "Benar" (ikon centang, warna `sudah-teks`) atau "Belum tepat" (warna `belum-teks`) + pembahasan; tombol "Coba soal berikutnya".
- Tab PPT: judul presentasi, satu slide tampil sekaligus (judul + poin) dengan tombol Sebelumnya/Berikutnya dan penanda "Slide n dari N", serta tombol "Unduh PPT" (PPTX dibuat di browser).

### 4.15 `TabelPendampingan`, `DaftarKemajuan`, `LabelHanyaGuru`
- **`TabelPendampingan` props:** `{ data: { nama: string; alasan: string[]; saran: string[]; trenSkor: number[] }[] }` → tabel semantik (`<table>`, `<th scope>`), tren skor sebagai angka "5, 4, 3" plus ikon `TrendingDown` bila menurun. Jika kosong: "Tidak ada siswa yang perlu pendampingan saat ini."
- **`DaftarKemajuan` props:** `{ data: { nama: string; dari: Kelompok; ke: Kelompok }[] }` → ikon `TrendingUp` warna `sudah-teks`, teks "{nama}: {label dari} ke {label ke}".
- **`LabelHanyaGuru`:** ikon `Lock` + "Hanya terlihat oleh guru".

### 4.16 `StatusHalaman`
- **Props:** `{ jenis: 'memuat' | 'kosong' | 'gagal'; judul: string; pesan?: string; aksi?: { label: string; onClick: () => void } }`
- **Perilaku:** `memuat` → kerangka abu-abu berdenyut halus (tanpa spinner besar); `gagal` → pesan jelas apa yang terjadi + tombol aksi; `role="status"` dan `aria-live="polite"`.

### 4.17 `GagalBuatMateri`
- **Props:** `{ onCobaLagi: () => void; onGunakanCadangan?: () => void; onBatal?: () => void; sibuk?: boolean }`
- **Tanpa cadangan (PRD F-10):** materi cadangan hanya ada untuk topik demo. Jika `onGunakanCadangan` tidak diisi, tombol "Gunakan materi cadangan" tidak tampil, teks penjelas menjadi "Coba sekali lagi dalam beberapa saat.", dan "Coba lagi" menjadi varian utama. `/guru/hasil` dan `/guru/materi` mengisinya hanya jika `cadanganTersedia`.
- **Isi:** pesan "Materi belum berhasil dibuat." (PRD AC-6.3) dan dua tombol: "Coba lagi" (varian sekunder) dan "Gunakan materi cadangan" (varian utama). Jika `onBatal` diisi, tampil tombol teks "Batal".
- **Perilaku:** `role="alert"`; semua tombol nonaktif saat `sibuk` agar tidak ditekan dua kali. Dipakai di `/guru/hasil` dan `/guru/materi`; selama komponen ini tampil, tombol utama halaman disembunyikan (satu aksi utama per layar).

### 4.18 `NavbarLanding`
- **Tujuan:** navigasi landing page. Server Component tanpa JavaScript; hanya dipakai di `/`.
- **Tampilan:** `<header>` `sticky top-3 z-20` dengan jarak tepi `mx-3` (`mx-6` di ≥768px); `<nav aria-label="Navigasi utama">` berbentuk kapsul `kaca rounded-full`, tinggi 64px, lebar maksimal 1200px, padding `px-4` (16px) yang sama di kiri dan kanan: ikon logo (tanpa padding sendiri) dan tepi tombol sekunder sama jauhnya dari tepi kapsul.
- **Isi:** kiri ikon `GraduationCap` + "Guru Pintar" ke `/` (`aria-label` "Guru Pintar, ke beranda"; teks menjadi `sr-only` di bawah 640px). Tengah hanya dua tautan anchor, Masalah dan Cara kerja, ke `#masalah` dan `#cara-kerja` (tinggi 48px), disembunyikan di bawah 768px. Kanan `Tombol varian="teks"` "Gabung kuis" ke `/siswa` (disembunyikan di bawah 640px) dan `Tombol varian="sekunder"` "Coba sebagai guru" ke `/guru`, dengan `gap-2`: teks "Gabung kuis" berjarak 16px dari tombol (padding tombol teks 8px + gap 8px), setara dengan padding tepi kapsul.
- **Jangan:** tombol varian `utama`, menu hamburger, atau skrip.

### 4.19 `PratinjauDasbor`
- **Tujuan:** pratinjau produk di hero landing page. Server Component tanpa props; data contoh sama dengan sesi demo `RIW004`.
- **Isi:** `<div>` (`relative isolate`, lebar maksimal 448px) berisi satu jendela `kaca-pekat`: bilah atas (tiga titik 10px `bg-belum`, `bg-setengah`, `bg-sudah` yang `aria-hidden`, dan judul "Peta kelas · Kelas 7A") lalu `DonutKelompok` (4.8) dengan data tetap `{ belum: 16, setengah: 12, sudah: 10 }`: "38" dan "menjawab" di tengah, legenda teks Belum Paham 16, Setengah Paham 12, Sudah Paham 10 dengan titik warna (di samping donut mulai 640px, di bawahnya di HP). Donut 176px, dipusatkan dengan padding `px-6 py-8` (`px-8 py-10` mulai 640px). Tanpa kartu melayang dan tanpa teks keterangan.
- **Aksesibilitas:** isi donut dibacakan lewat `role="img"` dan `aria-label` di `DonutKelompok` ("10 sudah paham, 12 setengah paham, 16 belum paham").
- **Latar:** di belakang jendela (`-z-10`, `aria-hidden`), tiga gumpalan blob (`opacity-60`–`80`, `blur-3xl`) dan lapisan `pola-titik` yang memudar ke tepi dengan `mask-image`. Tidak berada di belakang teks judul hero.
- **Jangan:** animasi melayang, gambar, atau data nyata siswa.

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
