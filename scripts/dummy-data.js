async function authenticateUser(username, password) {
  try {
    const response = await fetch('/auth/jwt/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}


import { LoremIpsum } from 'lorem-ipsum';
const TOKEN = authenticateUser('admin', 'admin');
const ENDPOINT = 'http://127.0.0.1:2727/docs/page/create';
const CreateDocumentationEndpoint = 'http://127.0.0.1:2727/docs/documentation/create'
const START_ORDER = 1;
const NUM_PAGES = 15;

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4
  },
  wordsPerSentence: {
    max: 16,
    min: 4
  }
});

const testCases = [
  {
      id: 1,
      name: "Kalmia",
      version: "1.0.0",
      url: "https://kalmia.difuse.io",
      organizationName: "Iridia Solutions",
      projectName: "Kalmia",
      landerDetails: JSON.stringify({
        ctaButtonText: {
          ctaButtonLinkLabel: "Get Started",
          ctaButtonLink: "/doc"
        },
        secondCtaButtonText: {
          ctaButtonLinkLabel: "Github",
          ctaButtonLink: "https://github.com/DifuseHQ/Kalmia"
        },
        ctaImageLink: "https://difuse.io/assets/images/meta/meta.webp",
        features: [{ emoji: "", title: "Title", text: "Text" }]
      }),
      clonedFrom: null,
      description: "Test Documentation",
      favicon: "https://favicon",
      metaImage: "https://difuse.io/assets/images/meta/meta.webp",
      navImage: "https://difuse.io/assets/images/meta/meta.webp",
      customCSS: `:root {
        --rp-c-brand: #f00;
        --rp-c-brand-dark: #ffa500;
        --rp-c-brand-darker: #c26c1d;
        --rp-c-brand-light: #f2a65a;
        --rp-c-brand-lighter: #f2a65a;
        --rp-sidebar-width: 280px;
        --rp-aside-width: 256px;
        --rp-code-title-bg: rgba(250, 192, 61, 0.15);
        --rp-code-block-bg: rgba(214, 188, 70, 0.05);
      }`,
      footerLabelLinks: JSON.stringify([{ icon: "discord", link: "https://discord.com" }]),
      moreLabelLinks: JSON.stringify([{ label: "Twitter", link: "https://twitter.com" }]),
      authorId: 1,
      author: { id: 1, username: "admin", email: "admin@example.com" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editors: [{ id: 1, username: "admin", email: "admin@example.com" }],
      lastEditorId: 1,
      pages: [
        {
          id: 1,
          authorId: 1,
          author: { id: 1, username: "admin", email: "admin@example.com" },
          documentationId: 1,
          title: "Introduction",
          slug: "/",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: 0,
          editors: [{ id: 1, username: "admin", email: "admin@example.com" }],
          isIntroPage: true
        }
      ]
  },
  {
      id: 2,
      name: "Difuse Documentation",
      version: "1.0.0",
      url: "https://docs.difuse.iotest",
      organizationName: "iridia solution",
      projectName: "difuse",
      landerDetails: '{}',
      clonedFrom: null,
      description: "difuse Documentation test",
      favicon: "https://favicon",
      metaImage: "https://difuse.io/assets/images/meta/meta.webp",
      navImage: "https://difuse.io/assets/images/meta/meta.webp",
      customCSS: `:root {
        --rp-c-brand: #f00;
        --rp-c-brand-dark: #ffa500;
        --rp-c-brand-darker: #c26c1d;
        --rp-c-brand-light: #f2a65a;
        --rp-c-brand-lighter: #f2a65a;
        --rp-sidebar-width: 280px;
        --rp-aside-width: 256px;
        --rp-code-title-bg: rgba(250, 192, 61, 0.15);
        --rp-code-block-bg: rgba(214, 188, 70, 0.05);
      }`,
      footerLabelLinks: JSON.stringify([
        { icon: "discord", link: "https://docs.discord.iotest" },
        { icon: "facebook", link: "https://facebook" }
      ]),
      moreLabelLinks: JSON.stringify([
        { label: "Twitter", link: "https://twitter.com" },
        { label: "github", link: "https://github.com" }
      ]),
      authorId: 1,
      author: { id: 1, username: "admin", email: "admin@example.com" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editors: [{ id: 1, username: "admin", email: "admin@example.com" }],
      lastEditorId: 1,
      pages: [
        {
          id: 2,
          authorId: 1,
          author: { id: 1, username: "admin", email: "admin@example.com" },
          documentationId: 2,
          title: "Introduction",
          slug: "/",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: 0,
          editors: [{ id: 1, username: "admin", email: "admin@example.com" }],
          isIntroPage: true
        }
      ]
  },
  {
      id: 3,
      name: "Test",
      version: "2.0.0",
      url: "https://docs.difuse.iotest",
      organizationName: "Test pvt ltd",
      projectName: "kalmia",
      landerDetails: JSON.stringify({
        ctaButtonText: {
          ctaButtonLinkLabel: "Quick start",
          ctaButtonLink: "/doctest"
        },
        secondCtaButtonText: {
          ctaButtonLinkLabel: "discord",
          ctaButtonLink: "https://discord"
        },
        ctaImageLink: "https://difuse.io/assets/images/meta/meta.webp",
        features: [{ emoji: "1f973", title: "Easy CMS", text: "we can easily content manage" }]
      }),
      clonedFrom: null,
      description: "Test documentation",
      favicon: "https://favicon",
      metaImage: "https://difuse.io/assets/images/meta/meta.webp",
      navImage: "https://navbaricon",
      customCSS: `:root {
        --rp-c-brand: #f00;
        --rp-c-brand-dark: #ffa500;
        --rp-c-brand-darker: #c26c1d;
        --rp-c-brand-light: #f2a65a;
        --rp-c-brand-lighter: #f2a65a;
        --rp-sidebar-width: 280px;
        --rp-aside-width: 256px;
        --rp-code-title-bg: rgba(250, 192, 61, 0.15);
        --rp-code-block-bg: rgba(214, 188, 70, 0.05);
      }`,
      footerLabelLinks: null,
      moreLabelLinks: null,
      authorId: 1,
      author: { id: 1, username: "admin", email: "admin@example.com" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editors: [{ id: 1, username: "admin", email: "admin@example.com" }],
      lastEditorId: 1,
      pages: [
        {
          id: 3,
          authorId: 1,
          author: { id: 1, username: "admin", email: "admin@example.com" },
          documentationId: 3,
          title: "Introduction",
          slug: "/",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: 0,
          editors: [{ id: 1, username: "admin", email: "admin@example.com" }],
          isIntroPage: true
        }
      ]
  }
];

async function createDocumentation(objData,endpoint, token) {
 /* 1st -> Regular Documentaion with all fields proper */
 /* 2nd -> All fields except landing page */
 /* 3rd -> All fields except footer data */ 
 try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(objData)
  });
  const data = await response.json();
  console.log(`Documentation Created:`, data);
} catch (error) {
  console.error('Error creating documentation:', error);
}
}

