"use client";

import { useEffect, useState } from "react";

const KALIMAT = [
  "Siapkan pembelajaran lebih tepat",
  "Bantu Guru, Pahami Siswa",
  "Inovasi dalam Mengajar",
];

const JEDA_MS = 3200;
const JEDA_GANTI_MS = 200;

/** Teks badge landing yang berganti otomatis tanpa menggeser lebar pill. */
export function TeksBerputar() {
  const [aktif, setAktif] = useState(0);
  const [terlihat, setTerlihat] = useState(true);

  useEffect(() => {
    const pengatur = setInterval(() => setTerlihat(false), JEDA_MS);
    return () => clearInterval(pengatur);
  }, []);

  useEffect(() => {
    if (terlihat) return;
    const pengatur = setTimeout(() => {
      setAktif((i) => (i + 1) % KALIMAT.length);
      setTerlihat(true);
    }, JEDA_GANTI_MS);
    return () => clearTimeout(pengatur);
  }, [terlihat]);

  return (
    <span className="grid overflow-hidden" aria-live="polite" aria-atomic="true">
      {KALIMAT.map((kalimat, i) => {
        const sedangTampil = i === aktif && terlihat;
        return (
          <span
            key={kalimat}
            aria-hidden={!sedangTampil}
            className={`col-start-1 row-start-1 transition-all duration-200 ease-out motion-reduce:transition-none ${
              sedangTampil ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            {kalimat}
          </span>
        );
      })}
    </span>
  );
}
