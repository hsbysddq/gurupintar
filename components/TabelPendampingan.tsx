import { TrendingDown } from "lucide-react";
import { KartuKaca } from "@/components/KartuKaca";
import { trenMenurun } from "@/lib/pendampingan";

type TabelPendampinganProps = {
  data: { nama: string; alasan: string[]; saran: string[]; trenSkor: number[] }[];
};

// PRD AC-8.3, AC-8.4; design.md 4.15.
export function TabelPendampingan({ data }: TabelPendampinganProps) {
  if (data.length === 0) {
    return (
      <KartuKaca className="p-6">
        <p className="text-tinta-lembut">Tidak ada siswa yang perlu pendampingan saat ini.</p>
      </KartuKaca>
    );
  }

  return (
    <KartuKaca className="p-2">
      {/* HP: kartu bertumpuk agar alasan dan saran tetap terbaca tanpa geser horizontal. */}
      <ul className="flex flex-col gap-2 md:hidden">
        {data.map((baris) => {
          const menurun = trenMenurun(baris.trenSkor);
          return (
            <li key={baris.nama} className="rounded-kecil border border-tinta/10 p-4">
              <p className="font-semibold">{baris.nama}</p>
              <dl className="mt-3 flex flex-col gap-3 text-[14px] leading-relaxed">
                <div>
                  <dt className="text-[12px] leading-normal font-medium text-tinta-lembut">Alasan</dt>
                  <dd>
                    <ul className="mt-1 flex flex-col gap-1">
                      {baris.alasan.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] leading-normal font-medium text-tinta-lembut">Tren skor</dt>
                  <dd className="mt-1 flex items-center gap-2 font-medium">
                    {baris.trenSkor.join(", ")}
                    {menurun && (
                      <>
                        <TrendingDown aria-hidden="true" className="size-5 text-belum-teks" />
                        <span className="sr-only">(menurun)</span>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] leading-normal font-medium text-tinta-lembut">Saran</dt>
                  <dd>
                    <ul className="mt-1 flex flex-col gap-1">
                      {baris.saran.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>

      {/* Tablet dan desktop: tabel penuh dengan kolom yang sejajar. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[600px] border-collapse text-left">
          <caption className="sr-only">Daftar siswa yang perlu pendampingan beserta alasan, tren skor, dan saran</caption>
          <thead>
            <tr className="text-[13px] leading-normal font-medium text-tinta-lembut">
              <th scope="col" className="px-4 py-3">
                Nama
              </th>
              <th scope="col" className="px-4 py-3">
                Alasan
              </th>
              <th scope="col" className="px-4 py-3">
                Tren skor
              </th>
              <th scope="col" className="px-4 py-3">
                Saran
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((baris) => {
              const menurun = trenMenurun(baris.trenSkor);
              return (
                <tr key={baris.nama} className="border-t border-tinta/10 align-top">
                  <th scope="row" className="px-4 py-3 font-semibold">
                    {baris.nama}
                  </th>
                  <td className="px-4 py-3">
                    <ul className="flex flex-col gap-1">
                      {baris.alasan.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      {baris.trenSkor.join(", ")}
                      {menurun && (
                        <>
                          <TrendingDown aria-hidden="true" className="size-5 text-belum-teks" />
                          <span className="sr-only">(menurun)</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ul className="flex flex-col gap-1">
                      {baris.saran.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </KartuKaca>
  );
}
