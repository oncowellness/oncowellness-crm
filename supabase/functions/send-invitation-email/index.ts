import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the calling user is authenticated and has admin/director role
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to check roles
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasPermission = roles?.some(
      (r: any) => r.role === "admin" || r.role === "director"
    );
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: "Sin permisos" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, token, role, inviterName } = await req.json();

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: "Email y token son requeridos" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build the setup link
    // Use the Referer or Origin header to determine the app URL
    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer")?.replace(/\/$/, "") ||
      `${supabaseUrl.replace(".supabase.co", ".lovableproject.com")}`;
    const setupLink = `${origin}/setup?token=${token}`;

    const roleLabels: Record<string, string> = {
      fisioterapeuta: "Fisioterapeuta",
      psiconcologo: "Psico-oncólogo",
      nutricionista: "Nutricionista",
      entrenador: "Entrenador",
      admin: "Administrador",
      director: "Director",
      psicologo: "Psicólogo",
    };

    const roleLabel = roleLabels[role] || role;

    // Send email using Supabase's built-in auth admin
    // Since we don't have a custom email provider, we'll use the admin API
    // to send the invitation through Supabase Auth's invite mechanism
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        invitation_token: token,
        role: role,
        full_name: email.split("@")[0],
      },
      redirectTo: setupLink,
    });

    if (inviteError) {
      console.error("Invite error:", inviteError);
      // If user already exists or invite fails, fall back to generating link
      // The invitation record is already created, so the link still works
      return new Response(
        JSON.stringify({
          success: true,
          method: "link_only",
          setupLink,
          message: `No se pudo enviar el email automáticamente (${inviteError.message}). Comparte el enlace manualmente.`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        method: "email_sent",
        message: `Invitación enviada a ${email}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    console.error("Error:", err);
    const message = err instanceof Error ? err.message : "Error interno";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
