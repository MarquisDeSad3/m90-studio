import type { ReactNode } from "react";
import { EditorProvider } from "@/lib/editor/store";
import { EditorHeader } from "@/components/editor/header";

export const metadata = {
  title: "Diseñar tu funda",
};

export default function DisenarLayout({ children }: { children: ReactNode }) {
  return (
    <EditorProvider>
      <div className="relative min-h-screen bg-[color:var(--color-paper)]">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-grid opacity-[0.25]"
        />
        <EditorHeader />
        {children}
      </div>
    </EditorProvider>
  );
}
