import 'dotenv/config';
const token = process.env.SUPABASE_ACCESS_TOKEN;
async function q(sql) {
  const r = await fetch('https://api.supabase.com/v1/projects/rlnaylyjxjjaqzwpuhar/database/query', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  return { s: r.status, d: await r.text() };
}

// First get ALL columns in public.users
const r1 = await q(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='users' ORDER BY ordinal_position;`);
console.log('users cols:', r1.d);

// Update handle_new_user to also insert into public.users
const fixSql = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $BODY$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

  -- Also insert into public.users if it exists
  BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, role)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', ''),
      new.raw_user_meta_data->>'avatar_url',
      'user'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url;
  EXCEPTION WHEN others THEN
    -- Silently skip if users table doesn't match
    RAISE WARNING 'handle_new_user: users insert failed: %', SQLERRM;
  END;

  RETURN new;
END;
$BODY$ LANGUAGE plpgsql SECURITY DEFINER;
`;

const r2 = await q(fixSql);
console.log('\nTrigger update:', r2.s, r2.d);
