import { NextResponse } from 'next/server';

export async function POST(req: Request) {
	const auth = req.headers.get('authorization') || '';
	const token = auth.replace('Bearer ', '');
	if (!token || token !== process.env.CRON_SECRET) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}
	// TODO: invoke scripts/sync_github.ts job or queue
	return NextResponse.json({ ok: true });
}