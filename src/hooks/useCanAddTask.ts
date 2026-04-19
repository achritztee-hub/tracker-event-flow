import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCanAddTask() {
  const { user, profile } = useAuth();
  const [canAdd, setCanAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!user || !profile?.role_id) {
        if (!cancelled) {
          setCanAdd(false);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("roles_capacity")
        .select("can_add_task")
        .eq("role_id", profile.role_id)
        .maybeSingle();
      if (!cancelled) {
        setCanAdd(!!data?.can_add_task);
        setLoading(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.role_id]);

  return { canAdd, loading };
}
