import type { Metadata } from "next";
import { ComparePage } from "@/components/ComparePage";

export const metadata: Metadata = { title: "Compare saved looks: Final Sale" };

export default function Compare() {
  return <ComparePage />;
}
