import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    
    // Get user's skills with skill types and community visibility
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select(`
        *,
        skill_type:skill_types(id, name, description, is_language, language_abbreviation, native_name)
      `)
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (skillsError) {
      console.error('Error fetching skills:', skillsError);
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    // Get user's communities
    const { data: communities } = await supabase
      .from('community_members')
      .select('community_id, community:communities(id, name)')
      .eq('profile_id', user.id);

    // Get visibility settings for each skill
    if (skills && skills.length > 0) {
      const skillIds = skills.map((s: any) => s.id);
      const { data: visibility } = await supabase
        .from('community_skill_visibility')
        .select('*')
        .in('skill_id', skillIds);

      // Attach visibility to each skill
      skills.forEach((skill: any) => {
        skill.visibility = visibility?.filter((v: any) => v.skill_id === skill.id) || [];
      });
    }

    return NextResponse.json({
      skills: skills || [],
      communities: communities || [],
    });
  } catch (error) {
    console.error('Skills API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { skill_type_id, description } = body;

    if (!skill_type_id) {
      return NextResponse.json({ error: 'Skill type is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Check if skill already exists
    const { data: existing } = await supabase
      .from('skills')
      .select('id')
      .eq('profile_id', user.id)
      .eq('skill_type_id', skill_type_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Skill already exists' }, { status: 400 });
    }

    // Create new skill
    const insertQuery = supabase
      .from('skills')
      // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
      .insert({
        profile_id: user.id,
        skill_type_id,
        description: description || null,
      })
      .select(`
        *,
        skill_type:skill_types(id, name, description, is_language, language_abbreviation, native_name)
      `)
      .single();
    const { data: skillData, error } = await insertQuery;

    if (error) {
      console.error('Error creating skill:', error);
      return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
    }

    const data = skillData as { id: string; [key: string]: any };

    // Create default visibility for all user's communities (visible by default)
    const { data: communities } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('profile_id', user.id);

    if (communities && communities.length > 0) {
      const visibilityInserts = communities.map((c: any) => ({
        profile_id: user.id,
        community_id: c.community_id,
        skill_id: data.id,
        visible: true,
      }));

      const visibilityInsertQuery = supabase
        .from('community_skill_visibility')
        // @ts-expect-error - Supabase type inference issue with TypeScript 5.x strict mode
        .insert(visibilityInserts);
      await visibilityInsertQuery;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create skill API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
