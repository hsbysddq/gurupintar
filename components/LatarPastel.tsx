export function LatarPastel() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 -top-32 size-96 rounded-full bg-blob-lavender opacity-50 blur-3xl" />
      <div className="absolute -right-32 -top-24 size-96 rounded-full bg-blob-pink opacity-40 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 size-96 rounded-full bg-blob-biru opacity-50 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-blob-peach opacity-60 blur-3xl" />
    </div>
  );
}
