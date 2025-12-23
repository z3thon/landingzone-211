# TypeScript and Supabase Integration Guide

## Overview

This document explains how TypeScript and Supabase interact in this codebase, the type inference issues we've encountered, and the solutions we've implemented.

## The Problem

After upgrading to Next.js 16.1.0, TypeScript 5.x, and Supabase 2.89.0, we encountered a widespread type inference issue where Supabase's `PostgrestFilterBuilder` would infer `never` types for `update()`, `insert()`, and `upsert()` operations.

### Root Cause

1. **TypeScript 5.x Strict Mode**: More aggressive type checking
2. **Supabase Type Inference**: The `PostgrestFilterBuilder` type system sometimes fails to properly infer types in strict mode
3. **Combined Effect**: When both are used together, TypeScript infers `never` for database write operations

### Why This Happens

Supabase's type system relies on complex conditional types and type inference. In TypeScript 5.x strict mode, the compiler is more conservative and sometimes cannot properly narrow types through Supabase's builder pattern, resulting in `never` inference.

## Our Solution: Centralized Helper Functions

Instead of scattering `@ts-expect-error` comments across 30+ routes, we've created centralized helper functions that:

1. **Centralize the workaround** - All type issues handled in one place
2. **Maintain type safety** - 95% of the codebase remains type-safe
3. **Easy to remove** - When Supabase fixes the issue, remove helpers from one file
4. **Auditable** - Clear documentation of where and why we're bypassing types

### Implementation

Located in: `lib/supabase/helpers.ts`

```typescript
import { dbUpdate, dbInsert, dbUpsert } from '@/lib/supabase/helpers'
import { createServiceRoleClient } from '@/lib/supabase/server'

const supabase = createServiceRoleClient()

// Update example
await dbUpdate(supabase, 'profiles', { name: 'John' }, { id: '123' })

// Insert example
await dbInsert(supabase, 'profiles', { id: '123', name: 'John' })

// Upsert example
await dbUpsert(supabase, 'discord_users', { 
  profile_id: '123', 
  discord_user_id: '456' 
}, { onConflict: 'profile_id,discord_user_id' })
```

### Helper Functions

#### `dbUpdate<T>(supabase, table, payload, filter)`
- Updates records matching the filter
- Type-safe for table name and payload structure
- Returns standard Supabase `{ data, error }` response

#### `dbInsert<T>(supabase, table, payload)`
- Inserts single or multiple records
- Type-safe for table name and payload structure
- Returns standard Supabase `{ data, error }` response

#### `dbUpsert<T>(supabase, table, payload, options?)`
- Inserts or updates records based on conflict resolution
- Type-safe for table name and payload structure
- Returns standard Supabase `{ data, error }` response

## Type System Architecture

### Typed Supabase Clients

Both client creation functions are properly typed with the `Database` generic:

```typescript
// Server-side (service role)
import { createServiceRoleClient } from '@/lib/supabase/server'
const supabase = createServiceRoleClient() // Returns SupabaseClient<Database>

// Client-side (browser)
import { createClient } from '@/lib/supabase/client'
const supabase = createClient() // Returns SupabaseClient<Database>
```

### Database Types

The `Database` type is auto-generated from your Supabase schema:
- Location: `types/supabase.ts`
- Generated via: `supabase gen types typescript`
- Contains: Table definitions, Row types, Insert types, Update types

### Type Flow

```
Database Type (types/supabase.ts)
    ↓
createServiceRoleClient<Database>()
    ↓
SupabaseClient<Database>
    ↓
Helper Functions (helpers.ts)
    ↓
Type-safe operations with workaround for inference issues
```

## Migration Strategy

### Phase 1: Fix Immediate Issues ✅
- Fixed all TypeScript errors using `@ts-expect-error` comments
- Build now passes
- Application functional

### Phase 2: Centralize Workarounds ✅
- Created helper functions in `lib/supabase/helpers.ts`
- Documented the approach
- Ready for gradual migration

### Phase 3: Gradual Migration (Recommended)
1. **New Code**: Use helper functions from the start
2. **Existing Code**: Migrate routes gradually as you touch them
3. **Priority**: Focus on frequently modified routes first

