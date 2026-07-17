import { Route, Routes } from "react-router-dom";

import { AuthenticatedAppLayout } from "../layouts/AuthenticatedAppLayout";
import { AppRoutes } from "../../lib/navigation/routes";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicAuthRoute, RootRedirect } from "./PublicAuthRoute";

import { LoginPage } from "../../pages/LoginPage";
import { SignupPage } from "../../pages/SignupPage";
import { HomePage } from "../../pages/HomePage";
import { HouseholdPage } from "../../pages/HouseholdPage";
import { ChildrenPage } from "../../pages/ChildrenPage";
import { ProfileOnboardingPage } from "../../pages/ProfileOnboardingPage";
import { DiscoveryPage } from "../../pages/DiscoveryPage";
import { TasksPage } from "../../pages/TasksPage";
import { PlanningPage } from "../../pages/PlanningPage";
import { DailyRoutinePage } from "../../pages/DailyRoutinePage";
import { CalendarPage } from "../../pages/CalendarPage";
import { FamilyContextPage } from "../../pages/FamilyContextPage";
import { ProfilePage } from "../../pages/ProfilePage";
import { SpiritualSpacePage } from "../../pages/SpiritualSpacePage";
import { LeisureSpacePage } from "../../pages/LeisureSpacePage";
import { StatisticsPage } from "../../pages/StatisticsPage";
import { MyAiPage } from "../../pages/MyAiPage";
import { NotFoundPage } from "../../pages/NotFoundPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path={AppRoutes.SIGNUP}
        element={
          <PublicAuthRoute>
            <SignupPage />
          </PublicAuthRoute>
        }
      />

      <Route
        path={AppRoutes.LOGIN}
        element={
          <PublicAuthRoute>
            <LoginPage />
          </PublicAuthRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route path={AppRoutes.HOUSEHOLD} element={<HouseholdPage />} />
        <Route path={AppRoutes.CHILDREN} element={<ChildrenPage />} />
        <Route path={AppRoutes.PROFILE} element={<ProfileOnboardingPage />} />
        <Route path={AppRoutes.DISCOVERY} element={<DiscoveryPage />} />

        <Route element={<AuthenticatedAppLayout />}>
          <Route path={AppRoutes.HOME} element={<HomePage />} />
          <Route path={AppRoutes.PLANNING} element={<PlanningPage />} />
          <Route path={AppRoutes.CALENDAR} element={<CalendarPage />} />
          <Route path={AppRoutes.TASKS} element={<TasksPage />} />
          <Route path={AppRoutes.DAILY_ROUTINE} element={<DailyRoutinePage />} />
          <Route path={AppRoutes.FAMILY_CONTEXT} element={<FamilyContextPage />} />
          <Route path={AppRoutes.USER_PROFILE} element={<ProfilePage />} />
          <Route path={AppRoutes.SPIRITUAL} element={<SpiritualSpacePage />} />
          <Route path={AppRoutes.LEISURE} element={<LeisureSpacePage />} />
          <Route path={AppRoutes.STATISTICS} element={<StatisticsPage />} />
          <Route path={AppRoutes.MY_AI} element={<MyAiPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
