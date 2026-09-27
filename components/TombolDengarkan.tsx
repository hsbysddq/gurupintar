"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Square, Volume2 } from "lucide-react";
import { Tombol } from "@/components/Tombol";

type TombolDengarkanProps = {
  teks: string;
};

const tanpaLangganan = () => () => {};

// PRD AC-7.4, design.md 4.14: suara bawaan browser berbahasa Indonesia; disembunyikan jika tidak didukung.
export function TombolDengarkan({ teks }: TombolDengarkanProps) {
  const didukung = useSyncExternalStore(
    tanpaLangganan,
    () => "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined",
    () => false,
  );
  const [berbicara, setBerbicara] = useState(false);

  // Hentikan suara saat pindah tab atau halaman.
  useEffect(() => {
    if (!didukung) return;
    return () => window.speechSynthesis.cancel();
  }, [didukung]);

  if (!didukung) return null;

  function tekan() {
    const suara = window.speechSynthesis;
    if (berbicara) {
      suara.cancel();
      setBerbicara(false);
      return;
    }
    const ucapan = new SpeechSynthesisUtterance(teks);
    ucapan.lang = "id-ID";
    const suaraIndonesia = suara.getVoices().find((v) => v.lang.replace("_", "-").toLowerCase().startsWith("id"));
    if (suaraIndonesia) ucapan.voice = suaraIndonesia;
    ucapan.onend = () => setBerbicara(false);
    ucapan.onerror = () => setBerbicara(false);
    suara.cancel();
    suara.speak(ucapan);
    setBerbicara(true);
  }

  return (
    <Tombol varian="utama" ukuran="besar" lebarPenuh ikon={berbicara ? Square : Volume2} onClick={tekan}>
      {berbicara ? "Berhenti" : "Dengarkan"}
    </Tombol>
  );
}
