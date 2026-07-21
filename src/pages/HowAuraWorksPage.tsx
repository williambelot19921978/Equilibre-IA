import { Link } from "react-router-dom";

import { AuraStar } from "../components/aura/AuraStar";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionHeader } from "../components/ui/SectionHeader";
import { AppRoutes } from "../lib/navigation/routes";

const PRINCIPLES = [
  {
    title: "Aura n'agit jamais seule",
    text: "Chaque suggestion attend votre validation. Rien ne se modifie sans votre accord.",
  },
  {
    title: "Aura propose, vous décidez",
    text: "Les recommandations sont des pistes — vous choisissez d'accepter, reporter ou ignorer.",
  },
  {
    title: "Tout est explicable",
    text: "Le bouton « Pourquoi ? » détaille les données utilisées et le niveau de confiance.",
  },
  {
    title: "Vos données, votre contrôle",
    text: "Consultez, modifiez, exportez ou supprimez vos informations à tout moment.",
  },
] as const;

export function HowAuraWorksPage() {
  return (
    <PageContainer>
      <SectionHeader
        label="Transparence"
        title="Comment Aura fonctionne"
        subtitle="Simple, clair, sans jargon technique."
      />

      <section className="how-aura-works" data-testid="how-aura-works">
        <div className="how-aura-works-hero aura-glass aura-rise-in">
          <AuraStar variant="insight" size="lg" />
          <p className="aura-body">
            Aura est votre compagnon de organisation. Il observe ce que vous partagez,
            propose des idées adaptées, et laisse toujours le dernier mot entre vos mains.
          </p>
        </div>

        <ul className="how-aura-works-list">
          {PRINCIPLES.map((item) => (
            <li key={item.title} className="how-aura-works-card aura-glass">
              <h2 className="aura-h3">{item.title}</h2>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>

        <p className="aura-caption">
          <Link to={AppRoutes.TRUST_CENTER}>Retour à Confiance &amp; Confidentialité</Link>
        </p>
      </section>
    </PageContainer>
  );
}
