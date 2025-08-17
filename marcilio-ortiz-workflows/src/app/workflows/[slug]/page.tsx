interface PageProps {
	params: { slug: string };
}

export default function WorkflowPage({ params }: PageProps) {
	return (
		<main className="mx-auto max-w-3xl px-6 py-12">
			<h1 className="text-2xl font-bold mb-2">Workflow: {params.slug}</h1>
			<p className="text-gray-600">Conteúdo completo disponível para assinantes.</p>
		</main>
	);
}