import "@/integrations/supabase/env-override";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function main() {
  const url = process.env.SUPABASE_URL;
  const projectRef = url?.match(/https:\/\/([^.]+)/)?.[1] ?? "unknown";
  console.log("Using Supabase project:", projectRef);

  const { data, error } = await supabaseAdmin.from("content_pages").select("slug,title").limit(3);
  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }
  console.log("Sample rows:", data);
}

main();
