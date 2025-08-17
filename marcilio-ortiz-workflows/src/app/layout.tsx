import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
	title: 'Marcilio Ortiz Workflows',
	description: 'Biblioteca premium de workflows n8n em português com baixo custo.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="pt-BR" className="h-full bg-white">
			<body className="min-h-screen antialiased text-gray-900">
				{children}
			</body>
		</html>
	);
}