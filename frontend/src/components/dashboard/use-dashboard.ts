"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { getErrorMessage } from "@/lib/api";
import { dashboardApi } from "@/lib/domain-api";
import type { DashboardOverview } from "@/lib/types";

export function useDashboard() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    let active = true;
    dashboardApi
      .overview(token)
      .then((response) => {
        if (active) setDashboard(response.data.dashboard);
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(getErrorMessage(error), "Unable to load dashboard");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [toast, token]);

  return { dashboard, loading, user };
}
