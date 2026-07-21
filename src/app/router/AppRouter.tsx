import { Route, Routes } from "react-router-dom";

import { AuthenticatedAppLayout } from "../layouts/AuthenticatedAppLayout";
import { AppRoutes } from "../../lib/navigation/routes";
import { AdminRoute } from "./AdminRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicAuthRoute, RootRedirect } from "./PublicAuthRoute";
import { DailyCheckinGate } from "../../components/dailyState/DailyCheckinGate";
import {
  TrustCenterPage,
  HowAuraWorksPage,
  AuraInsightsAdminPage,
  AboutPage,
  WhatsNewPage,
  LaunchChecklistPage,
  AdaptiveIntelligencePage,
  AiProfilePage,
  AssistantPage,
  CalendarPage,
  CalendarsSettingsPage,
  ChildrenPage,
  DailyCheckinPage,
  DailyRoutinePage,
  DailyStateHistoryPage,
  DiscoveryPage,
  FamilyContextPage,
  ForgotPasswordPage,
  GoalsPage,
  HomePage,
  HouseholdOverviewPage,
  HouseholdPage,
  LeisureSpacePage,
  LifeKnowledgePage,
  LoginPage,
  MyAiPage,
  NotFoundPage,
  OnboardingCheckinPage,
  OnboardingGoalsPage,
  OnboardingIntroPage,
  OnboardingPriorityPage,
  OnboardingWelcomePage,
  PersonalCoachPage,
  PlanningEngineDiagnosticsPage,
  PlanningPage,
  ProfileOnboardingPage,
  ProfilePage,
  ProactiveIntelligencePage,
  ResetPasswordPage,
  SemanticPlanningPage,
  SettingsPage,
  NotificationSettingsPage,
  SignupPage,
  SpiritualSpacePage,
  StatisticsPage,
  TasksPage,
  withPageSuspense,
} from "./lazyPages";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path={AppRoutes.SIGNUP}
        element={
          <PublicAuthRoute>
            {withPageSuspense(<SignupPage />)}
          </PublicAuthRoute>
        }
      />

      <Route
        path={AppRoutes.LOGIN}
        element={
          <PublicAuthRoute>
            {withPageSuspense(<LoginPage />)}
          </PublicAuthRoute>
        }
      />

      <Route
        path={AppRoutes.FORGOT_PASSWORD}
        element={
          <PublicAuthRoute>
            {withPageSuspense(<ForgotPasswordPage />)}
          </PublicAuthRoute>
        }
      />

      <Route path={AppRoutes.RESET_PASSWORD} element={withPageSuspense(<ResetPasswordPage />)} />

      <Route element={<ProtectedRoute />}>
        <Route path={AppRoutes.ONBOARDING_WELCOME} element={withPageSuspense(<OnboardingWelcomePage />)} />
        <Route path={AppRoutes.ONBOARDING_INTRO} element={withPageSuspense(<OnboardingIntroPage />)} />
        <Route path={AppRoutes.HOUSEHOLD} element={withPageSuspense(<HouseholdPage />)} />
        <Route path={AppRoutes.CHILDREN} element={withPageSuspense(<ChildrenPage />)} />
        <Route path={AppRoutes.PROFILE} element={withPageSuspense(<ProfileOnboardingPage />)} />
        <Route path={AppRoutes.ONBOARDING_CHECKIN} element={withPageSuspense(<OnboardingCheckinPage />)} />
        <Route path={AppRoutes.ONBOARDING_PRIORITY} element={withPageSuspense(<OnboardingPriorityPage />)} />
        <Route path={AppRoutes.ONBOARDING_GOALS} element={withPageSuspense(<OnboardingGoalsPage />)} />
        <Route path={AppRoutes.DISCOVERY} element={withPageSuspense(<DiscoveryPage />)} />

        {/* Check-in hors DailyCheckinGate (évite boucle) mais dans le shell authentifié. */}
        <Route element={<AuthenticatedAppLayout />}>
          <Route path={AppRoutes.DAILY_CHECK_IN} element={withPageSuspense(<DailyCheckinPage />)} />
        </Route>

        <Route
          element={
            <DailyCheckinGate>
              <AuthenticatedAppLayout />
            </DailyCheckinGate>
          }
        >
          <Route path={AppRoutes.HOME} element={withPageSuspense(<HomePage />)} />
          <Route path={AppRoutes.PLANNING} element={withPageSuspense(<PlanningPage />)} />
          <Route path={AppRoutes.CALENDAR} element={withPageSuspense(<CalendarPage />)} />
          <Route path={AppRoutes.TASKS} element={withPageSuspense(<TasksPage />)} />
          <Route path={AppRoutes.GOALS} element={withPageSuspense(<GoalsPage />)} />
          <Route path={AppRoutes.DAILY_ROUTINE} element={withPageSuspense(<DailyRoutinePage />)} />
          <Route path={AppRoutes.FAMILY_CONTEXT} element={withPageSuspense(<FamilyContextPage />)} />
          <Route path={AppRoutes.HOUSEHOLD_OVERVIEW} element={withPageSuspense(<HouseholdOverviewPage />)} />
          <Route path={AppRoutes.USER_PROFILE} element={withPageSuspense(<ProfilePage />)} />
          <Route path={AppRoutes.SPIRITUAL} element={withPageSuspense(<SpiritualSpacePage />)} />
          <Route path={AppRoutes.LEISURE} element={withPageSuspense(<LeisureSpacePage />)} />
          <Route path={AppRoutes.STATISTICS} element={withPageSuspense(<StatisticsPage />)} />
          <Route path={AppRoutes.MY_AI} element={withPageSuspense(<MyAiPage />)} />
          <Route path={AppRoutes.ASSISTANT} element={withPageSuspense(<AssistantPage />)} />
          <Route path={AppRoutes.AI_PROFILE} element={withPageSuspense(<AiProfilePage />)} />
          <Route path={AppRoutes.PLANNING_ENGINE} element={withPageSuspense(<PlanningEngineDiagnosticsPage />)} />
          <Route path={AppRoutes.SETTINGS} element={withPageSuspense(<SettingsPage />)} />
          <Route path={AppRoutes.TRUST_CENTER} element={withPageSuspense(<TrustCenterPage />)} />
          <Route path={AppRoutes.HOW_AURA_WORKS} element={withPageSuspense(<HowAuraWorksPage />)} />
          <Route path={AppRoutes.NOTIFICATION_SETTINGS} element={withPageSuspense(<NotificationSettingsPage />)} />
          <Route path={AppRoutes.CALENDARS_SETTINGS} element={withPageSuspense(<CalendarsSettingsPage />)} />
          <Route path={AppRoutes.SEMANTIC_PLANNING} element={withPageSuspense(<SemanticPlanningPage />)} />
          <Route path={AppRoutes.ADAPTIVE_INTELLIGENCE} element={withPageSuspense(<AdaptiveIntelligencePage />)} />
          <Route path={AppRoutes.PROACTIVE_INTELLIGENCE} element={withPageSuspense(<ProactiveIntelligencePage />)} />
          <Route path={AppRoutes.DAILY_STATE_HISTORY} element={withPageSuspense(<DailyStateHistoryPage />)} />
          <Route path={AppRoutes.PERSONAL_COACH} element={withPageSuspense(<PersonalCoachPage />)} />
          <Route path={AppRoutes.LIFE_KNOWLEDGE} element={withPageSuspense(<LifeKnowledgePage />)} />
          <Route path={AppRoutes.ABOUT} element={withPageSuspense(<AboutPage />)} />
          <Route path={AppRoutes.WHATS_NEW} element={withPageSuspense(<WhatsNewPage />)} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route
            element={
              <DailyCheckinGate>
                <AuthenticatedAppLayout />
              </DailyCheckinGate>
            }
          >
            <Route path={AppRoutes.ADMIN_INSIGHTS} element={withPageSuspense(<AuraInsightsAdminPage />)} />
            <Route path={AppRoutes.LAUNCH_CHECKLIST} element={withPageSuspense(<LaunchChecklistPage />)} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={withPageSuspense(<NotFoundPage />)} />
    </Routes>
  );
}
