import type { Metadata } from "next";
import { PlayViewport } from "./PlayClient";

export const metadata: Metadata = {
  title: "Flow play mode · QuickTaskMate",
  description:
    "Step through QuickTaskMate screen flows like a Figma prototype — Prev, Next, and Play.",
};

export default function PlayPage() {
  return <PlayViewport />;
}
