import { createServerSupabase } from '@/lib/supabase/server';

async function translate(text: string, target: string): Promise<string> {
	// TODO: plug DeepL/Google/OpenAI here
	return text; // no-op placeholder
}

async function main() {
	const supabase = createServerSupabase();
	const { data, error } = await supabase
		.from('workflows')
		.select('id,title,description,extracted_text,title_i18n,description_i18n,extracted_text_i18n')
		.limit(100);
	if (error) throw error;
	for (const wf of data || []) {
		const ptTitle = await translate(wf.title || '', 'pt-BR');
		const ptDesc = await translate(wf.description || '', 'pt-BR');
		const ptText = await translate(wf.extracted_text || '', 'pt-BR');
		await supabase.from('workflows').update({
			title_i18n: { ...(wf.title_i18n || {}), 'pt-BR': ptTitle },
			description_i18n: { ...(wf.description_i18n || {}), 'pt-BR': ptDesc },
			extracted_text_i18n: { ...(wf.extracted_text_i18n || {}), 'pt-BR': ptText },
		}).eq('id', wf.id);
	}
}

main().catch((e) => { console.error(e); process.exit(1); });