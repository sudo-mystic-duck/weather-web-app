import { vitePreprocess } from '@sveltejs/kit/vite';
import vercel from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: vercel()
  }
};

export default config;
