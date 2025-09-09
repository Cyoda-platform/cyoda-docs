// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Cyoda Documentation',
			description: 'Documentation for the Cyoda platform - event-driven architecture and data management solutions.',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/Cyoda-platform/cyoda-docs'
				}
			],
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'icon',
						href: '/favicon.ico',
						sizes: 'any',
					},
				},
			],
			customCss: [
				// Add custom CSS for footer and other styling
				'./src/styles/custom.css',
			],
			sidebar: [
				{
					label: 'Getting Started',
					collapsed: false,
					autogenerate: { directory: 'getting-started' }
				},
				{
					label: 'Guides',
					collapsed: true,
					autogenerate: { directory: 'guides' }
				},
				{
					label: 'Concepts',
					collapsed: true,
					autogenerate: { directory: 'concepts' }
				},
				{
					label: 'Architecture',
					collapsed: true,
					autogenerate: { directory: 'architecture' }
				},
				{
					label: 'Platform',
					collapsed: true,
					autogenerate: { directory: 'platform' }
				},
			],
			components: {
				// Override the default footer component
				Footer: './src/components/Footer.astro',
				// Override the default header component to add navigation
				Header: './src/components/Header.astro',
			},
		}),
	],
});
