const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Manually parse .env.local
const envPath = path.join(process.cwd(), ".env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const lines = envContent.split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (key === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = value.trim();
      if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") supabaseAnonKey = value.trim();
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testServicesInsert() {
  console.log("Trying to insert into public.Services...");
  
  const { data, error } = await supabase
    .from("Services")
    .insert([
      {
        name: "Test Service",
        price: 99,
        description: "Test description",
        category: "Hair"
      }
    ])
    .select();

  console.log("Services Insert Response:", { data, error });
}

testServicesInsert();
