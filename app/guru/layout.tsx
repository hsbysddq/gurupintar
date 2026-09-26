import { KerangkaGuru } from "@/components/KerangkaGuru";

export default function LayoutGuru({ children }: LayoutProps<"/guru">) {
  return <KerangkaGuru>{children}</KerangkaGuru>;
}
