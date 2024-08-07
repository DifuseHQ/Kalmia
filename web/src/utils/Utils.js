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
  const language = languages.find(lang => lang.code === code);
  return language ? language.lang : 'Unknown Language';
};

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

export const SocialLinkIcon = [
  {icon:<Icon icon="ic:baseline-discord"  className='w-6 h-6 text-black dark:text-white'/> , value:'discord', iconName:"Discord"} ,
  {icon:<Icon icon="ic:baseline-facebook" className='w-6 h-6 text-black dark:text-white'/> , value:'facebook', iconName:"Facebook"} ,
  {icon:<Icon icon="mdi:github" className='w-6 h-6 text-black dark:text-white' /> , value:'github', iconName:"Github"},
  {icon:<Icon icon="mdi:instagram" className='w-6 h-6 text-black dark:text-white'/> , value:'instagram', iconName:"Instagram"} ,
  {icon:<Icon icon="mdi:linkedin" className='w-6 h-6 text-black dark:text-white'/> , value:'linkedin', iconName:"Linkedin"} ,
  {icon:<Icon icon="pajamas:twitter" className='w-6 h-6 text-black dark:text-white'/> , value:'x', iconName:"X"} ,
  {icon:<Icon icon="mdi:youtube"  className='w-6 h-6 text-black dark:text-white'/> , value:'youtube', iconName:"Youtube"} ,
  {icon:<Icon icon="mdi:slack" className='w-6 h-6 text-black dark:text-white'/> , value:'slack', iconName:"Slack"} ,
  {icon:<Icon icon="mdi:twitter" className='w-6 h-6 text-black dark:text-white'/> , value:'twitter', iconName:"Twitter"} ,
  {icon:<Icon icon="mdi:gitlab" className='w-6 h-6 text-black dark:text-white'/> , value:'gitlab', iconName:"Gitlab"} ,
  {icon:<Icon icon="ic:baseline-wechat" className='w-6 h-6 text-black dark:text-white'/> , value:'wechat', iconName:"Wechat"} ,
  {icon:<Icon icon="mingcute:qq-line"  className='w-6 h-6 text-black dark:text-white'/> , value:'qq', iconName:"QQ"} ,
  {icon:<Icon icon="simple-icons:juejin" className='w-6 h-6 text-black dark:text-white'/> , value:'juejin', iconName:"Juejin"} ,
  {icon:<Icon icon="ri:zhihu-fill" className='w-6 h-6 text-black dark:text-white'/> , value:'zhihu', iconName:"Zhihu"} ,
  {icon:<Icon icon="ri:bilibili-fill"  className='w-6 h-6 text-black dark:text-white'/> , value:'bilibili', iconName:"Bilibili"} ,
  {icon:<Icon icon="ri:weibo-fill" className='w-6 h-6 text-black dark:text-white'/> , value:'weibo', iconName:"Weibo"} ,
  {icon:<Icon icon="icon-park-outline:new-lark" className='w-6 h-6 text-black dark:text-white'/> , value:'lark', iconName:"Lark"} ,
];
