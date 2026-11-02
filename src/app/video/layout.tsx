import type { Metadata } from "next";

export const metadata: Metadata = { title: "Final Sale video cards", robots: { index: false } };

export default function VideoLayout({ children }: LayoutProps<"/video">) {
  return <div className="min-h-dvh">{children}</div>;
}
