"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type MissionBrief = {
  /** Offre sélectionnée dans la section tarifs. */
  plan?: string;
  /** Résumé produit par le calculateur. */
  summary?: string;
  /** Fourchette estimée, en euros. */
  estimate?: [number, number];
};

type MissionStore = MissionBrief & {
  setBrief: (patch: MissionBrief) => void;
};

const MissionCtx = createContext<MissionStore>({ setBrief: () => {} });

/**
 * Mémoire partagée du parcours : ce que le visiteur a choisi dans les offres
 * et dans le calculateur arrive pré-rempli dans le formulaire de contact.
 * Il ne saisit jamais deux fois la même information.
 */
export function MissionProvider({ children }: { children: ReactNode }) {
  const [brief, setState] = useState<MissionBrief>({});

  /*
    L'identité de `setBrief` ne doit jamais changer : la console de mission
    la met dans les dépendances d'un effet. Recréée à chaque rendu, elle
    relancerait l'effet, qui relancerait le rendu — sans fin.
  */
  const setBrief = useCallback(
    (patch: MissionBrief) => setState((prev) => ({ ...prev, ...patch })),
    [],
  );

  const value = useMemo<MissionStore>(
    () => ({ ...brief, setBrief }),
    [brief, setBrief],
  );

  return <MissionCtx value={value}>{children}</MissionCtx>;
}

export const useMission = () => useContext(MissionCtx);
