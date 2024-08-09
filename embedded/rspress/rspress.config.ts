import * as path from 'path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: '__TITLE__',
  base: '__BASE_URL__/',
  description: '__TAG_LINE__',
  logo: {
    light: 'https://difuse.io/assets/images/favicon/white/android-chrome-512x512.png',
    dark: 'https://difuse.io/assets/images/favicon/white/android-chrome-512x512.png',
  },
  __MULTI_VERSIONS__,
  themeConfig: {
    socialLinks: [
      // { icon: 'github', mode: 'link', content: 'https://github.com/web-infra-dev/rspress' },
      // { icon: 'twitter', mode: 'link', content: 'https://github.com/web-infra-dev/rspress' },
      // { icon: 'discord', mode: 'link', content: 'https://github.com/web-infra-dev/rspress' },
      // { icon: 'facebook', mode: 'link', content: 'https://github.com/web-infra-dev/rspress' },
      // { icon: 'whatsapp', mode: 'link', content: 'https://github.com/web-infra-dev/rspress' },
    ],
    footer: { message:'<p>This is a footer with a <a href="https://example.com">link</a> and <strong>bold text</strong></p>' },
  },
  mediumZoom: {
    selector: '.rspress-doc img',
  },
  outDir: 'build_tmp'
});