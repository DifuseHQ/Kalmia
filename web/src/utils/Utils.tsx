import { Icon } from "@iconify/react/dist/iconify.js";
import { JSX } from "react";

import i18n from "./i18n";

export function nullOrUndefined(a: unknown): boolean {
  return a === null || a === undefined;
}

export function pageSizes(): number[] {
  const pages = [10, 50, 100, 1000];
  return pages;
}

export const languages: { code: string; lang: string }[] = [
  { code: "en", lang: "English" },
  { code: "ml", lang: "Malayalam" },
  { code: "hi", lang: "Hindi" },
];

export const getLanguageName = (): string => {
  const code = i18n.language || "en";
  const language = languages.find((lang) => lang.code === code);
  return language ? language.lang : "Unknown Language";
};

export function customCSSInitial(): string {
  const customCSS = `
  /* Makes the landing page image pop */
  .rspress-home-hero-image img {
    @apply kal-rounded-md;
    transform: scale(1.5);
    transform-origin: center center;
  }
  
  .rspress-logo {
    height: 2.4rem;
  }
  
  
  :root {
    --rp-nav-height: 72px;
    --rp-sidebar-width: 320px;
    --rp-aside-width: 268px;
  }
  
  :root {
    --rp-c-bg: #ffffff; /* Background color */
    --rp-c-bg-soft: #f9f9f9; /* Features div background color*/
    --rp-c-bg-mute: #f1f1f1; /*Navbar/Sidebar active & hover background color */
  
    --rp-c-divider: rgba(60, 60, 60, 0.29);
    --rp-c-divider-light: rgba(60, 60, 60, 0.1);
  
    --rp-c-text-1: #213547; /* Tile description ,Learn more button ,Navbar ,Doc content ,Sidebar:hover text color  */
    --rp-c-text-2: #031159; /* Feature description, Navbar icons, Serach placeholder, Sidebar text color */
    --rp-c-text-3: rgba(60, 60, 60, 0.33);
    --rp-c-text-4: rgba(60, 60, 60, 0.18);
  
    --rp-c-text-code: #476573;
    --rp-c-text-code-bg: rgb(153 161 179/ 0.1);
  
    --rp-c-brand: #031159; /* Title, border ,doc content #(symbol) , active version color*/
    --rp-home-hero-name-background: -webkit-linear-gradient(120deg, var(--rp-c-brand) 30%, #aebbfc); /*title starting gradient color*/
    --rp-home-mask-background-image: conic-gradient(from 180deg at 50% 50%, var(--rp-c-brand) 0deg, 180deg, #8295fb 1turn); /*image gradient end color*/
    --rp-c-brand-light: #031159;/*Get started button starting gradient color */
    --rp-c-brand-lighter: #66c2ff;
    --rp-c-brand-dark: #031159; /*Get started button ending bg gradient color , Active Navbar & Sidebar text color */
    --rp-c-brand-darker: #005fcc; 
    --rp-c-brand-tint: rgba(127, 163, 255, 0.16);
  
    --rp-c-gray: #8e8e8e; /* Search icon color, (ctrl k) text in search color) */
    --rp-c-gray-light-1: #aeaeae;
    --rp-c-gray-light-2: #c7c7c7;
    --rp-c-gray-light-3: #d1d1d1; /*Learn More button border color */
    --rp-c-gray-light-4: #e5e5e5; /*Learn More hover bg color*/
    --rp-c-gray-light-5: #f2f2f2; /*Learn More button bg color*/
  
    --rp-c-dark: #000000;
    --rp-c-dark-light-1: #2f2f2f;
    --rp-c-dark-light-2: #3a3a3a;
    --rp-c-dark-light-3: #4a4a4a;
    --rp-c-dark-light-4: #5c5c5c;
    --rp-c-dark-light-5: #6b6b6b;
  
    --rp-radius: 1rem;
    --rp-radius-small: 0.5rem;
    --rp-radius-large: 1.5rem;
  
    --rp-c-link: var(--rp-c-brand-dark);
  }
  
  /* Dark mode */
  .dark {
    --rp-c-bg: #23272f; /* Background color */
    --rp-c-bg-soft: #292e37; /* Features div background color*/
    --rp-c-bg-mute: #343a46; /*Navbar/Sidebar active & hover background color */
    --rp-c-bg-alt: #000;
  
    --rp-c-divider: rgba(84, 84, 84, 0.65);
    --rp-c-divider-light: rgba(84, 84, 84, 0.48);
  
    --rp-c-brand: #7188fa;  /* Title, border ,doc content #(symbol) , active version color*/
    --rp-home-hero-name-background: -webkit-linear-gradient(120deg, var(--rp-c-brand) 30%, #ffffff); /*Title starting gradient color*/ /* changed */
    --rp-home-mask-background-image: conic-gradient(from 180deg at 50% 50%, var(--rp-c-brand) 0deg, 180deg, #8295fb 1turn); /*Image gradient end color*/ /* changed */
    --rp-c-brand-light: #7188fa; /*Get started button starting gradient color */
    --rp-c-brand-lighter: #66c2ff;
    --rp-c-brand-dark: #7188fa; /*Get started button ending bg gradient color , Active Navbar & Sidebar text color */
    --rp-c-brand-darker: #005fcc;
    --rp-c-brand-tint: #313238; 
  
    --rp-c-text-1: rgba(255, 255, 255, 0.87);
    --rp-c-text-2: rgba(235, 235, 235, 0.56);
    --rp-c-text-3: rgba(235, 235, 235, 0.38);
    --rp-c-text-4: rgba(235, 235, 235, 0.18);
  
    /* Will be used in overview page */
    --rp-c-text-code: #c9def1;
  
    --rp-c-link: var(--rp-c-brand-light);
  }
  
  :root {
    --rp-z-index-local-nav: 10;
    --rp-z-index-nav: 20;
    --rp-z-index-backdrop: 30;
    --rp-z-index-sidebar: 40;
  }
  
  :root {
    --rp-shadow-1: 0 1px 4px rgba(0, 0, 0, 0.02), 0 1px 0 rgba(0, 0, 0, 0.06);
    --rp-shadow-2: 0 3px 12px rgba(0, 0, 0, 0.07), 0 1px 4px rgba(0, 0, 0, 0.07);
    --rp-shadow-3: 0 12px 32px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.08);
    --rp-shadow-4: 0 14px 44px rgba(0, 0, 0, 0.12), 0 3px 9px rgba(0, 0, 0, 0.12);
    --rp-shadow-5: 0 18px 56px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.16);
  }
`;

  return customCSS;
}

