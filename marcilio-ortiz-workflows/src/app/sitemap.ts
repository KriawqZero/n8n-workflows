import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
	return [
		{ url: `${base}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
		{ url: `${base}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
		{ url: `${base}/catalog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
	];
}