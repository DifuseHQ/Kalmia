import * as path from 'path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  globalStyles: path.join(__dirname, 'styles/output.css'),
  title: '__TITLE__',
  base: '__BASE_URL__',
  description: '__TAG_LINE__',
  icon: '__FAVICON__',
  logo: {
    light: '__LOGO_LIGHT__',
    dark: '__LOGO_DARK__',
  },
  __MULTI_VERSIONS__,
  themeConfig: {
    socialLinks: __SOCIAL_LINKS__,
    footer: { message:`__FOOTER_CONTENT__` },
  },
  mediumZoom: {
    selector: '.rspress-doc img',
  },
  outDir: '__OUT_DIR__',
  plugins: [],
  builderConfig: {
    source: {
      alias: {
        '@components': './src/components',
      },
    },
  },
});