export const SocialLinkIcon: {
  icon: JSX.Element;
  value: string;
  iconName: string;
}[] = [
  {
    icon: (
      <Icon
        icon="ic:baseline-discord"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: "discord",
    iconName: "Discord",
  },
  {
    icon: (
      <Icon
        icon="ic:baseline-facebook"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: "facebook",
    iconName: "Facebook",
  },
  {
    icon: (
      <Icon icon="mdi:github" className="w-6 h-6 text-black dark:text-white" />
    ),
    value: "github",
    iconName: "Github",
  },
  {
    icon: (
      <Icon
        icon="mdi:instagram"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: "instagram",
    iconName: "Instagram",
  },
  {
    icon: (
      <Icon
        icon="mdi:linkedin"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: "linkedin",
    iconName: "Linkedin",
  },
  {
    icon: (
      <Icon
        icon="pajamas:twitter"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: "x",
    iconName: "X",
  },
  {
    icon: (
      <Icon icon="mdi:youtube" className="w-6 h-6 text-black dark:text-white" />
    ),
    value: "youtube",
    iconName: "Youtube",
  },
  {
    icon: (
      <Icon icon="mdi:slack" className="w-6 h-6 text-black dark:text-white" />
    ),
    value: "slack",
    iconName: "Slack",
  },
  {
    icon: (
      <Icon icon="mdi:twitter" className="w-6 h-6 text-black dark:text-white" />
    ),
    value: "twitter",
    iconName: "Twitter",
  },
  {
    icon: (
      <Icon icon="mdi:gitlab" className="w-6 h-6 text-black dark:text-white" />
    ),
    value: "gitlab",
    iconName: "Gitlab",
  },
  {
    icon: (
      <Icon
        icon="ic:baseline-wechat"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: "wechat",
    iconName: "Wechat",
  },
  {
    icon: (
      <Icon
        icon="mingcute:qq-line"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: "qq",
    iconName: "QQ",
  },
  {
    icon: (
      <Icon
        icon="simple-icons:juejin"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: "juejin",
    iconName: "Juejin",
  },
  {
    icon: (
      <Icon
        icon="ri:zhihu-fill"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: "zhihu",
    iconName: "Zhihu",
  },
  {
    icon: (
      <Icon
        icon="ri:bilibili-fill"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: "bilibili",
    iconName: "Bilibili",
  },
  {
    icon: (
      <Icon
        icon="ri:weibo-fill"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: "weibo",
    iconName: "Weibo",
  },
  {
    icon: (
      <Icon
        icon="icon-park-outline:new-lark"
        className="w-6 h-6 text-black dark:text-white"
      />
    ),
    value: "lark",
    iconName: "Lark",
  },
];
