import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const q = searchParams.get('q') || '';
	const page = Number(searchParams.get('page') || '1');
	const pageSize = Math.min(50, Number(searchParams.get('pageSize') || '20'));
	const from = (page - 1) * pageSize;
	const to = from + pageSize - 1;

	const supabase = createServerSupabase();
	let query = supabase.from('workflows').select('id,slug,title,description,tags,nodes_count,updated_at', { count: 'exact' });
	if (q) {
		query = query.textSearch('search_vector', q, { type: 'websearch' });
	}
	const { data, count, error } = await query.range(from, to);
	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json({ data, count, page, pageSize });
}