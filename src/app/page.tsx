import { SiteShell } from "@/components/layout/SiteShell";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Transmission } from "@/components/sections/Transmission";
import { Services } from "@/components/sections/Services";
import { Portfolio } from "@/components/sections/Portfolio";
import { Signal } from "@/components/sections/Signal";
import { Pricing } from "@/components/sections/Pricing";
import { Calculator } from "@/components/sections/Calculator";
import { Preuves } from "@/components/sections/Preuves";
import { Avis } from "@/components/sections/Avis";
import { Contact } from "@/components/sections/Contact";

/*
  POURQUOI CES IMPORTS SONT STATIQUES, ET DOIVENT LE RESTER
  --------------------------------------------------------------------------
  Passer ces sections par `next/dynamic` a été essayé, mesuré, et retiré.

  Dans l'App Router, un composant client rendu côté serveur voit son chunk
  émis en `<script src>` dans le document quoi qu'il arrive : `dynamic()`
  avec `ssr: true` découpe le bundle en davantage de morceaux, mais le
  navigateur les télécharge tous au même moment. Mesure à l'appui, la page
  passait de 886 Ko à 912 Ko de JavaScript initial pour douze requêtes au
  lieu de dix — l'inverse du but recherché.

  Le report du chargement se joue donc là où il fonctionne vraiment : sur
  les composants qui n'ont pas à être rendus côté serveur du tout. Voir
  `Avis.tsx` (le formulaire) et `Calculator.tsx` (le simulateur), qui
  utilisent `ssr: false` — le seul mode qui retire réellement du poids du
  chemin critique.
*/

/**
 * LE VOYAGE
 * ==========================================================================
 * Huit étapes, pas quatorze.
 *
 * Les anciennes sections « Intro », « Constat », « Solution » et
 * « Comparaison » disaient la même chose quatre fois : elles tiennent
 * maintenant dans une seule séquence horizontale. « Processus »,
 * « Témoignages » et « Questions » se vérifiaient l'une l'autre : elles
 * forment un seul bloc de preuves. « Avant / Après » a été retiré — il
 * répétait mot pour mot le passage du constat à la bascule.
 *
 * Chaque étape restante a sa propre mécanique : défilement horizontal,
 * liste dépliable, rangée qu'on tire à la main, objet qu'on touche,
 * paliers qui montent, console, frise, formulaire. Aucune ne se
 * ressemble — c'est la condition pour qu'aucune ne se devine.
 */
export default function Home() {
  return (
    <SiteShell footer={<Footer />}>
      <Hero />
      <Transmission />
      <Services />
      <Portfolio />
      <Signal />
      <Pricing />
      <Calculator />
      <Preuves />
      <Avis />
      <Contact />
    </SiteShell>
  );
}
