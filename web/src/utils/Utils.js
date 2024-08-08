import { Icon } from '@iconify/react/dist/iconify.js';

import i18n from './i18n';

export function nullOrUndefined (a) {
  return a === null || a === undefined;
}

export function pageSize () {
  const pages = [10, 50, 100, 1000];
  return pages;
}

export const languages = [
  { code: 'en', lang: 'English' },
  { code: 'ml', lang: 'Malayalam' },
  { code: 'hi', lang: 'Hindi' }
];

export const getLanguageName = () => {
  const code = i18n.language || 'en';
  const language = languages.find((lang) => lang.code === code);
  return language ? language.lang : 'Unknown Language';
};

export function customCSSInitial () {
  const customCSS = `:root {
  /* Modify theme color */
  --rp-c-brand: #f00;
  --rp-c-brand-dark: #ffa500;
  --rp-c-brand-darker: #c26c1d;
  --rp-c-brand-light: #f2a65a;
  --rp-c-brand-lighter: #f2a65a;
  /* Modify the width of the left sidebar */
  --rp-sidebar-width: 280px;
  /* Modify the width of the right outline column */
  --rp-aside-width: 256px;
  /* Modify the background of the code block title */
  --rp-code-title-bg: rgba(250, 192, 61, 0.15);
  /* Modify the background of the code block content */
  --rp-code-block-bg: rgba(214, 188, 70, 0.05);
}
`;

  return customCSS;
}

export const SocialLinkIcon = [
  {
    icon: (
      <Icon
        icon="ic:baseline-discord"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: 'discord',
    iconName: 'Discord'
  },
  {
    icon: (
      <Icon
        icon="ic:baseline-facebook"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: 'facebook',
    iconName: 'Facebook'
  },
  {
    icon: (
      <Icon icon="mdi:github" className="w-6 h-6 text-black dark:text-white" />
    ),
    value: 'github',
    iconName: 'Github'
  },
  {
    icon: (
      <Icon
        icon="mdi:instagram"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: 'instagram',
    iconName: 'Instagram'
  },
  {
    icon: (
      <Icon
        icon="mdi:linkedin"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: 'linkedin',
    iconName: 'Linkedin'
  },
  {
    icon: (
      <Icon
        icon="pajamas:twitter"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: 'x',
    iconName: 'X'
  },
  {
    icon: (
      <Icon icon="mdi:youtube" className="w-6 h-6 text-black dark:text-white" />
    ),
    value: 'youtube',
    iconName: 'Youtube'
  },
  {
    icon: (
      <Icon icon="mdi:slack" className="w-6 h-6 text-black dark:text-white" />
    ),
    value: 'slack',
    iconName: 'Slack'
  },
  {
    icon: (
      <Icon icon="mdi:twitter" className="w-6 h-6 text-black dark:text-white" />
    ),
    value: 'twitter',
    iconName: 'Twitter'
  },
  {
    icon: (
      <Icon icon="mdi:gitlab" className="w-6 h-6 text-black dark:text-white" />
    ),
    value: 'gitlab',
    iconName: 'Gitlab'
  },
  {
    icon: (
      <Icon
        icon="ic:baseline-wechat"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: 'wechat',
    iconName: 'Wechat'
  },
  {
    icon: (
      <Icon
        icon="mingcute:qq-line"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: 'qq',
    iconName: 'QQ'
  },
  {
    icon: (
      <Icon
        icon="simple-icons:juejin"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: 'juejin',
    iconName: 'Juejin'
  },
  {
    icon: (
      <Icon
        icon="ri:zhihu-fill"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: 'zhihu',
    iconName: 'Zhihu'
  },
  {
    icon: (
      <Icon
        icon="ri:bilibili-fill"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: 'bilibili',
    iconName: 'Bilibili'
  },
  {
    icon: (
      <Icon
        icon="ri:weibo-fill"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: 'weibo',
    iconName: 'Weibo'
  },
  {
    icon: (
      <Icon
        icon="icon-park-outline:new-lark"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: 'lark',
    iconName: 'Lark'
  }
];
