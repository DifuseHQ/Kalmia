import { defineConfig } from '@rsbuild/core';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';

export default defineConfig({
  plugins: [pluginReact(), pluginImageCompress(), pluginTypeCheck()],
  html: {
    template: './public/index.html',
  },
  output: {
    legalComments: 'none',
    polyfill: 'usage',
    distPath: {
      root: 'build',
    },
    sourceMap: {
      js: process.env.NODE_ENV === 'development'? 'source-map' : false,
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
