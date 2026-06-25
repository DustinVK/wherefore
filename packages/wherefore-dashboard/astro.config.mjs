import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: process.env.WHEREFORE_SITE,
});
