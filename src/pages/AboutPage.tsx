import { Link } from "react-router-dom";

import { AuraIllustration } from "../components/aura/AuraIllustration";
import { AuraStar } from "../components/aura/AuraStar";
import { Card } from "../components/ui/Card";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionHeader } from "../components/ui/SectionHeader";
import { AURA_BRAND } from "../design-system/aura/brand";
import { AppRoutes } from "../lib/navigation/routes";

export function AboutPage() {
  return (
    <PageContainer>
      <section className="aura-about-page" data-testid="about-page">
        <div className="aura-about-hero aura-glass aura-rise-in">
          <AuraStar variant="achievement" size="lg" />
          <h1 className="aura-h1">{AURA_BRAND.name}</h1>
          <p className="aura-body">{AURA_BRAND.tagline}</p>
        </div>

        <SectionHeader
          label="À propos"
          title="Pourquoi Aura ?"
          subtitle={AURA_BRAND.shortDescription}
        />

        <Card className="aura-glass ds-animate-in">
          <h2 className="aura-h2">Mission</h2>
          <p className="aura-body">{AURA_BRAND.mission}</p>
        </Card>

        <Card className="aura-glass ds-animate-in">
          <h2 className="aura-h2">Vision</h2>
          <p className="aura-body">{AURA_BRAND.vision}</p>
        </Card>

        <Card className="aura-glass ds-animate-in">
          <h2 className="aura-h2">Valeurs</h2>
          <ul className="aura-values-list">
            {AURA_BRAND.values.map((value) => (
              <li key={value}>{value}</li>
            ))}
          </ul>
        </Card>

        <AuraIllustration kind="welcome" />

        <p className="aura-caption">
          <Link to={AppRoutes.SETTINGS}>Retour aux paramètres</Link>
        </p>
      </section>
    </PageContainer>
  );
}
