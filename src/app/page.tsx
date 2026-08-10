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
import { Contact } from "@/components/sections/Contact";

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
      <Contact />
    </SiteShell>
  );
}
