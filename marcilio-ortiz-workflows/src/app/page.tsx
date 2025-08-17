export default function HomePage() {
	return (
		<main className="mx-auto max-w-6xl px-6 py-16">
			<section className="text-center space-y-6">
				<h1 className="text-4xl md:text-6xl font-bold">Marcilio Ortiz Workflows</h1>
				<p className="text-lg md:text-xl text-gray-600">
					Biblioteca com 2.000+ templates n8n traduzidos para português. Assine por R$ 39,90/mês
					ou R$ 79,90/trimestre e ganhe acesso completo.
				</p>
				<div className="flex items-center justify-center gap-3">
					<a href="/pricing" className="rounded-md bg-brand text-white px-5 py-3 font-medium">Ver planos</a>
					<a href="/catalog" className="rounded-md border px-5 py-3 font-medium">Explorar catálogo</a>
				</div>
			</section>
		</main>
	);
}