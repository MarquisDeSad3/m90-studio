"use client";

import { useEditor } from "@/lib/editor/store";
import { StepModel } from "@/components/editor/step-model";
import { StepLayout } from "@/components/editor/step-layout";
import { StepPhotos } from "@/components/editor/step-photos";
import { StepConfirm } from "@/components/editor/step-confirm";

export default function DisenarPage() {
  const { state } = useEditor();

  switch (state.step) {
    case 1:
      return <StepModel />;
    case 2:
      return <StepLayout />;
    case 3:
      return <StepPhotos />;
    case 4:
      return <StepConfirm />;
    default:
      return <StepModel />;
  }
}
