import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

import { SkeletonCard } from "../../components/ui/Skeleton";

function lazyPage<T extends ComponentType<unknown>>(
  loader: () => Promise<{ default: T } | Record<string, T>>,
  exportName = "default",
) {
  return lazy(async () => {
    const module = await loader();
    const component =
      exportName === "default"
        ? (module as { default: T }).default
        : (module as Record<string, T>)[exportName];
    return { default: component };
  });
}

function PageFallback() {
  return (
    <main className="dashboard-page">
      <SkeletonCard />
    </main>
  );
}

export function withPageSuspense(element: ReactNode) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
}

export const LoginPage = lazyPage(() => import("../../pages/LoginPage"), "LoginPage");
export const SignupPage = lazyPage(() => import("../../pages/SignupPage"), "SignupPage");
export const ForgotPasswordPage = lazyPage(() => import("../../pages/ForgotPasswordPage"), "ForgotPasswordPage");
export const ResetPasswordPage = lazyPage(() => import("../../pages/ResetPasswordPage"), "ResetPasswordPage");
export const OnboardingWelcomePage = lazyPage(() => import("../../pages/onboarding/OnboardingWelcomePage"), "OnboardingWelcomePage");
export const OnboardingIntroPage = lazyPage(() => import("../../pages/onboarding/OnboardingIntroPage"), "OnboardingIntroPage");
export const HouseholdPage = lazyPage(() => import("../../pages/HouseholdPage"), "HouseholdPage");
export const ChildrenPage = lazyPage(() => import("../../pages/ChildrenPage"), "ChildrenPage");
export const ProfileOnboardingPage = lazyPage(() => import("../../pages/ProfileOnboardingPage"), "ProfileOnboardingPage");
export const OnboardingCheckinPage = lazyPage(() => import("../../pages/onboarding/OnboardingCheckinPage"), "OnboardingCheckinPage");
export const OnboardingPriorityPage = lazyPage(() => import("../../pages/onboarding/OnboardingPriorityPage"), "OnboardingPriorityPage");
export const OnboardingGoalsPage = lazyPage(() => import("../../pages/onboarding/OnboardingGoalsPage"), "OnboardingGoalsPage");
export const DiscoveryPage = lazyPage(() => import("../../pages/DiscoveryPage"), "DiscoveryPage");
export const HomePage = lazyPage(() => import("../../pages/HomePage"), "HomePage");
export const TasksPage = lazyPage(() => import("../../pages/TasksPage"), "TasksPage");
export const GoalsPage = lazyPage(() => import("../../pages/GoalsPage"), "GoalsPage");
export const PlanningPage = lazyPage(() => import("../../pages/PlanningPage"), "PlanningPage");
export const DailyRoutinePage = lazyPage(() => import("../../pages/DailyRoutinePage"), "DailyRoutinePage");
export const CalendarPage = lazyPage(() => import("../../pages/CalendarPage"), "CalendarPage");
export const FamilyContextPage = lazyPage(() => import("../../pages/FamilyContextPage"), "FamilyContextPage");
export const HouseholdOverviewPage = lazyPage(() => import("../../pages/HouseholdOverviewPage"), "HouseholdOverviewPage");
export const ProfilePage = lazyPage(() => import("../../pages/ProfilePage"), "ProfilePage");
export const SpiritualSpacePage = lazyPage(() => import("../../pages/SpiritualSpacePage"), "SpiritualSpacePage");
export const LeisureSpacePage = lazyPage(() => import("../../pages/LeisureSpacePage"), "LeisureSpacePage");
export const StatisticsPage = lazyPage(() => import("../../pages/StatisticsPage"), "StatisticsPage");
export const MyAiPage = lazyPage(() => import("../../pages/MyAiPage"), "MyAiPage");
export const AssistantPage = lazyPage(() => import("../../pages/AssistantPage"), "AssistantPage");
export const AiProfilePage = lazyPage(() => import("../../pages/AiProfilePage"), "AiProfilePage");
export const PlanningEngineDiagnosticsPage = lazyPage(() => import("../../pages/PlanningEngineDiagnosticsPage"), "PlanningEngineDiagnosticsPage");
export const SettingsPage = lazyPage(() => import("../../pages/SettingsPage"), "SettingsPage");
export const NotificationSettingsPage = lazyPage(() => import("../../pages/NotificationSettingsPage"), "NotificationSettingsPage");
export const CalendarsSettingsPage = lazyPage(() => import("../../pages/CalendarsSettingsPage"), "CalendarsSettingsPage");
export const SemanticPlanningPage = lazyPage(() => import("../../pages/SemanticPlanningPage"), "SemanticPlanningPage");
export const TrustCenterPage = lazyPage(() => import("../../pages/TrustCenterPage"), "TrustCenterPage");
export const HowAuraWorksPage = lazyPage(() => import("../../pages/HowAuraWorksPage"), "HowAuraWorksPage");
export const AuraInsightsAdminPage = lazyPage(() => import("../../pages/AuraInsightsAdminPage"), "AuraInsightsAdminPage");
export const AboutPage = lazyPage(() => import("../../pages/AboutPage"), "AboutPage");
export const WhatsNewPage = lazyPage(() => import("../../pages/WhatsNewPage"), "WhatsNewPage");
export const LaunchChecklistPage = lazyPage(() => import("../../pages/LaunchChecklistPage"), "LaunchChecklistPage");
export const AdaptiveIntelligencePage = lazyPage(() => import("../../pages/AdaptiveIntelligencePage"), "AdaptiveIntelligencePage");
export const ProactiveIntelligencePage = lazyPage(() => import("../../pages/ProactiveIntelligencePage"), "ProactiveIntelligencePage");
export const DailyCheckinPage = lazyPage(() => import("../../pages/DailyCheckinPage"), "DailyCheckinPage");
export const DailyStateHistoryPage = lazyPage(() => import("../../pages/DailyStateHistoryPage"), "DailyStateHistoryPage");
export const PersonalCoachPage = lazyPage(() => import("../../pages/PersonalCoachPage"), "PersonalCoachPage");
export const LifeKnowledgePage = lazyPage(() => import("../../pages/LifeKnowledgePage"), "LifeKnowledgePage");
export const NotFoundPage = lazyPage(() => import("../../pages/NotFoundPage"), "NotFoundPage");
