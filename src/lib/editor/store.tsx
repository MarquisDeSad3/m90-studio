"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

/**
 * Estado global del editor de fundas. useReducer + Context + localStorage.
 *
 * Persistencia: cada cambio de estado se guarda en localStorage (key
 * "m90-editor-v1") asi el usuario no pierde su progreso si recarga, cierra
 * el navegador, o se le va la conexion (Cuba).
 *
 * NOTA: las fotos se guardan como dataURL. localStorage tiene cuota de ~5MB
 * por origen. Si el usuario sube fotos pesadas en Step 3 vamos a llenar la
 * cuota — en esa fase migramos a IndexedDB. Por ahora vale.
 */

export type Photo = {
  /** Indice del slot del layout al que pertenece. */
  slotIndex: number;
  /** dataURL (image/jpeg o image/webp) ya comprimido. */
  src: string;
  /** Crop relativo al recuadro del slot. Opcional, se setea en Step 3. */
  crop?: { x: number; y: number; width: number; height: number };
};

export type EditorStep = 1 | 2 | 3 | 4;

export type EditorState = {
  step: EditorStep;
  modelSlug: string | null;
  layoutId: string | null;
  photos: Photo[];
};

type Action =
  | { type: "GO_TO_STEP"; step: EditorStep }
  | { type: "SET_MODEL"; slug: string }
  | { type: "SET_LAYOUT"; id: string }
  | { type: "UPSERT_PHOTO"; photo: Photo }
  | { type: "REMOVE_PHOTO"; slotIndex: number }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: EditorState };

const INITIAL: EditorState = {
  step: 1,
  modelSlug: null,
  layoutId: null,
  photos: [],
};

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "GO_TO_STEP":
      return { ...state, step: action.step };
    case "SET_MODEL":
      // Cambiar de modelo no resetea layout/fotos, el usuario puede iterar
      return { ...state, modelSlug: action.slug };
    case "SET_LAYOUT":
      // Cambiar layout invalida el grid de fotos previas
      return { ...state, layoutId: action.id, photos: [] };
    case "UPSERT_PHOTO":
      return {
        ...state,
        photos: [
          ...state.photos.filter((p) => p.slotIndex !== action.photo.slotIndex),
          action.photo,
        ],
      };
    case "REMOVE_PHOTO":
      return {
        ...state,
        photos: state.photos.filter((p) => p.slotIndex !== action.slotIndex),
      };
    case "RESET":
      return INITIAL;
    default:
      return state;
  }
}

type Ctx = {
  state: EditorState;
  dispatch: Dispatch<Action>;
  goNext: () => void;
  goBack: () => void;
};

const EditorContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "m90-editor-v1";

function clampStep(s: number): EditorStep {
  if (s < 1) return 1;
  if (s > 4) return 4;
  return s as EditorStep;
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<EditorState>;
      if (parsed && typeof parsed === "object") {
        dispatch({
          type: "HYDRATE",
          state: {
            step: clampStep(parsed.step ?? 1),
            modelSlug: parsed.modelSlug ?? null,
            layoutId: parsed.layoutId ?? null,
            photos: Array.isArray(parsed.photos) ? parsed.photos : [],
          },
        });
      }
    } catch {
      // localStorage parsing failed o no esta disponible — empezamos limpio
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // QuotaExceeded: probablemente fotos grandes en Step 3.
      // En esa fase migramos a IndexedDB. Por ahora swallowamos silently.
    }
  }, [state]);

  const goNext = useCallback(() => {
    dispatch({ type: "GO_TO_STEP", step: clampStep(state.step + 1) });
  }, [state.step]);

  const goBack = useCallback(() => {
    dispatch({ type: "GO_TO_STEP", step: clampStep(state.step - 1) });
  }, [state.step]);

  return (
    <EditorContext.Provider value={{ state, dispatch, goNext, goBack }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor(): Ctx {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditor() debe usarse dentro de <EditorProvider>");
  }
  return ctx;
}