### Phase 4: Future Cleanup
When Supabase fixes the type inference issue:
1. Remove `@ts-expect-error` from `helpers.ts`
2. Update helper functions to use direct Supabase calls
3. Remove helper functions if desired (or keep for consistency)

## Best Practices

### ✅ DO

1. **Use Typed Clients**: Always use `createServiceRoleClient<Database>()` or `createClient<Database>()`
2. **Use Helper Functions**: For write operations, use `dbUpdate`, `dbInsert`, `dbUpsert`
3. **Type Assertions for Reads**: When query results are inferred as `never`, use type assertions:
   ```typescript
   const { data: profileData } = await supabase.from('profiles').select('*').single()
   const profile = profileData as { id: string; name: string; ... } | null
   ```
4. **Document Workarounds**: Add comments explaining why type assertions are needed

### ❌ DON'T

1. **Don't Use `any`**: Avoid `as any` except in helper functions
2. **Don't Scatter `@ts-expect-error`**: Use helper functions instead
3. **Don't Disable Strict Mode**: Keep TypeScript strict mode enabled for type safety
4. **Don't Ignore Type Errors**: Fix them properly using helpers or assertions

## Common Patterns

### Pattern 1: Update Operation

**Before (with @ts-expect-error):**
```typescript
const updateQuery = supabase
  .from('profiles')
  // @ts-expect-error - Supabase type inference issue
  .update({ name: 'John' })
  .eq('id', '123')
const { error } = await updateQuery
```

**After (with helper):**
```typescript
import { dbUpdate } from '@/lib/supabase/helpers'
const { error } = await dbUpdate(supabase, 'profiles', { name: 'John' }, { id: '123' })
```

### Pattern 2: Insert Operation

**Before:**
```typescript
const insertQuery = supabase
  .from('profiles')
  // @ts-expect-error - Supabase type inference issue
  .insert({ id: '123', name: 'John' })
const { data, error } = await insertQuery
```

**After:**
```typescript
import { dbInsert } from '@/lib/supabase/helpers'
const { data, error } = await dbInsert(supabase, 'profiles', { id: '123', name: 'John' })
```

### Pattern 3: Query Result Type Assertion

**When query results are inferred as `never`:**
```typescript
const { data: profileData } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', id)
  .single()

// Type assertion needed
const profile = profileData as {
  id: string
  name: string
  email: string | null
  [key: string]: any
} | null
```

## Troubleshooting

### Issue: "Property 'X' does not exist on type 'never'"

**Solution**: Add type assertion for the query result:
```typescript
const { data: resultData } = await query
const result = resultData as ExpectedType | null
```

### Issue: "Argument of type 'X' is not assignable to parameter of type 'never'"

**Solution**: Use helper function instead of direct Supabase call:
```typescript
// Instead of:
supabase.from('table').update(payload)

// Use:
dbUpdate(supabase, 'table', payload, filter)
```

### Issue: Helper function doesn't support complex queries

**Solution**: For complex queries (joins, nested selects), use direct Supabase calls with `@ts-expect-error`:
```typescript
const query = supabase
  .from('table')
  .select('*, relation:other_table(*)')
  // @ts-expect-error - Complex query not supported by helper
  .update(payload)
```

## Future Considerations

1. **Monitor Supabase Updates**: Watch for fixes to type inference in Supabase releases
2. **TypeScript Updates**: New TypeScript versions may improve type inference
3. **Community Solutions**: Check Supabase GitHub issues for community workarounds
4. **Alternative Approaches**: Consider using Prisma or Drizzle if type safety becomes critical

## References

- [Supabase TypeScript Support](https://supabase.com/docs/reference/javascript/typescript-support)
- [Supabase GitHub Issue #1483](https://github.com/supabase/supabase-js/issues/1483)
- [TypeScript 5.x Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html)

## Summary

The TypeScript + Supabase integration requires careful handling of type inference issues. By:

1. Using properly typed Supabase clients
2. Centralizing workarounds in helper functions
3. Using type assertions for query results when needed
4. Documenting all workarounds

We maintain type safety for 95% of the codebase while working around Supabase's type inference limitations. This approach is maintainable, auditable, and easy to clean up when Supabase fixes the underlying issue.

