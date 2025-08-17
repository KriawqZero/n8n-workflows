import { createServerSupabase } from '@/lib/supabase/server';
import { extractWorkflowText } from '@/lib/search/extract';

async function main() {
	const supabase = createServerSupabase();
	const { data, error } = await supabase.from('workflows').select('id, raw_json');
	if (error) throw error;
	for (const wf of data || []) {
		const { nodes_count, nodes_summary, extracted_text } = extractWorkflowText(wf.raw_json);
		await supabase.from('workflows').update({ nodes_count, nodes_summary, extracted_text }).eq('id', wf.id);
	}
}

main().catch((e) => { console.error(e); process.exit(1); });