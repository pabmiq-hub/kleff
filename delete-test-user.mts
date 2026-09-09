import "@/integrations/supabase/env-override";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TEST_EMAIL = "kleff-test-admin@example.com";

async function main() {
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) {
    console.error("Failed to list users:", listErr.message);
    process.exit(1);
  }
  const user = list.users.find((u) => u.email === TEST_EMAIL);
  if (!user) {
    console.log("Test user not found");
    return;
  }
  const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (delErr) {
    console.error("Failed to delete user:", delErr.message);
    process.exit(1);
  }
  console.log("Deleted test user:", user.id);
}

main();
