import type { ReactNode } from "react";
import { EditorProvider } from "@/lib/editor/store";
import { EditorHeader } from "@/components/editor/header";
import { getActivePhoneModels } from "@/lib/data/phone-models-db";

export const metadata = {
  title: "Diseñar tu funda",
};

export default async function DisenarLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Catálogo cargado desde DB en server. Se inyecta al EditorProvider
  // para que cada step pueda leerlo via usePhoneModels() sin volver a
  // ir a DB en runtime — mantiene el editor liviano para mobile cubano.
  const models = await getActivePhoneModels();

  return (
    <EditorProvider models={models}>
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
