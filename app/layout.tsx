import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans/wght.css";
import "@fontsource-variable/inter/wght.css";
import { LatarPastel } from "@/components/LatarPastel";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guru Pintarku",
  description: "Cek pemahaman kilat, pengelompokan siswa, dan materi lanjutan per kelompok.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <LatarPastel />
        {children}
      </body>
    </html>
  );
}
