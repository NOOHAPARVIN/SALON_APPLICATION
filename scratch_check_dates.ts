import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    process.env[key.trim()] = val.join('=').trim();
  }
});

const { createClient } = require('@supabase/supabase-js');
const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(url, key);

function isDateInTargetPeriod(dateInput: Date | string, viewMode: string, referenceDate = new Date()): boolean {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return false;

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  if (viewMode === "day") {
    return target.getTime() === ref.getTime();
  }

  if (viewMode === "week") {
    const dayOfWeek = ref.getDay(); // 0 = Sun
    const startOfWeek = new Date(ref);
    startOfWeek.setDate(ref.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return target >= startOfWeek && target <= endOfWeek;
  }

  if (viewMode === "month") {
    return target.getFullYear() === ref.getFullYear() && target.getMonth() === ref.getMonth();
  }

  if (viewMode === "year") {
    return target.getFullYear() === ref.getFullYear();
  }

  return true;
}

async function main() {
  const { data: bookings } = await supabase.from("bookings").select("*");

  console.log("=== ALL BRANCHES ===");
  ['day', 'week', 'month', 'year'].forEach(viewMode => {
    let sales = 0;
    let appts = 0;
    const clients = new Set();

    bookings.forEach((b: any) => {
      const apptDateStr = b.appointment_date || b.created_at;
      if (isDateInTargetPeriod(apptDateStr, viewMode)) {
        appts++;
        if (b.phone) clients.add(b.phone);
        const val = Number(b.total || b.price || 0);
        if (b.status === "completed" || b.payment_status === "paid" || b.status === "confirmed") {
          sales += val;
        }
      }
    });

    console.log(`[ViewMode: ${viewMode}] -> Sales: QR ${sales}, Appts: ${appts}, Clients: ${clients.size}`);
  });

  console.log("\n=== BRANCH = ELAN ===");
  const elanBookings = bookings.filter((b: any) => b.branch === "elan" || b.branch === "Elan");
  ['day', 'week', 'month', 'year'].forEach(viewMode => {
    let sales = 0;
    let appts = 0;
    const clients = new Set();

    elanBookings.forEach((b: any) => {
      const apptDateStr = b.appointment_date || b.created_at;
      if (isDateInTargetPeriod(apptDateStr, viewMode)) {
        appts++;
        if (b.phone) clients.add(b.phone);
        const val = Number(b.total || b.price || 0);
        if (b.status === "completed" || b.payment_status === "paid" || b.status === "confirmed") {
          sales += val;
        }
      }
    });

    console.log(`[ViewMode: ${viewMode}] -> Sales: QR ${sales}, Appts: ${appts}, Clients: ${clients.size}`);
  });
}

main();
