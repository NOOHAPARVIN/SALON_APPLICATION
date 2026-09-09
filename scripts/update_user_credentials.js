/**
 * Helper script to update Super Admin or Owner credentials (email, password, full_name)
 * Usage examples:
 *   node scripts/update_user_credentials.js superadmin@gmail.com newpassword123
 *   node scripts/update_user_credentials.js rospaadmin@gmail.com newpassword123 "New Rospa Owner Name" newemail@gmail.com
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  });
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateUserCredentials() {
  const args = process.argv.slice(2);
  const targetEmail = args[0];
  const newPassword = args[1];
  const newFullName = args[2];
  const newEmail = args[3];

  if (!targetEmail) {
    console.log(`
Usage: node scripts/update_user_credentials.js <CURRENT_EMAIL> [NEW_PASSWORD] [NEW_FULL_NAME] [NEW_EMAIL]

Examples:
1. Change Super Admin password:
   node scripts/update_user_credentials.js superadmin@gmail.com myNewSecretPass!

2. Change Rospa Owner name & password:
   node scripts/update_user_credentials.js rospaadmin@gmail.com newpass123 "Sarah Rospa Owner"

3. Change email and password:
   node scripts/update_user_credentials.js elanadmin@gmail.com newpass123 "Elan Owner" newemail@elan.com
    `);
    return;
  }

  // 1. Find user in Auth list
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error("Error fetching users:", listError.message);
    return;
  }

  const user = usersData.users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());
  if (!user) {
    console.error(`User with email "${targetEmail}" was not found.`);
    return;
  }

  console.log(`Found user: ${user.email} (Role: ${user.user_metadata?.role || 'N/A'})`);

  // 2. Prepare update payload (preserving role, company_id, branch, etc.)
  const updatePayload = {
    user_metadata: {
      ...user.user_metadata
    }
  };

  if (newPassword) {
    updatePayload.password = newPassword;
  }

  if (newEmail) {
    updatePayload.email = newEmail;
    updatePayload.email_confirm = true;
  }

  if (newFullName) {
    updatePayload.user_metadata.full_name = newFullName;
  }

  // 3. Apply update to Auth User
  const { data: updatedData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    updatePayload
  );

  if (updateError) {
    console.error("Failed to update user:", updateError.message);
    return;
  }

  console.log("✅ Credentials updated successfully!");
  console.log("User details after update:");
  console.log("- ID:", updatedData.user.id);
  console.log("- Email:", updatedData.user.email);
  console.log("- Full Name:", updatedData.user.user_metadata?.full_name);
  console.log("- Role (Unchanged):", updatedData.user.user_metadata?.role);
}

updateUserCredentials();
