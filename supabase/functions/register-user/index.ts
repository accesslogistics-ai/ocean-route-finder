import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, fullName } = await req.json() as RegisterRequest;

    // Validate input
    if (!email || !password) {
      console.error("Missing required fields: email or password");
      return new Response(
        JSON.stringify({ error: "Email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!fullName || fullName.trim().length === 0) {
      console.error("Missing required field: fullName");
      return new Response(
        JSON.stringify({ error: "Nome completo é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (fullName.trim().length > 200) {
      console.error("Full name too long");
      return new Response(
        JSON.stringify({ error: "Nome muito longo (máximo 200 caracteres)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      console.error("Password too short");
      return new Response(
        JSON.stringify({ error: "Senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if email is in the whitelist and not expired
    console.log(`Checking whitelist for email: ${email}`);
    const { data: whitelistData, error: whitelistError } = await supabaseAdmin.rpc(
      "check_whitelist_email",
      { p_email: email }
    );

    if (whitelistError) {
      console.error("Error checking whitelist:", whitelistError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar autorização" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!whitelistData || whitelistData.length === 0) {
      console.log("Email not in whitelist");
      return new Response(
        JSON.stringify({ error: "Email não autorizado para cadastro" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const whitelistEntry = whitelistData[0];
    
    if (!whitelistEntry.is_valid) {
      console.log("Whitelist entry expired");
      return new Response(
        JSON.stringify({ error: "Autorização expirada. Entre em contato com o administrador." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      console.log("User already exists");
      return new Response(
        JSON.stringify({ error: "Este email já possui uma conta. Faça login ou recupere sua senha." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user with auto-confirm
    console.log("Creating user");
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

    if (createError || !newUser.user) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError?.message || "Erro ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user.id;

    // Create profile with full_name from form and company/country from whitelist
    console.log("Creating profile for user:", userId);
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: userId,
        email: email.toLowerCase(),
        full_name: fullName.trim(),
        country: whitelistEntry.country,
        company: whitelistEntry.company,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Rollback: delete user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao criar perfil do usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Always assign 'user' role for self-registration (ignore whitelist role)
    console.log("Assigning role: user");
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "user",
      });

    if (roleError) {
      console.error("Error assigning role:", roleError);
      // Rollback: delete profile and user
      await supabaseAdmin.from("profiles").delete().eq("user_id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: "Erro ao atribuir permissões" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User registered successfully:", userId);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Conta criada com sucesso",
        userId 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
