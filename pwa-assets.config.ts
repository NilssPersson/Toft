// Generates the app icons in public/ from public/favicon.svg: `npm run icons`.
// Replace public/favicon.svg with real art and re-run to regenerate them.
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

const SKY = '#bfe3f2';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: SKY } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: SKY } },
  },
  images: ['public/favicon.svg'],
});
