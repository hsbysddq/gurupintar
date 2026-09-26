import type { ReactNode } from "react";

type KerangkaSiswaProps = {
  children: ReactNode;
  /** Tombol aksi utama; menempel di bawah layar. */
  aksi?: ReactNode;
};

export function KerangkaSiswa({ children, aksi }: KerangkaSiswaProps) {
  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-4 text-base leading-relaxed">
      <main className="flex flex-1 flex-col gap-6 py-8">{children}</main>
      {aksi && (
        <div className="sticky bottom-0 flex flex-col gap-3 bg-latar/80 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
          {aksi}
        </div>
      )}
    </div>
  );
}
