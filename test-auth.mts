import "@/integrations/supabase/env-override";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function main() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error("Failed to list users:", error.message);
    process.exit(1);
  }
  console.log("Users in owner's Supabase:");
  for (const u of data.users) {
    console.log("-", u.email, "provider:", u.app_metadata?.provider ?? "email", "confirmed:", u.email_confirmed_at ? "yes" : "no");
  }
}

main();
