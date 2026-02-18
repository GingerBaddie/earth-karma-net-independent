import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const { data: roleCheck } = await callerClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!roleCheck) throw new Error("Only super admins can manage user status");

    const { user_id, status } = await req.json();
    if (!user_id || !["active", "suspended", "banned"].includes(status)) {
      throw new Error("Invalid user_id or status");
    }

    // Don't allow admins to ban themselves
    if (user_id === caller.id) {
      throw new Error("Cannot change your own account status");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Update profile status
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ account_status: status })
      .eq("user_id", user_id);
    if (profileError) throw profileError;

    // If banned, disable the auth user; if active, re-enable
    if (status === "banned") {
      const { error } = await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: "876600h", // ~100 years
      });
      if (error) throw error;
    } else if (status === "active") {
      const { error } = await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: "none",
      });
      if (error) throw error;
    } else if (status === "suspended") {
      // Suspended: ban for 30 days
      const { error } = await adminClient.auth.admin.updateUserById(user_id, {
        ban_duration: "720h", // 30 days
      });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
