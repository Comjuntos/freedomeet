import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { getPlan, type PlanId } from "@/lib/plans";
import { getPaddleEnvironment } from "@/lib/paddle";

export type Access = {
  isAdmin: boolean;
  planId: PlanId;
  plan: ReturnType<typeof getPlan>;
  loading: boolean;
};

/**
 * Acesso do usuário: quem tem assinatura paga ativa recebe o papel de
 * administrador (concedido pelo banco quando a assinatura fica ativa).
 */
export function useAccess(): Access {
  const { data, isLoading } = useQuery({
    queryKey: ["access"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return { isAdmin: false, planId: "gratuito" as PlanId };

      const environment = getPaddleEnvironment();
      const [{ data: roles }, { data: sub }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase
          .from("subscriptions")
          .select("plan_id, status")
          .eq("user_id", uid)
          .eq("environment", environment)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const isActive =
        sub?.status === "active" ||
        sub?.status === "trialing" ||
        (sub?.status === "canceled" && false); // grace period: se quiser, adicionar lógica de current_period_end

      return {
        isAdmin: (roles ?? []).some((r) => r.role === "admin"),
        planId: (isActive ? sub?.plan_id : "gratuito") as PlanId,
      };
    },
  });

  const planId = data?.planId ?? "gratuito";
  return {
    isAdmin: data?.isAdmin ?? false,
    planId,
    plan: getPlan(planId),
    loading: isLoading,
  };
}
