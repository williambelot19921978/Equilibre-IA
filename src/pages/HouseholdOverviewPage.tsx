import { Navigate } from "react-router-dom";

import { DayNavigationBar } from "../components/planning/DayNavigationBar";
import { HouseholdCollaborationConfirmModal } from "../components/householdOverview/HouseholdCollaborationConfirmModal";
import { HouseholdOpportunitiesSection } from "../components/householdOverview/HouseholdOpportunitiesSection";
import { HouseholdAvailabilitySection } from "../components/householdOverview/HouseholdAvailabilitySection";
import { HouseholdGoalsSection } from "../components/householdOverview/HouseholdGoalsSection";
import { HouseholdOverviewSummaryCard } from "../components/householdOverview/HouseholdOverviewSummaryCard";
import { HouseholdPlanningSection } from "../components/householdOverview/HouseholdPlanningSection";
import { HouseholdWorkloadSection } from "../components/householdOverview/HouseholdWorkloadSection";
import { Button } from "../components/ui/Button";
import { isGoalsEnabled } from "../config/featureFlags";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useHouseholdCollaboration } from "../hooks/useHouseholdCollaboration";
import { useHouseholdOverview } from "../hooks/useHouseholdOverview";

export function HouseholdOverviewPage() {
  useAppPageTitle("Foyer");
  const { user } = useAuth();
  const { goToResolvedRoute, AppRoutes } = useAppNavigation();
  const {
    enabled,
    selectedDate,
    setSelectedDate,
    overview,
    opportunities,
    loading,
    error,
  } = useHouseholdOverview(user?.id);
  const {
    pendingProposal,
    preparing,
    openProposalConfirmation,
    cancelProposal,
    confirmProposal,
  } = useHouseholdCollaboration();

  if (!enabled) {
    return <Navigate to={AppRoutes.HOME} replace />;
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="brand-name">Aura</p>
            <h1 data-testid="household-page-title">Foyer</h1>
            <p>
              Vue consolidée du foyer — disponibilités, charge et objectifs.
              Aucune décision automatique.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void goToResolvedRoute()}
          >
            Retour
          </Button>
        </header>

        <DayNavigationBar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p>Construction de la vue foyer…</p>
        ) : overview ? (
          <div className="household-overview-layout">
            <HouseholdOverviewSummaryCard summary={overview.summary} />
            <HouseholdOpportunitiesSection
              opportunities={opportunities}
              onPropose={openProposalConfirmation}
            />
            <HouseholdAvailabilitySection windows={overview.availabilityWindows} />
            <HouseholdWorkloadSection members={overview.members} />
            <HouseholdGoalsSection
              memberGoals={overview.memberGoals}
              goalsEnabled={isGoalsEnabled()}
            />
            <HouseholdPlanningSection notes={overview.planningNotes} />
          </div>
        ) : (
          <section className="household-overview-card">
            <p>Aucune donnée foyer disponible pour cette journée.</p>
          </section>
        )}
      </section>

      <HouseholdCollaborationConfirmModal
        proposal={pendingProposal}
        preparing={preparing}
        onConfirm={() => void confirmProposal()}
        onCancel={cancelProposal}
      />
    </main>
  );
}
