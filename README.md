# Kubyza Studio

> Nous lançons votre présence en ligne.

Site vitrine one-page de Kubyza Studio — studio de création de sites web basé à
Montereau-Fault-Yonne (Seine-et-Marne).

Le site est lui-même la démonstration du service vendu : expérience spatiale
immersive, scroll cinématique, scène 3D temps réel, et un parcours pensé pour
transformer un visiteur en demande de devis.

---

## Sommaire

- [Démarrage rapide](#démarrage-rapide)
- [Architecture](#architecture)
- [Modifier le contenu](#modifier-le-contenu)
- [Design system](#design-system)
- [La scène 3D et les performances](#la-scène-3d-et-les-performances)
- [Formulaire de contact](#formulaire-de-contact)
- [Avis clients](#avis-clients)
- [Artefacts et vignettes](#artefacts-et-vignettes)
- [Variables d'environnement](#variables-denvironnement)
- [Déploiement sur Cloudflare Pages](#déploiement-sur-cloudflare-pages)
- [SEO](#seo)
- [Accessibilité](#accessibilité)
- [À faire avant la mise en ligne](#à-faire-avant-la-mise-en-ligne)

---

## Démarrage rapide

Prérequis : **Node.js 20 ou plus**.

```bash
npm install
npm run dev          # http://localhost:3000
```

Autres commandes :

```bash
npm run build        # export statique dans ./out
npm run lint         # ESLint
npm run preview      # build + serveur Cloudflare local (avec la fonction /api)
npm run deploy       # build + déploiement Cloudflare Pages
```

---

## Architecture

```
src/
  app/
    layout.tsx            metadata, polices, données structurées
    page.tsx              assemblage des 16 sections (composant serveur)
    globals.css           design system complet (Tailwind v4, CSS-first)
    icon.svg              favicon
    apple-icon.tsx        icône iOS générée au build
    opengraph-image.tsx   vignette de partage générée au build
    sitemap.ts / robots.ts

  components/
    layout/     SiteShell, Header, Footer, Preloader, Cursor, Logo
    sections/   Hero, Transmission, Services, Portfolio, Signal,
                Pricing, Calculator, Preuves, Contact, ContactForm
    3d/         SpaceScene, SceneContent, Starfield, Body, Nebula, Rings,
                Debris, SignalStage, StaticSky, quality.ts, shaders/
    ui/         Button, GlassCard, Section, Reveal, AnimatedText, Counter,
                Icons, ProjectPlanet, MissionPhase, LaunchControl
    providers/  ExperienceProvider (Lenis + GSAP), MissionContext, LaunchContext
    seo/        JsonLd

  data/         site, services, projects, pricing, faq, commitments,
                process, content, calculator
  lib/          utils, hooks, viewport-state

functions/
  api/contact.ts          Cloudflare Pages Function (envoi des demandes)

public/
  _headers                sécurité + cache, appliqués par Cloudflare
```

**Principe de séparation :** `page.tsx` reste un composant serveur. Tout le
JavaScript client est isolé dans `SiteShell`, qui enveloppe le contenu. Le HTML
part donc entièrement pré-rendu, y compris pour les moteurs de recherche.

---

## Modifier le contenu

Aucun texte n'est écrit en dur dans les composants. Tout vit dans `src/data/` :

| Fichier | Contenu |
| --- | --- |
| `site.ts` | Nom, slogan, email, téléphone, ville, réseaux sociaux, menu |
| `services.ts` | Les 6 missions |
| `projects.ts` | Le portfolio |
| `pricing.ts` | Les 3 missions + l'abonnement de suivi — **source unique des prix et des délais** |
| `faq.ts` | Les questions fréquentes (alimente aussi le SEO) |
| `commitments.ts` | Les 4 engagements affichés à la place des avis |
| `process.ts` | Les 6 étapes de création |
| `content.ts` | Constat, bénéfices, comparaison, avant/après |
| `calculator.ts` | La console de mission : questions, poids, suppléments |

`pricing.ts` est lu par les offres, la console de mission, la FAQ, les
engagements et le balisage Schema.org. **Changer un prix ou un délai ne se
fait qu'à cet endroit** — aucun montant n'est retapé ailleurs.

### Ajouter un projet au portfolio

```ts
{
  id: "mon-projet",
  name: "Nom du client",
  category: "Commerce · Restauration",
  phase: "live",                       // live | building | upcoming
  teaser: "Une phrase courte.",
  description: "Deux ou trois phrases, factuelles.",
  scope: [
    "Ce que le site contient, ligne par ligne",
    "Jamais un résultat commercial non mesuré",
  ],
  technologies: ["Site vitrine", "Réservation"],
  year: "2026",
  href: "https://exemple.fr",          // null tant que le site n'est pas publié
  image: "/projets/mon-projet.webp",   // facultatif, carré
  hue: 226,                            // teinte de la planète
}
```

**La phase commande tout.** `live` allume le disque plein et affiche le bouton
« Voir le site » ; `building` n'affiche qu'un demi-disque et aucun lien ;
`upcoming` réduit la planète à une ébauche cerclée de pointillés. L'intitulé du
bloc `scope` change avec elle (voir `PHASES` dans `projects.ts`).

Avec `image`, la photographie devient la **surface** de la planète : le
terminateur et le limbe sont recomposés par-dessus. L'image doit donc être
carrée et lisible en cercle. Sans image, la planète est générée à partir de
`hue` ; garder la teinte entre **190 et 280** pour rester dans l'univers bleu,
sauf si la marque du client impose la sienne (KEYSPNEU77 : 32).

> **Règle non négociable.** Aucun client, avis, chiffre ou résultat inventé.
> Un projet non publié porte `phase: "building"` et `href: null` — c'est plus
> crédible qu'une fausse mise en ligne.

---

## Design system

Tout est centralisé dans le bloc `@theme` de `src/app/globals.css`.

**Couleurs**

| Jeton | Usage |
| --- | --- |
| `void` `deep` `abyss` `nebula` | Fonds, du plus noir au plus indigo |
| `ink` `edge` | Bordures et séparateurs |
| `star` `mist` `dim` | Textes, du plus clair au plus discret |
| `accent` `accent-soft` `accent-glow` | Bleu électrique — le seul accent |

Jamais de rouge, d'orange, de jaune ni de vert vif.

**Utilitaires maison** : `type-display`, `type-heading`, `type-luminous`,
`label-mono`, `glass`, `hairline`, `container-x`.

> ⚠️ Ces utilitaires sont déclarés dans `extendTailwindMerge` (`src/lib/utils.ts`).
> En ajouter un nouveau commençant par `text-` sans le déclarer le ferait
> silencieusement supprimer par `cn()`. Préférer le préfixe `type-`.

---

## La scène 3D et les performances

Le décor s'adapte à l'appareil, décidé à l'exécution dans `src/lib/hooks.ts` :

| Niveau | Condition | Rendu |
| --- | --- | --- |
| `low` | Économiseur de données, ≤ 2 Go de RAM, ≤ 2 cœurs | **Ciel CSS**, aucun WebGL — Three.js n'est même pas téléchargé |
| `medium` | Tactile ou écran < 768 px | WebGL allégé : moins d'étoiles, moins d'octaves, DPR ≤ 1,25, pas de parallaxe souris |
| `high` | Ordinateur | Expérience complète, DPR ≤ 1,75 |

`prefers-reduced-motion` force le niveau `low` et désactive Lenis, le curseur
personnalisé et les effets magnétiques.

Les budgets par niveau sont regroupés dans `src/components/3d/quality.ts` :
impossible d'oublier d'alléger quelque chose sur mobile.

**Découpage du code** — Three.js (~877 Ko), GSAP et Lenis sont chargés par
`import()` après le premier rendu. Le bundle critique contient React, Motion et
le contenu, soit ~830 Ko non compressés (~250 Ko en gzip).

---

## Formulaire de contact

`functions/api/contact.ts` est une **Cloudflare Pages Function** : le site reste
100 % statique, seule cette route s'exécute côté serveur. Elle ne dépend d'aucun
paquet npm.

Ce qu'elle fait :

1. Rejette les corps de plus de 12 Ko.
2. Ignore silencieusement le piège à robots (champ caché + envoi trop rapide).
3. Nettoie et borne chaque champ, échappe le HTML avant l'email.
4. Limite à 5 envois par heure et par IP **si** un namespace KV nommé
   `CONTACT_RATE_LIMIT` est associé au projet.
5. Envoie la demande via Resend, plus un accusé de réception au visiteur.
6. Archive dans Supabase si `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont
   définis (table `contact_requests`).

Sans clé Resend configurée, la fonction répond `502` : le visiteur voit alors le
message de repli « écrivez-nous directement » plutôt qu'un faux succès.

### Table Supabase (facultative)

```sql
create table contact_requests (
  id            bigserial primary key,
  created_at    timestamptz default now(),
  activity      text,
  company       text,
  project_type  text,
  goal          text,
  budget        text,
  message       text,
  name          text,
  email         text,
  phone         text,
  brief         text
);
```

---

## Avis clients

Les avis sont stockés dans Supabase et **aucun n'apparaît sans validation**.

### Le parcours

```
Visiteur → « Laisser un avis » → formulaire → POST /api/reviews
        → Supabase, status = "pending"
        → vous approuvez ou refusez
        → seuls les "approved" sont renvoyés par GET /api/reviews
```

### Mise en place, une seule fois

1. Supabase → **SQL Editor** → **New query** → coller `supabase/reviews.sql`
   → **Run**. Le script crée la table, les contraintes, l'index et les règles
   RLS. Il est idempotent : le relancer ne casse rien.
2. Supabase → **Project Settings → API** : relever `Project URL` et la clé
   `anon / public`.
3. Cloudflare Pages → **Settings → Environment variables** : renseigner
   `SUPABASE_URL` et `SUPABASE_ANON_KEY`.

Sans ces variables, la section reste en ligne et affiche son invitation :
la lecture renvoie une liste vide plutôt qu'une erreur.

### Modérer un avis

Supabase → **Table Editor** → `reviews` → colonne `status` :

| Passer à | Effet |
| --- | --- |
| `approved` | l'avis apparaît sur le site en moins d'une minute |
| `rejected` | l'avis n'apparaîtra jamais |

La vue `reviews_pending` liste les avis en attente, les plus anciens d'abord.
Aucun back-office n'a été créé : le Table Editor fait exactement ce travail,
et une interface d'administration maison serait une surface à sécuriser en
plus, pour rien.

En SQL, si vous préférez :

```sql
update public.reviews set status = 'approved' where id = '…';
```

### Ce qu'un visiteur ne peut pas faire

| | |
| --- | --- |
| Publier directement | `status` est écrit par le serveur, jamais lu depuis la requête |
| Forger `status = approved` | refusé par la règle RLS `with check (status = 'pending')` |
| Modifier ou supprimer un avis | aucune policy `update` / `delete` n'existe |
| Lire les avis en attente ou refusés | la policy `select` ne rend visible que `approved` |

Le navigateur ne parle jamais à Supabase : tout passe par
`functions/api/reviews.ts`. La clé anonyme ne quitte pas le serveur, et la
directive `connect-src 'self'` de `public/_headers` reste inchangée.

---

## Artefacts et vignettes

Les artefacts 3D de `public/artefacts/` existent en deux tailles : le fichier
d'origine (768 px, pour l'objet posé en grand) et sa vignette `-sm` (192 px,
pour le pied de page et la liste des canaux). L'export statique interdit
l'optimiseur d'images de Next : sans cette seconde taille, 80 Ko partiraient
pour peindre un carré de 24 px.

Après avoir ajouté ou remplacé un artefact :

```bash
node scripts/artefacts.mjs
```

Puis déclarer les deux chemins dans `src/data/site.ts` (`artifact` et
`artifactSmall`). Les vignettes sont versionnées — elles ne sont pas
régénérées au build.

---

## Variables d'environnement

Copier `.env.example` :

- en `.env.local` pour `npm run dev` ;
- en `.dev.vars` pour `npm run preview` (Wrangler) ;
- dans **Cloudflare Pages → Settings → Environment variables** en production.

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | oui | URL canonique, sitemap, Open Graph |
| `RESEND_API_KEY` | pour le formulaire | Clé API Resend |
| `CONTACT_FROM_EMAIL` | pour le formulaire | Expéditeur vérifié dans Resend |
| `CONTACT_TO_EMAIL` | pour le formulaire | Destinataire des demandes |
| `SUPABASE_URL` | pour les avis | Base des avis, et archivage des demandes |
| `SUPABASE_ANON_KEY` | pour les avis | Lecture et dépôt des avis, borné par RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | non | Archivage des demandes **uniquement** |

> `SUPABASE_SERVICE_ROLE_KEY` contourne les règles RLS. Elle ne sert qu'à
> `/api/contact` et ne doit jamais être exposée au navigateur ni utilisée
> pour les avis. Aucune de ces variables n'est préfixée `NEXT_PUBLIC_` :
> elles restent toutes côté serveur.

`NEXT_PUBLIC_SITE_URL` est lue **au build** : la modifier impose un redéploiement.

---

## Déploiement sur Cloudflare Pages

1. Pousser le dépôt sur GitHub.
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
3. Configuration de build :

   | Réglage | Valeur |
   | --- | --- |
   | Framework preset | `None` |
   | Build command | `npm run build` |
   | Build output directory | `out` |
   | Node version | `20` (variable `NODE_VERSION`) |

4. Ajouter les variables d'environnement.
5. *(Facultatif)* Limitation de débit : créer un namespace KV et l'associer sous
   le nom **`CONTACT_RATE_LIMIT`**.

Le dossier `functions/` est détecté automatiquement : `/api/contact` est servi
par la Pages Function, tout le reste par le CDN.

Déploiement manuel : `npm run deploy`.

Les en-têtes de sécurité et de cache sont dans `public/_headers` — Cloudflare les
applique tels quels. L'export statique ne peut pas passer par `next.config.ts`
pour cela.

---

## SEO

- Métadonnées complètes, Open Graph et Twitter Card (image générée au build).
- `sitemap.xml` et `robots.txt` générés.
- Données structurées Schema.org dans un graphe unique : `Organization`,
  `ProfessionalService` (avec adresse, coordonnées GPS, zone d'intervention et
  catalogue de services), `WebSite`, `FAQPage`.
- Mots-clés locaux ciblés : création site internet Montereau-Fault-Yonne,
  création site web Seine-et-Marne, agence web 77, site internet artisan,
  création landing page, refonte site web.

Toute modification de `src/data/site.ts` ou `src/data/faq.ts` met à jour les
données structurées automatiquement.

---

## Accessibilité

- Contrastes vérifiés : le texte le plus discret (`dim`) est à **4,9:1** sur le
  fond cosmique, au-dessus du seuil WCAG AA.
- Navigation clavier complète, focus visibles, lien d'évitement vers le contenu.
- Accordéons et onglets avec `aria-expanded` / `aria-controls`, comparateur
  avant/après pilotable aux flèches (`role="slider"`).
- `prefers-reduced-motion` coupe le scroll lissé, le curseur personnalisé, la
  scène 3D et l'écran de lancement.
- Les titres animés mot à mot restent lisibles par les lecteurs d'écran grâce à
  `aria-label`.

---

## À faire avant la mise en ligne

Le contenu est réel : quatre missions, trois offres, les vraies coordonnées.
Restent ces points, qui dépendent d'informations ou d'accès extérieurs.

- [x] **Coordonnées** — `kubyza.studio@gmail.com`, `+33 7 66 02 68 44`.
- [x] **Portfolio** — GG Artisan (en ligne), KEYSPNEU77 et E-MULTISERVICE77
      (construits, non publiés), Paristanbul Supermarché (mission à venir).
- [x] **Tarifs** — 199 € / 699 € / 1 399 €, définis dans `pricing.ts`.
- [ ] **Telegram** — seul canal dont l'identifiant diffère des deux autres
      (`kubyzastudio` alors que Snapchat et Instagram sont `kubyza.studio`).
      À confirmer, puis aligner dans `site.ts` ou par `NEXT_PUBLIC_TELEGRAM_URL`.
- [ ] **Domaine** — définir `NEXT_PUBLIC_SITE_URL` sur le domaine final.
- [ ] **Resend** — `CONTACT_TO_EMAIL` est l'adresse Gmail du studio, mais
      `CONTACT_FROM_EMAIL` doit appartenir à un **domaine vérifié** dans Resend :
      une adresse Gmail en expéditeur sera refusée par l'API.
- [ ] **Avis clients** — exécuter `supabase/reviews.sql`, puis renseigner
      `SUPABASE_URL` et `SUPABASE_ANON_KEY` dans Cloudflare Pages. Tant que
      ces deux variables sont absentes, la section reste en ligne et affiche
      son invitation, mais aucun avis ne peut être déposé.
      Voir [Avis clients](#avis-clients).
- [ ] **Mentions légales** — ajouter une page dédiée (obligation légale en
      France pour un site professionnel).
