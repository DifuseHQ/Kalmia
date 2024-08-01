// @ts-check

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '__TITLE__',
  tagline: '__TAG_LINE__',
  favicon: '__FAVICON__',
  url: '__URL__',
  baseUrl: '/',
  organizationName: '__ORGANIZATION_NAME__',
  projectName: '__PROJECT_NAME__',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          includeCurrentVersion: false,
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: '__META_IMAGE__',
      navbar: {
        title: '__TITLE__',
        logo: {
          alt: '__TITLE__ Logo',
          src: '__NAVBAR_LOGO__',
        },
        items: [
          {
            type: 'docsVersionDropdown',
            position: 'left',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Community',
            items: __COMMUNITY_LABEL_HREF__,
          },
          {
            title: 'More',
            items: __MORE_LABEL_HREF__,
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} __COPYRIGHT_TEXT__`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
