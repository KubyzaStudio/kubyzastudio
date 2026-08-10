"use client";

import { createContext, useContext } from "react";

/**
 * `true` dès que l'écran de lancement s'efface.
 * Les animations d'entrée du hero attendent ce signal pour se déclencher —
 * sinon elles se joueraient derrière le préchargement, invisibles.
 */
export const LaunchContext = createContext(false);

export const useLaunched = () => useContext(LaunchContext);
