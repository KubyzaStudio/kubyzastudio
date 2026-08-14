import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/** Configuration plate — eslint-config-next 16 expose directement des presets. */
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    /* `.wrangler/` contient les bundles temporaires que `wrangler pages dev`
       génère à chaque démarrage — du code d'échafaudage, pas le nôtre. Sans
       cette ligne, un simple `npm start` suffit à faire remonter des
       avertissements sur des fichiers que personne n'a écrits et que le
       prochain démarrage remplacera. */
    ignores: [".next/**", "out/**", "node_modules/**", ".wrangler/**"],
  },
];

export default eslintConfig;