async function createPageGroup(objData) {
  /* Page Group 1 - 15 in each documentation */
}

// async function createPage(objDat) {
//   /* Add 10 pages per page group */
// }

function randomTextColor() {
  const colors = ["white", "black", "red", "green", "blue", "yellow", "purple", "orange", "pink"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const createPage = async (order) => {
  const title = lorem.generateWords(3);
  const slug = `${lorem.generateWords(1)}-${lorem.generateWords(1)}-${generateRandomNumber(111111, 999999)}`;
  const content = JSON.stringify([
    {
      id: "aa5a7a67-90d8-4d78-816e-c2cc4e3953df",
      type: "paragraph",
      props: { textColor: randomTextColor(), backgroundColor: "default", textAlignment: "left" },
      content: [{ type: "text", text: lorem.generateParagraphs(7), styles: {} }],
      children: []
    },
    {
      id: "1299e8d1-dbe9-4278-a6d6-03953b1c752f",
      type: "paragraph",
      props: { textColor: "default", backgroundColor: "default", textAlignment: "left" },
      content: [],
      children: []
    }
  ]);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        title,
        slug,
        content,
        documentationId: 1,
        order
      })
    });

    const data = await response.json();
    console.log(`Created page ${order}:`, data);
  } catch (error) {
    console.error(`Error creating page ${order}:`, error);
  }
};

const run = async () => {
  for (let i = 0; i < NUM_PAGES; i++) {
    const order = START_ORDER + i;
    await createPage(order);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

// run();




const createDocumentationTest = async (endpoint, token) => {
  for (const testCase of testCases) {
    console.log(`Starting test case: ${testCase.name}`);
    await createDocumentation(testCase, endpoint, token);
    console.log(`Finished test case: ${testCase.name}`);
  }
}

createDocumentationTest(CreateDocumentationEndpoint, TOKEN);