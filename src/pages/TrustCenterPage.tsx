import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { BetaFeedbackWidget } from "../components/trust/BetaFeedbackWidget";
import { DataDeletionPanel } from "../components/trust/DataDeletionPanel";
import { DataExportPanel } from "../components/trust/DataExportPanel";
import { PrivacyPreferencesPanel } from "../components/trust/PrivacyPreferencesPanel";
import { SecurityPanel } from "../components/trust/SecurityPanel";
import { TrustDashboard } from "../components/trust/TrustDashboard";
import { TrustFaq } from "../components/trust/TrustFaq";
import { Card } from "../components/ui/Card";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { AppRoutes } from "../lib/navigation/routes";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { buildTrustDashboard, type TrustDashboardSnapshot } from "../trustCenter";

export function TrustCenterPage() {
  useAppPageTitle("Confiance & Confidentialité");
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<TrustDashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const result = await buildTrustDashboard(user.id, getCurrentDeviceDate());
    setSnapshot(result);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!user?.id) {
    return (
      <PageContainer>
        <p>Connecte-toi pour accéder au centre de confiance.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        label="Confiance"
        title="Confiance & Confidentialité"
        subtitle="Comprends, contrôle et supprime tes données — en toute clarté."
      />

      <div className="trust-center-page" data-testid="trust-center-page">
        <Card className="trust-center-intro aura-glass ds-animate-in">
          <p>
            La confidentialité n&apos;est pas cachée ici. C&apos;est le centre de contrôle
            de vos données personnelles Aura.
          </p>
          <ul className="trust-center-quick-links">
            <li>
              <Link to={AppRoutes.LIFE_KNOWLEDGE}>Ce qu&apos;Aura sait de moi</Link>
            </li>
            <li>
              <Link to={AppRoutes.HOW_AURA_WORKS}>Comment Aura fonctionne</Link>
            </li>
          </ul>
        </Card>

        {loading && <p>Chargement du tableau de bord…</p>}
        {snapshot && !loading && <TrustDashboard snapshot={snapshot} />}

        <PrivacyPreferencesPanel userId={user.id} />
        <DataExportPanel userId={user.id} date={getCurrentDeviceDate()} />
        <DataDeletionPanel userId={user.id} onDeleted={() => void reload()} />
        <SecurityPanel userId={user.id} user={user} />
        <TrustFaq />
        <BetaFeedbackWidget userId={user.id} context="trust-center" />

        <p className="aura-caption trust-center-updated">
          Mis à jour : {snapshot?.generatedAt.slice(0, 16).replace("T", " ") ?? "—"}
        </p>
      </div>
    </PageContainer>
  );
}
