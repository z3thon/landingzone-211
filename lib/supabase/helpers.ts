/**
 * Centralized Supabase Database Operation Helpers
 * 
 * These helpers provide a clean interface for Supabase database operations
 * while handling TypeScript 5.x strict mode type inference issues.
 * 
 * Instead of scattering @ts-expect-error across 30+ routes, we centralize
 * the type workaround here. This makes it:
 * - Easier to remove when Supabase fixes the issue
 * - More maintainable and auditable
 * - Type-safe for 95% of the codebase
 * 
 * Usage:
 *   import { dbUpdate, dbInsert, dbUpsert } from '@/lib/supabase/helpers'
 *   import { createServiceRoleClient } from '@/lib/supabase/server'
 * 
 *   const supabase = createServiceRoleClient()
 *   await dbUpdate(supabase, 'profiles', { name: 'John' }, { id: '123' })
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

type TableName = keyof Database['public']['Tables']
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']

type Filter<T extends TableName> = Partial<TableRow<T>>

/**
 * Update a record in the database
 * 
 * @param supabase - Typed Supabase client
 * @param table - Table name (must exist in Database type)
 * @param payload - Update payload matching the table's Update type
 * @param filter - Filter conditions (e.g., { id: '123' })
 * @returns Promise with { data, error } from Supabase
 */
export async function dbUpdate<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T,
  payload: TableUpdate<T>,
  filter: Filter<T>
) {
  // Type assertions needed due to Supabase type inference issue with TypeScript 5.x strict mode
  // This is a known limitation where PostgrestFilterBuilder infers 'never' for update operations
  // See: https://github.com/supabase/supabase-js/issues/1483
  // TODO: Remove this when Supabase fixes the type inference issue
  let query: any = supabase.from(table as any)
  
  // Apply filters
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined) {
      query = query.eq(key, value)
    }
  })

  const updateQuery = query.update(payload as any)
  
  return await updateQuery
}

/**
 * Insert a record into the database
 * 
 * @param supabase - Typed Supabase client
 * @param table - Table name (must exist in Database type)
 * @param payload - Insert payload matching the table's Insert type
 * @returns Promise with { data, error } from Supabase
 */
export async function dbInsert<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T,
  payload: TableInsert<T> | TableInsert<T>[]
) {
  // Type assertions needed due to Supabase type inference issue with TypeScript 5.x strict mode
  // This is a known limitation where PostgrestFilterBuilder infers 'never' for insert operations
  // See: https://github.com/supabase/supabase-js/issues/1483
  // TODO: Remove this when Supabase fixes the type inference issue
  const insertQuery = supabase.from(table as any).insert(payload as any)
  
  return await insertQuery
}

/**
 * Upsert (insert or update) a record in the database
 * 
 * @param supabase - Typed Supabase client
 * @param table - Table name (must exist in Database type)
 * @param payload - Upsert payload matching the table's Insert type
 * @param options - Upsert options (e.g., onConflict)
 * @returns Promise with { data, error } from Supabase
 */
export async function dbUpsert<T extends TableName>(
  supabase: SupabaseClient<Database>,
  table: T,
  payload: TableInsert<T> | TableInsert<T>[],
  options?: { onConflict?: string }
) {
  // Type assertions needed due to Supabase type inference issue with TypeScript 5.x strict mode
  // This is a known limitation where PostgrestFilterBuilder infers 'never' for upsert operations
  // See: https://github.com/supabase/supabase-js/issues/1483
  // TODO: Remove this when Supabase fixes the type inference issue
  const upsertQuery = supabase.from(table as any).upsert(payload as any, options)
  
  return await upsertQuery
}

/**
 * Helper to assert types for query results when TypeScript infers 'never'
 * 
 * Use this when Supabase's select() query returns 'never' type due to
 * TypeScript 5.x strict mode type inference issues.
 * 
 * @param data - Query result data (may be inferred as 'never')
 * @param typeGuard - Type guard function or type assertion
 * @returns Typed data
 */
export function assertQueryResult<T>(
  data: unknown,
  fallbackType: T
): T | null {
  if (data === null || data === undefined) {
    return null
  }
  return data as T
}

