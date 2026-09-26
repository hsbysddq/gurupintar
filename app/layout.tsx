import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { LatarPastel } from "@/components/LatarPastel";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guru Pintar",
  description: "Cek pemahaman kilat, pengelompokan siswa, dan materi lanjutan per kelompok.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <LatarPastel />
        {children}
      </body>
    </html>
  );
}
