import { createServerSupabase } from '@/lib/supabase/server';
import { extractWorkflowText } from '@/lib/search/extract';
import path from 'node:path';
import fs from 'node:fs/promises';

async function readJsonFiles(dir: string): Promise<string[]> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) files.push(...await readJsonFiles(full));
		else if (entry.isFile() && entry.name.endsWith('.json')) files.push(full);
	}
	return files;
}

function slugify(input: string) {
	return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
	const repoDir = process.env.WORKFLOWS_DIR || path.join(process.cwd(), 'workflows');
	const supabase = createServerSupabase();
	try {
		const files = await readJsonFiles(repoDir);
		for (const file of files) {
			try {
				const rawStr = await fs.readFile(file, 'utf8');
				const raw = JSON.parse(rawStr);
				const title = raw?.name || raw?.workflow?.name || path.basename(file, '.json');
				const description = raw?.description || '';
				const { nodes_count, nodes_summary, extracted_text, tags } = extractWorkflowText(raw);
				const slug = `${slugify(title)}-${Buffer.from(file).toString('base64').slice(0,6)}`;
				const source_url = process.env.WORKFLOWS_SOURCE_URL ? `${process.env.WORKFLOWS_SOURCE_URL}/${path.relative(repoDir, file)}` : null;
				const { error } = await supabase.from('workflows').upsert({
					slug,
					title,
					description,
					tags,
					nodes_count,
					nodes_summary,
					source_path: file,
					source_url,
					raw_json: raw,
					extracted_text,
					premium: true,
				});
				if (error) throw error;
			} catch (e: any) {
				await supabase.from('etl_logs').insert({ kind: 'sync', ref: file, status: 'error', message: e.message });
			}
		}
		await supabase.from('etl_logs').insert({ kind: 'sync', ref: 'batch', status: 'ok', message: 'completed' });
	} catch (e: any) {
		await supabase.from('etl_logs').insert({ kind: 'sync', ref: 'batch', status: 'error', message: e.message });
		process.exitCode = 1;
	}
}

main();