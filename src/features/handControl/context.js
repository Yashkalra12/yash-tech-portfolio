/**
 * The hand-control context and its hook live apart from the provider component
 * so that the provider file exports only a component — which is what React Fast
 * Refresh needs in order to hot-reload it during development.
 */

import { createContext, useContext } from "react";

export const HandControlContext = createContext(null);

export function useHandControl() {
  const context = useContext(HandControlContext);
  if (!context) {
    throw new Error("useHandControl must be used inside a HandControlProvider");
  }
  return context;
}
