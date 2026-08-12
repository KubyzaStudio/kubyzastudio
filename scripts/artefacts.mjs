/**
 * Génère la vignette de chaque artefact 3D.
 *
 *   node scripts/artefacts.mjs
 *
 * POURQUOI CE SCRIPT EXISTE
 * ==========================================================================
 * Le site est un export statique (`output: "export"`), ce qui impose
 * `images.unoptimized` dans `next.config.ts` : il n'y a pas de serveur pour
 * redimensionner une image à la volée. L'attribut `sizes` d'un `<Image>` ne
 * génère donc aucun `srcset`, et le navigateur télécharge toujours le
 * fichier exactement tel qu'il est nommé dans le code.
 *
 * Les artefacts font 768 x 768 — la bonne taille pour l'objet posé en grand
 * dans la section Signal. Ils étaient aussi servis tels quels aux trois
 * endroits où ils n'apparaissent qu'en vignette : 24 px dans la liste des
 * canaux, 32 px dans le pied de page, 56 px dans la carte. Soit près de
 * 80 Ko téléchargés pour peindre un carré de 24 pixels de côté, trois fois.
 *
 * Ce script produit donc la seconde taille, à côté de la première.
 * `src/data/site.ts` déclare les deux (`artifact` et `artifactSmall`) et
 * chaque emplacement choisit la sienne.
 *
 * À RELANCER après avoir ajouté ou remplacé un fichier dans
 * `public/artefacts/`. Les vignettes sont versionnées : le script ne tourne
 * pas au build, et un oubli se verrait tout de suite — la vignette
 * manquante donnerait une image cassée en développement.
 */
import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

/* `sharp().metadata().size` n'est renseigné que pour les images chargées en
   mémoire, pas pour celles lues depuis un chemin : il vaut `undefined` ici,
   et toute arithmétique dessus donne `NaN`. La taille se lit donc sur le
   disque, où elle est de toute façon la seule qui compte — c'est ce nombre
   d'octets que le visiteur téléchargera. */
const bytes = async (file) => (await stat(file)).size;

const DIR = path.join(process.cwd(), "public", "artefacts");

/**
 * 192 px couvre les trois usages en vignette jusqu'à un écran 3x
 * (56 x 3 = 168 px) sans jamais être agrandi.
 */
const SIZE = 192;
const SUFFIX = "-sm";

const files = (await readdir(DIR))
  .filter((f) => f.endsWith(".webp") && !f.endsWith(`${SUFFIX}.webp`))
  .sort();

if (files.length === 0) {
  console.error(`Aucun artefact trouvé dans ${DIR}`);
  process.exit(1);
}

for (const file of files) {
  const name = path.basename(file, ".webp");
  const src = path.join(DIR, file);
  const out = path.join(DIR, `${name}${SUFFIX}.webp`);

  const { width } = await sharp(src).metadata();
  const before = await bytes(src);

  await sharp(src)
    .resize(SIZE, SIZE, { fit: "inside", withoutEnlargement: true })
    // La transparence est indispensable : les artefacts sont composés en
    // `mix-blend-screen`, un fond opaque éteindrait complètement l'effet.
    .webp({ quality: 82, effort: 6, alphaQuality: 90 })
    .toFile(out);

  const after = await bytes(out);
  const ko = (n) => `${(n / 1024).toFixed(1)} Ko`;
  const gain = Math.round((1 - after / before) * 100);

  console.log(
    `${name.padEnd(12)} ${width}px ${ko(before).padStart(9)}  ->  ${SIZE}px ${ko(after).padStart(8)}  (-${gain} %)`,
  );
}
