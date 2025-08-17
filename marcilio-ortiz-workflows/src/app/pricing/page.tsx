export default function PricingPage() {
	return (
		<main className="mx-auto max-w-5xl px-6 py-16">
			<h1 className="text-3xl font-bold mb-8">Planos</h1>
			<div className="grid md:grid-cols-2 gap-6">
				<div className="border rounded-lg p-6">
					<h2 className="text-xl font-semibold">Mensal</h2>
					<p className="text-3xl font-bold">R$ 39,90<span className="text-base font-normal">/mês</span></p>
					<p className="text-gray-600">Acesso completo a todos os workflows premium.</p>
					<form action="/api/checkout" method="post">
						<input type="hidden" name="priceId" value="price_monthly_placeholder" />
						<button className="mt-4 w-full rounded-md bg-brand text-white px-4 py-2">Assinar</button>
					</form>
				</div>
				<div className="border rounded-lg p-6">
					<h2 className="text-xl font-semibold">Trimestral</h2>
					<p className="text-3xl font-bold">R$ 79,90<span className="text-base font-normal">/3 meses</span></p>
					<p className="text-gray-600">Economize pagando trimestralmente.</p>
					<form action="/api/checkout" method="post">
						<input type="hidden" name="priceId" value="price_quarterly_placeholder" />
						<button className="mt-4 w-full rounded-md bg-brand text-white px-4 py-2">Assinar</button>
					</form>
				</div>
			</div>
		</main>
	);
}