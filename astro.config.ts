import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/site/config.ts';

export default defineConfig({
  site: SITE.url,
  output: 'static',
  integrations: [react(), sitemap()],
});
