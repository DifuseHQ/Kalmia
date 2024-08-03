export function nullOrUndefined (a) {
  return a === null || a === undefined;
}

export function pageSize () {
  const pages = [10, 50, 100, 1000];
  return pages;
}

export const languages = [
  { code: 'English', lang: 'English' },
  { code: 'Malayalam', lang: 'Malayalam' },
  { code: 'Hindi', lang: 'Hindi' }
];

export function customCSSInitial () {
  const customCSS = `:root {
  --ifm-color-primary: #000000;
  --ifm-color-primary-dark: #000000;
  --ifm-color-primary-darker: #000000;
  --ifm-color-primary-darkest: #000000;
  --ifm-color-primary-light: #333333;
  --ifm-color-primary-lighter: #666666;
  --ifm-color-primary-lightest: #999999;
  --ifm-code-font-size: 95%;
  --docusaurus-highlighted-code-line-bg: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] {
  --ifm-color-primary: #ffffff;
  --ifm-color-primary-dark: #e0e0e0;
  --ifm-color-primary-darker: #c0c0c0;
  --ifm-color-primary-darkest: #a0a0a0;
  --ifm-color-primary-light: #f0f0f0;
  --ifm-color-primary-lighter: #f5f5f5;
  --ifm-color-primary-lightest: #fafafa;
  --docusaurus-highlighted-code-line-bg: rgba(255, 255, 255, 0.3);
}
`;

  return customCSS;
}
