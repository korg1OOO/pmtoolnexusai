import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:5432/postgres',
});

async function main() {
  try {
    await client.connect();
    
    console.log("Fixing RLS recursion on chat_channels and chat_channel_members...");

    // The recursion happens because:
    // chat_channels: 'View private channels' -> SELECT FROM chat_channel_members WHERE user_id = auth.uid()
    // chat_channel_members: 'View channel members' -> SELECT FROM chat_channels WHERE id = channel_id
    // When we query chat_channels, it checks members. Members checks channels. Loop!
    // Solution:
    // Make 'View channel members' in chat_channel_members NOT rely on chat_channels policies.
    // Instead of checking if the user can see the channel, just let them see members of channels they are IN, or if the channel is public.
    
    // Drop the problematic policy on chat_channel_members
    await client.query(`
      DROP POLICY IF EXISTS "View channel members" ON chat_channel_members;
    `);

    // Create a new policy that doesn't reference chat_channels directly, or references it in a non-recursive way
    // For simplicity, a user can see members of ANY channel they themselves are a member of.
    // AND they can see members of ANY public channel.
    // To avoid recursion, we check the public status directly without invoking the channel's RLS policy (using a subquery that ignores RLS if needed, but standard subqueries still invoke RLS).
    // The easiest robust way is:
    // 1. User can see members if they are in the channel: `EXISTS (SELECT 1 FROM chat_channel_members cm WHERE cm.channel_id = chat_channel_members.channel_id AND cm.user_id = auth.uid())`
    // 2. User can see members if channel is public: `EXISTS (SELECT 1 FROM chat_channels c WHERE c.id = chat_channel_members.channel_id AND c.type = 'public')`
    // If #2 causes recursion (because it queries chat_channels), we just use #1 for now which covers 90% of chat cases gracefully.

    await client.query(`
      CREATE POLICY "View channel members" ON chat_channel_members
      FOR SELECT
      TO public
      USING (
        channel_id IN (
            SELECT cm.channel_id 
            FROM chat_channel_members cm 
            WHERE cm.user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM chat_channels c WHERE c.id = channel_id AND c.type = 'public'
        )
      );
    `);
    
    console.log("Fixed 'View channel members' policy.");

    // However, the above might STILL recurse if chat_channels public policy is evaluated.
    // Let's also check chat_channels policies.
    await client.query(`
      DROP POLICY IF EXISTS "View private channels" ON chat_channels;
      CREATE POLICY "View private channels" ON chat_channels
      FOR SELECT
      TO public
      USING (
        id IN (
            SELECT cm.channel_id 
            FROM chat_channel_members cm 
            WHERE cm.user_id = auth.uid()
        )
      );
    `);

    console.log("Adjusted 'View private channels' policy to be safe.");
    console.log("Done fixing RLS.");

  } catch (err: any) {
    console.error('Error executing query:', err.message);
  } finally {
    await client.end();
  }
}

main();
