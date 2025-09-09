import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';
import cookieconsent from '@jop-software/astro-cookieconsent';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// https://astro.build/config
export default defineConfig({
	// Site URL for sitemap generation
	site: 'https://docs.cyoda.net',
	// Performance optimizations
	output: 'static',
	build: {
		inlineStylesheets: 'auto',
		assets: '_astro'
	},
	prefetch: {
		prefetchAll: true,
		defaultStrategy: 'viewport'
	},

	vite: {
		build: {
			cssCodeSplit: true,
			rollupOptions: {
				output: {
					manualChunks: {
						'vendor': ['@astrojs/starlight'],
						'mermaid': ['rehype-mermaid']
					}
				}
			}
		}
	},
	markdown: {
		rehypePlugins: [rehypeMermaid]
	},
	integrations: [
		cookieconsent({
			guiOptions: {
				consentModal: {
					layout: 'cloud',
					position: 'bottom center',
					equalWeightButtons: true,
					flipButtons: false,
				},
				preferencesModal: {
					layout: 'box',
					position: 'right',
					equalWeightButtons: true,
					flipButtons: false,
				},
			},
			categories: {
				necessary: {
					enabled: true,
					readOnly: true,
				},
				analytics: {
					enabled: false,
					readOnly: false,
					autoClear: {
						cookies: [
							{
								name: /^_ga/,
							},
							{
								name: '_gid',
							},
						],
					},
					services: {
						ga4: {
							label: 'Google Analytics 4',
							onAccept: () => {
								// Initialize Google Analytics when consent is given
								if (typeof window !== 'undefined') {
									window.gtag('consent', 'update', {
										analytics_storage: 'granted'
									});
								}
							},
							onReject: () => {
								// Disable Google Analytics when consent is rejected
								if (typeof window !== 'undefined') {
									window.gtag('consent', 'update', {
										analytics_storage: 'denied'
									});
								}
							},
						},
					},
				},
			},
			language: {
				default: 'en',
				translations: {
					en: {
						consentModal: {
							title: 'Cookie Consent',
							description: 'Our website uses cookies and other related technologies ' +
                                '(for convenience all technologies are referred to as "cookies"). ' +
                                'Some cookies ensure that certain parts of the website work properly and that ' +
                                'your user preferences remain known (Essential cookies). We also place cookies for ' +
                                'analytics to measure usage and improve your experience, and marketing cookies to ' +
                                'create user profiles and display personalized advertising. ' +
                                'By clicking "Accept All", you consent to us using all categories of cookies as ' +
                                'described in our Cookie Policy. You can disable the use of cookies via your browser, ' +
                                'but please note that our website may no longer work properly. ' +
                                'See our <a href="/cookies" target="_blank">Cookie Policy</a> and ' +
                                '<a href="/privacy" target="_blank">Privacy Policy</a>.',
							acceptAllBtn: 'Accept All',
							acceptNecessaryBtn: 'Accept Necessary Only',
							showPreferencesBtn: 'Manage Preferences',
						},
						preferencesModal: {
							title: 'Cookie Preferences',
							acceptAllBtn: 'Accept All',
							acceptNecessaryBtn: 'Accept Necessary Only',
							savePreferencesBtn: 'Save Preferences',
							closeIconLabel: 'Close',
							sections: [
								{
									title: 'Cookie Usage',
									description: 'We use cookies to ensure the basic functionalities of the website ' +
                                        'and to enhance your online experience. You can choose for each category to ' +
                                        'opt-in/out whenever you want. See our <a href="/cookies" target="_blank">Cookie Policy</a> and ' +
                                        '<a href="/privacy" target="_blank">Privacy Policy</a>.',
								},
								{
									title: 'Strictly Necessary Cookies. Always On.',
									description: 'These are necessary for the website to function properly.' +
                                        'Essential cookies are required for basic site functionality and security. ' +
                                        'These are always on and rely on our legitimate interests and are exempt from ' +
                                        'consent requirements under applicable law.',
									linkedCategory: 'necessary',
								},
								{
									title: 'Analytics Cookies',
									description: 'These cookies allow us to analyze website usage and improve our ' +
                                        'services. We use Google Analytics with privacy-enhanced settings.',
									linkedCategory: 'analytics',
								},
							],
						},
					},
				},
			},
		}),
		starlight({
			title: 'Cyoda Documentation',
			description: 'Documentation for the Cyoda platform - event-driven architecture and data management solutions.',
            social: [
                {
                    icon: 'github',
                    label: 'GitHub',
                    href: 'https://github.com/Cyoda-platform/cyoda-docs'
                },
                {
                    icon: 'linkedin',
                    label: 'LinkedIn',
                    href: 'https://linkedin.com/company/cyoda'
                },
                {
                    icon: 'discord',
                    label: 'Discord',
                    href: 'https://discord.com/invite/95rdAyBZr2'
                },
                {
                    icon: 'youtube',
                    label: 'YouTube',
                    href: 'https://www.youtube.com/@cyoda934'
                }
            ],			head: [
				// Google Analytics with consent mode (only if GA_MEASUREMENT_ID is provided)
				...(process.env.GA_MEASUREMENT_ID ? [
					{
						tag: 'script',
						attrs: {
							async: true,
							src: `https://www.googletagmanager.com/gtag/js?id=${process.env.GA_MEASUREMENT_ID}`,
						},
					},
					{
						tag: 'script',
						content: `
							window.dataLayer = window.dataLayer || [];
							function gtag(){dataLayer.push(arguments);}

							// Set default consent to 'denied' until user provides consent
							gtag('consent', 'default', {
								'analytics_storage': 'denied'
							});

							gtag('js', new Date());
							gtag('config', '${process.env.GA_MEASUREMENT_ID}', {
								anonymize_ip: true,
								allow_google_signals: false,
								allow_ad_personalization_signals: false
							});
						`,
					}
				] : []),
			],
			customCss: [
				// Primer primitives with Cyoda branding
				'./src/styles/primer.css',
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
					label: 'Concepts and Ideas',
					collapsed: true,
					autogenerate: { directory: 'concepts' }
				},
				{
					label: 'Architecture',
					collapsed: true,
					autogenerate: { directory: 'architecture' }
				},
				{
					label: 'Cloud Info',
					collapsed: true,
					autogenerate: { directory: 'platform' }
				},
			],
			components: {
				// Override the default footer component
				Footer: './src/components/Footer.astro',
				// Override the default header component to add navigation
				Header: './src/components/Header.astro',
				// Override the default site title to add logo and aqua coloring
				SiteTitle: './src/components/SiteTitle.astro',
				// Override the table of contents to add copy page button
				TableOfContents: './src/components/TableOfContents.astro',
				// Override the mobile table of contents to add copy page button
				MobileTableOfContents: './src/components/MobileTableOfContents.astro',
			},
		}),
	],
});
