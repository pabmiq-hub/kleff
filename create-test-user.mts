import "@/integrations/supabase/env-override";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TEST_EMAIL = "kleff-test-admin@example.com";
const TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

async function main() {
  if (!TEST_ADMIN_PASSWORD) {
    console.error("TEST_ADMIN_PASSWORD env var is required");
    process.exit(1);
  }

  // Create or recreate user
  const { data: existing, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    console.error("Failed to list users:", listErr.message);
    process.exit(1);
  }
  const existingUser = existing.users.find((u) => u.email === TEST_EMAIL);
  if (existingUser) {
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    if (delErr) {
      console.error("Failed to delete existing test user:", delErr.message);
      process.exit(1);
    }
    console.log("Deleted existing test user");
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_ADMIN_PASSWORD,
    email_confirm: true,
    app_metadata: { provider: "email" },
  });
  if (error || !data.user) {
    console.error("Failed to create user:", error?.message ?? "no user");
    process.exit(1);
  }
  console.log("Created user:", data.user.id);

  const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
    user_id: data.user.id,
    role: "super_admin",
  });
  if (roleErr) {
    console.error("Failed to assign role:", roleErr.message);
    process.exit(1);
  }
  console.log("Assigned super_admin role");
}

main();
