import { Link } from "react-router-dom";

import { AuraThemeSettings } from "../components/aura/AuraThemeSettings";
import { BetaReleaseSettings } from "../components/release/BetaReleaseSettings";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionHeader } from "../components/ui/SectionHeader";
import { enableDemoMode } from "../demo/demoMode";
import {
  getDailyCheckinPreference,
  setDailyCheckinPreference,
} from "../lib/preferences/dailyCheckinPreference";
import { setCheckinMode } from "../dailyStateEngine";
import { trackInsightEvent } from "../auraInsights/eventStore";
import { AppRoutes } from "../lib/navigation/routes";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { isAuraAdmin } from "../auraInsights/adminAccess";

type SettingsSection = {
  id: string;
  title: string;
  description: string;
  links: { label: string; to: string }[];
};

const SECTIONS: SettingsSection[] = [
  {
    id: "account",
    title: "Compte",
    description: "Profil, foyer et informations personnelles.",
    links: [{ label: "Mon profil", to: AppRoutes.USER_PROFILE }],
  },
  {
    id: "ai",
    title: "IA",
    description: "Compréhension, apprentissage et mémoire.",
    links: [
      { label: "Ce que l'IA sait sur moi", to: AppRoutes.LIFE_KNOWLEDGE },
      { label: "Mon Profil IA", to: AppRoutes.AI_PROFILE },
      { label: "Compréhension IA", to: AppRoutes.SEMANTIC_PLANNING },
    ],
  },
  {
    id: "coach",
    title: "Coach",
    description: "Conseils et accompagnement personnalisé.",
    links: [{ label: "Coach personnel", to: AppRoutes.PERSONAL_COACH }],
  },
  {
    id: "checkin",
    title: "Check-in",
    description: "Ressenti quotidien et historique.",
    links: [
      { label: "Faire le check-in", to: AppRoutes.DAILY_CHECK_IN },
      { label: "Historique ressenti", to: AppRoutes.DAILY_STATE_HISTORY },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Coach, check-in, planning, objectifs et digest.",
    links: [{ label: "Réglages notifications", to: AppRoutes.NOTIFICATION_SETTINGS }],
  },
  {
    id: "privacy",
    title: "Confiance & Confidentialité",
    description: "Centre de contrôle de vos données — transparent et accessible.",
    links: [
      { label: "Confiance & Confidentialité", to: AppRoutes.TRUST_CENTER },
      { label: "Ce qu'Aura sait de moi", to: AppRoutes.LIFE_KNOWLEDGE },
      { label: "Comment Aura fonctionne", to: AppRoutes.HOW_AURA_WORKS },
    ],
  },
  {
    id: "beta",
    title: "Bêta & version",
    description: "Version, canal de release et nouveautés.",
    links: [],
  },
  {
    id: "appearance",
    title: "Apparence",
    description: "Thème Aura, mode clair ou sombre.",
    links: [
      { label: "À propos d'Aura", to: AppRoutes.ABOUT },
      { label: "Mon profil", to: AppRoutes.USER_PROFILE },
    ],
  },
];

export function SettingsPage() {
  const { user } = useAuth();
  const showAdminInsights = isAuraAdmin(user?.email, user?.app_metadata);
  const [checkinEnabled, setCheckinEnabled] = useState(
    user?.id ? getDailyCheckinPreference(user.id).enabled : true,
  );

  function toggleCheckin() {
    if (!user?.id) return;
    const next = !checkinEnabled;
    setCheckinEnabled(next);
    setDailyCheckinPreference(user.id, { enabled: next });
    trackInsightEvent(user.id, next ? "checkin_enabled" : "checkin_disabled", {});
    if (next) {
      setCheckinMode(user.id, "standard");
    }
  }

  return (
    <PageContainer>
      <SectionHeader
        label="Paramètres"
        title="Tout contrôler en un endroit"
        subtitle="Compte, IA, coach, check-in et confidentialité."
      />

      <div className="settings-sections">
        {SECTIONS.map((section) => (
          <Card key={section.id} className="settings-section-card ds-animate-in">
            <h2>{section.title}</h2>
            <p>{section.description}</p>
            {section.id === "beta" && <BetaReleaseSettings />}
            {section.id === "appearance" && (
              <AuraThemeSettings />
            )}
            {section.id === "checkin" && user?.id && (
              <div className="settings-toggle-row">
                <span>Check-in quotidien activé</span>
                <Button
                  variant={checkinEnabled ? "primary" : "secondary"}
                  size="sm"
                  onClick={toggleCheckin}
                  data-testid="settings-checkin-toggle"
                >
                  {checkinEnabled ? "Activé" : "Désactivé"}
                </Button>
              </div>
            )}
            {section.links.length > 0 && (
              <ul className="settings-link-list">
                {section.links.map((link) => (
                  <li key={link.to + link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}

        <Card className="settings-section-card ds-animate-in">
          <h2>Mode démonstration</h2>
          <p>Explorez l&apos;application avec des données fictives.</p>
          <Button
            variant="secondary"
            onClick={() => {
              enableDemoMode();
              window.location.href = AppRoutes.HOME;
            }}
            data-testid="settings-demo-enable"
          >
            Activer le mode démo
          </Button>
        </Card>

        {showAdminInsights && (
          <Card className="settings-section-card ds-animate-in">
            <h2>Admin</h2>
            <p>Métriques anonymisées de la bêta privée.</p>
            <ul className="settings-link-list">
              <li>
                <Link to={AppRoutes.ADMIN_INSIGHTS}>Aura Insights</Link>
              </li>
              <li>
                <Link to={AppRoutes.LAUNCH_CHECKLIST}>Checklist de lancement</Link>
              </li>
            </ul>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
