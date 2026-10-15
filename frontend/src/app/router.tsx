import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { DashboardPage } from "../pages/DashboardPage";
import { InspectionsListPage } from "../pages/InspectionsListPage";
import { InspectionDetailPage } from "../pages/InspectionDetailPage";
import { NewInspectionPage } from "../pages/NewInspectionPage";
import { LiveCapturePage } from "../pages/LiveCapturePage";
import { AssetsPage } from "../pages/AssetsPage";
import { ProfilesPage } from "../pages/ProfilesPage";
import { IncidentsPage } from "../pages/IncidentsPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { AppLayout } from "../components/AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/app",
    element: (
      <AppLayout>
        <DashboardPage />
      </AppLayout>
    ),
  },
  {
    path: "/app/inspections",
    element: (
      <AppLayout>
        <InspectionsListPage />
      </AppLayout>
    ),
  },
  {
    path: "/app/inspections/new",
    element: (
      <AppLayout>
        <NewInspectionPage />
      </AppLayout>
    ),
  },
  {
    path: "/app/inspections/:id",
    element: (
      <AppLayout>
        <InspectionDetailPage />
      </AppLayout>
    ),
  },
  {
    path: "/app/live-capture",
    element: (
      <AppLayout>
        <LiveCapturePage />
      </AppLayout>
    ),
  },
  {
    path: "/app/assets",
    element: (
      <AppLayout>
        <AssetsPage />
      </AppLayout>
    ),
  },
  {
    path: "/app/profiles",
    element: (
      <AppLayout>
        <ProfilesPage />
      </AppLayout>
    ),
  },
  {
    path: "/app/incidents",
    element: (
      <AppLayout>
        <IncidentsPage />
      </AppLayout>
    ),
  },
  {
    path: "/app/analytics",
    element: (
      <AppLayout>
        <AnalyticsPage />
      </AppLayout>
    ),
  },
  {
    path: "/app/settings",
    element: (
      <AppLayout>
        <SettingsPage />
      </AppLayout>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/app" replace />,
  },
]);
