const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: companies } = await supabase.from("companies").select("*");
  console.log("Companies:", companies);

  const { data: services } = await supabase
    .from("services")
    .select("id, name, category, company_id, branch")
    .limit(5);
  console.log("Services sample:", services);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, role, company_id");
  console.log("Profiles:", profiles);
}

check();
