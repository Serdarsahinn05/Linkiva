"use client";

import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

// Two contexts on purpose: the editor only needs the (stable) setter. If it consumed the node too,
// every preview update would re-render the editor, which would publish a new preview: an infinite loop.
const PreviewNodeContext = createContext<ReactNode | null>(null);
const PreviewSetterContext = createContext<Dispatch<SetStateAction<ReactNode | null>>>(() => {});

/**
 * Lets the page that owns live, unsaved state (the editor) hand its preview to the shell's
 * "Preview" tab. Pages without one fall back to the published profile.
 */
export function PreviewProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<ReactNode | null>(null);
  return (
    <PreviewSetterContext.Provider value={setNode}>
      <PreviewNodeContext.Provider value={node}>{children}</PreviewNodeContext.Provider>
    </PreviewSetterContext.Provider>
  );
}

export const usePreview = () => useContext(PreviewNodeContext);

/** Registers a live preview for as long as the calling component is mounted. */
export function useRegisterPreview(node: ReactNode) {
  const setNode = useContext(PreviewSetterContext);
  useEffect(() => {
    setNode(node);
  }, [node, setNode]);
  useEffect(() => () => setNode(null), [setNode]);
}
