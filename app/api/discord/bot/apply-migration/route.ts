import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

/**
 * Apply bot configuration migration
 * POST /api/discord/bot/apply-migration
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin (you might want to add a check for super admin)
    // For now, allow any authenticated user

    const supabase = createServiceRoleClient();

    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '005_add_bot_configuration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct execution if RPC doesn't work
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (stmtError) {
          console.error('Error executing migration statement:', stmtError);
          // Try using raw query if available
          return NextResponse.json(
            { 
              error: 'Failed to apply migration',
              details: 'Please apply the migration manually using Supabase CLI or dashboard',
              migration_file: 'supabase/migrations/005_add_bot_configuration.sql'
            },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration applied successfully',
    });
  } catch (error: any) {
    console.error('Apply migration API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to apply migration',
        details: error?.message || 'Unknown error',
        migration_file: 'supabase/migrations/005_add_bot_configuration.sql',
        instructions: 'Please apply the migration manually using: supabase migration up'
      },
      { status: 500 }
    );
  }
}
