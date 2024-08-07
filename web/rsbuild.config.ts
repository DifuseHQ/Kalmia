import { defineConfig } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact(), pluginImageCompress()],
  html: {
    template: './public/index.html',
  },
  output: {
    legalComments: 'none',
    polyfill: 'usage',
    assetPrefix: '/admin/',
    distPath: {
      root: 'build',
    },
    sourceMap: {
      js: false,
      css: false
    },
  },

  performance: {
    chunkSplit: {
      strategy: 'split-by-size',
      minSize: 30000,
      maxSize: 50000,
    },
  },
});
