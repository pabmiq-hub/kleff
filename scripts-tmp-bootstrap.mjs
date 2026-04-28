import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing env'); process.exit(1); }

const sb = createClient(url, key);

const EMAIL = 'kleffbcn@gmail.com';
const PASSWORD = 'Kleff2019++';

// Check if user exists
const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
let user = list.users.find(u => u.email?.toLowerCase() === EMAIL);
if (!user) {
  const { data, error } = await sb.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'KLEFF Super Admin' },
  });
  if (error) { console.error('createUser:', error.message); process.exit(1); }
  user = data.user;
  console.log('Created user', user.id);
} else {
  console.log('User already exists', user.id);
  // Reset password just in case
  await sb.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true });
}

// Insert profile if missing (required because RLS/profiles, but service role bypasses)
const { data: prof } = await sb.from('profiles').select('id').eq('id', user.id).maybeSingle();
if (!prof) {
  // Need encrypted dni placeholder
  const { data: enc, error: encErr } = await sb.rpc('encrypt_id_document', { _plain: 'BOOTSTRAP-ADMIN' });
  if (encErr) { console.error('encrypt:', encErr.message); process.exit(1); }
  const { ciphertext, nonce } = Array.isArray(enc) ? enc[0] : enc;
  const { error: pErr } = await sb.from('profiles').insert({
    id: user.id,
    username: 'kleff_admin',
    full_name: 'KLEFF Super Admin',
    date_of_birth: '1990-01-01',
    gender: 'prefer_not_to_say',
    id_document_encrypted: ciphertext,
    id_document_nonce: nonce,
  });
  if (pErr) console.error('profile insert:', pErr.message);
  else console.log('Profile created');
}

// Assign super_admin role
const { error: rErr } = await sb.from('user_roles').upsert({ user_id: user.id, role: 'super_admin' }, { onConflict: 'user_id,role' });
if (rErr) console.error('role:', rErr.message);
else console.log('super_admin role assigned');

console.log('DONE');
