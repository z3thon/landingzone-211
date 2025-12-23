import { getCurrentUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Verify certification belongs to user
    const { data: cert } = await supabase
      .from('certifications')
      .select('id')
      .eq('id', params.id)
      .eq('profile_id', user.id)
      .single();

    if (!cert) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${params.id}-${Date.now()}.${fileExt}`;
    const filePath = `certifications/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certifications')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('certifications')
      .getPublicUrl(filePath);

    // Update certification with file URL
    const { data, error } = await supabase
      .from('certifications')
      .update({
        file_url: urlData.publicUrl,
        attachment_type: 'file',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(`
        *,
        certification_type:certification_types(id, name, description)
      `)
      .single();

    if (error) {
      console.error('Error updating certification:', error);
      return NextResponse.json({ error: 'Failed to update certification' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
