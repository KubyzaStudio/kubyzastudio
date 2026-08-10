import { site } from "@/data/site";
import { services } from "@/data/services";
import { plans } from "@/data/pricing";
import { faq } from "@/data/faq";

/**
 * Données structurées Schema.org.
 * Un seul graphe : Google relie les entités entre elles via leurs `@id`.
 */
export function JsonLd() {
  const graph = [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      slogan: site.tagline,
      description: site.description,
      email: site.contact.email,
      telephone: site.contact.phoneRaw,
      areaServed: site.location.areaServed.map((name) => ({
        "@type": "AdministrativeArea",
        name,
      })),
      sameAs: site.socials.map((s) => s.href),
    },
    {
      "@type": "ProfessionalService",
      "@id": `${site.url}/#localbusiness`,
      name: site.name,
      image: `${site.url}/opengraph-image`,
      url: site.url,
      email: site.contact.email,
      telephone: site.contact.phoneRaw,
      // La fourchette réelle des missions, pas un nombre de symboles vague.
      priceRange: `${plans[0].from}€ – ${plans[plans.length - 1].from}€`,
      description: site.description,
      parentOrganization: { "@id": `${site.url}/#organization` },
      address: {
        "@type": "PostalAddress",
        addressLocality: site.location.city,
        addressRegion: site.location.region,
        postalCode: site.location.postalCode,
        addressCountry: site.location.countryCode,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: site.location.latitude,
        longitude: site.location.longitude,
      },
      areaServed: site.location.areaServed.map((name) => ({
        "@type": "AdministrativeArea",
        name,
      })),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Nos missions",
        itemListElement: [
          /*
            Les trois paliers portent un prix réel : c'est ce qui permet à
            Google d'afficher « à partir de 199 € » plutôt que rien. Les
            prestations suivent, sans prix — elles se combinent.
          */
          ...plans.map((plan) => ({
            "@type": "Offer",
            name: plan.name,
            description: plan.pitch,
            price: plan.from,
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            itemOffered: {
              "@type": "Service",
              name: plan.name,
              description: plan.features.join(". "),
              provider: { "@id": `${site.url}/#organization` },
              areaServed: site.location.region,
            },
          })),
          ...services.map((service) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: service.title,
              description: service.description,
              serviceType: service.title,
              provider: { "@id": `${site.url}/#organization` },
              areaServed: site.location.region,
            },
          })),
        ],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: site.description,
      inLanguage: "fr-FR",
      publisher: { "@id": `${site.url}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${site.url}/#faq`,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Contenu statique issu de nos propres fichiers de données.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
