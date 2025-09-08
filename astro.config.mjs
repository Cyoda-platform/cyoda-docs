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
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Quickstart', slug: 'getting-started/quickstart' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Provision Environment', slug: 'guides/provision-environment' },
						{ label: 'Authentication & Authorization', slug: 'guides/authentication-authorization' },
						{ label: 'API: Saving and Getting Data', slug: 'guides/api-saving-and-getting-data' },
						{ label: 'SQL and Trino', slug: 'guides/sql-and-trino' },
						{ label: 'Workflow Configuration', slug: 'guides/workflow-config-guide' },
						{ label: 'Design Principles', slug: 'guides/cyoda-design-principles' },
					],
				},
				{
					label: 'Concepts',
					items: [
						{ label: 'CPL Overview', slug: 'concepts/cpl-overview' },
						{ label: 'Event-Driven Architecture', slug: 'concepts/event-driven-architecture' },
						{ label: 'EDBMS', slug: 'concepts/edbms' },
					],
				},
				{
					label: 'Architecture',
					items: [
						{ label: 'Cyoda Cloud Architecture', slug: 'architecture/cyoda-cloud-architecture' },
					],
				},
				{
					label: 'Platform',
					items: [
						{ label: 'Cloud Service Details', slug: 'platform/cloud-service-details' },
						{ label: 'Cyoda Cloud Status', slug: 'platform/cyoda-cloud-status' },
						{ label: 'Entitlements', slug: 'platform/entitlements' },
						{ label: 'Roadmap', slug: 'platform/roadmap' },
					],
				},
			],
			components: {
				// Override the default footer component
				Footer: './src/components/Footer.astro',
			},
		}),
	],
});
