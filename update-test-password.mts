import "@/integrations/supabase/env-override";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const TEST_EMAIL = "kleff-test-admin@example.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD;

async function main() {
  if (!TEST_PASSWORD) {
    console.error("TEST_PASSWORD env var is required");
    process.exit(1);
  }
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const user = list.users.find((u) => u.email === TEST_EMAIL);
  if (!user) {
    console.error("Test user not found");
    process.exit(1);
  }
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: TEST_PASSWORD,
  });
  if (error) {
    console.error("Failed to update password:", error.message);
    process.exit(1);
  }
  console.log("Updated password for", TEST_EMAIL);
}

main();
