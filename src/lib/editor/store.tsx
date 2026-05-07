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
  /** dataURL (image/jpeg o image/webp) ya cropeado y comprimido. */
  src: string;
  /** Crop relativo al recuadro del slot. Opcional, se setea en Step 3. */
  crop?: { x: number; y: number; width: number; height: number };
  /** Recorte en fracciones 0..1 sobre la imagen fuente (lo que el cliente
      vio en el modal). Independiente de la resolucion: el server aplica
      este crop al ORIGINAL en max calidad cuando compone el print-ready
      con sharp, sin necesidad de saber las dimensiones del comprimido. */
  cropFraction?: { x: number; y: number; width: number; height: number };
};

export type EditorStep = 1 | 2 | 3 | 4;

export type CoverType = "normal" | "coated";

export type EditorState = {
  step: EditorStep;
  /** Slug del GRUPO de molde compartido (ej. iphone-12-13-14). Lo que el
      backend usa para imprimir. */
  modelSlug: string | null;
  /** Nombre exacto que el cliente vio y eligio (ej. "iPhone 13"). Puede
      ser uno de los aliases del grupo. Se manda al backend al crear el
      pedido y aparece en el WhatsApp + el admin para que quede claro qué
      modelo específico es. */
  modelDisplayName: string | null;
  layoutId: string | null;
  photos: Photo[];
  /** Tipo de funda — determina el precio. Default 'normal' (la mas barata).
      Cliente puede cambiar a 'coated' (placa blanca de aluminio 2-en-1)
      en el step de confirm. */
  coverType: CoverType;
};

type Action =
  | { type: "GO_TO_STEP"; step: EditorStep }
  | { type: "SET_MODEL"; slug: string; displayName: string }
  | { type: "SET_LAYOUT"; id: string }
  | { type: "UPSERT_PHOTO"; photo: Photo }
  | { type: "REMOVE_PHOTO"; slotIndex: number }
  | { type: "SET_COVER_TYPE"; coverType: CoverType }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: EditorState };

const INITIAL: EditorState = {
  step: 1,
  modelSlug: null,
  modelDisplayName: null,
  layoutId: null,
  photos: [],
  coverType: "normal",
};

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "GO_TO_STEP":
      return { ...state, step: action.step };
    case "SET_MODEL":
      // Cambiar de modelo no resetea layout/fotos, el usuario puede iterar
      return {
        ...state,
        modelSlug: action.slug,
        modelDisplayName: action.displayName,
      };
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
    case "SET_COVER_TYPE":
      return { ...state, coverType: action.coverType };
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
            modelDisplayName: parsed.modelDisplayName ?? null,
            layoutId: parsed.layoutId ?? null,
            photos: Array.isArray(parsed.photos) ? parsed.photos : [],
            coverType:
              parsed.coverType === "coated" ? "coated" : "normal",
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
