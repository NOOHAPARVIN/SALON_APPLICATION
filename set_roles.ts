import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'd:/salon-app/.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  console.log("Fetching users...");
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error fetching users:", error);
    process.exit(1);
  }

  for (const u of users) {
    if (u.email === 'noohaparvin77@gmail.com') {
      const { error: upsertErr } = await supabase.from('profiles').upsert({ id: u.id, role: 'owner' });
      if (upsertErr) {
        console.error("Error setting owner:", upsertErr);
      } else {
        console.log('Set owner:', u.email);
      }
    }
    if (u.email === 'noohasageer@gmail.com') {
      const { error: upsertErr } = await supabase.from('profiles').upsert({ id: u.id, role: 'receptionist' });
      if (upsertErr) {
        console.error("Error setting receptionist:", upsertErr);
      } else {
        console.log('Set receptionist:', u.email);
      }
    }
  }
  process.exit(0);
}
run();
