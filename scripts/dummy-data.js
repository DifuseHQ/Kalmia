import { LoremIpsum } from "lorem-ipsum";

const ENDPOINT = 'http://127.0.0.1:2727';
const TOKEN = await authenticateUser('admin', 'admin');

const documentations = [
  {
      id: 1,
      name: "Kalmia",
      version: "1.0.0",
      url: "https://kalmia.difuse.io",
      organizationName: "Iridia Solutions",
      projectName: "Kalmia",
      baseUrl: "/kalmia",
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
      ],
      copyrightText: 'Iridia Solutions Pvt. Ltd.'
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
      baseUrl: "/difuse",
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
      ],
      copyrightText: 'Iridia Solutions Pvt. Ltd.'
  },
  {
      id: 3,
      name: "Test",
      version: "2.0.0",
      url: "https://docs.difuse.iotest",
      organizationName: "Test pvt ltd",
      projectName: "kalmia",
      baseUrl: "/test",
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
      ],
      copyrightText: 'Iridia Solutions Pvt. Ltd.'
  }
];

const pageData = [
  {
    "id": "7a3fc9d3-0283-4f84-9bcd-8e76c2d7aeb7",
    "type": "heading",
    "props": {
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left",
      "level": 1
    },
    "content": [{ "type": "text", "text": "HEADING 1", "styles": {} }],
    "children": []
  },
  {
    "id": "6c5399e3-cc3a-4efb-9b6c-d160b062958f",
    "type": "heading",
    "props": {
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left",
      "level": 2
    },
    "content": [{ "type": "text", "text": "HEADING 2", "styles": {} }],
    "children": []
  },
  {
    "id": "f4218fd4-9107-495e-9a7c-0b3ee1a6c8f6",
    "type": "heading",
    "props": {
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left",
      "level": 3
    },
    "content": [{ "type": "text", "text": "HEADING 3", "styles": {} }],
    "children": []
  },
  {
    "id": "d9aa80d4-f2f2-418b-b4d7-79002a8e17c7",
    "type": "numberedListItem",
    "props": {
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left"
    },
    "content": [{ "type": "text", "text": "List Element 1", "styles": {} }],
    "children": []
  },
  {
    "id": "9e5cd5d5-4b0d-4768-9251-aaa7d5873eba",
    "type": "numberedListItem",
    "props": {
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left"
    },
    "content": [{ "type": "text", "text": "List Element 2", "styles": {} }],
    "children": [
      {
        "id": "fd7ecc2f-d7d3-43ae-855a-1d88e67db038",
        "type": "numberedListItem",
        "props": {
          "textColor": "default",
          "backgroundColor": "default",
          "textAlignment": "left"
        },
        "content": [
          { "type": "text", "text": "Sub List Element 1", "styles": {} }
        ],
        "children": []
      },
      {
        "id": "a22c93ac-52c5-47bd-92d1-1f734d89b2e4",
        "type": "numberedListItem",
        "props": {
          "textColor": "default",
          "backgroundColor": "default",
          "textAlignment": "left"
        },
        "content": [
          { "type": "text", "text": "Sub List Element 2", "styles": {} }
        ],
        "children": []
      }
    ]
  },
  {
    "id": "821084c0-27aa-4255-8c36-2ef7696b094d",
    "type": "bulletListItem",
    "props": {
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left"
    },
    "content": [
      { "type": "text", "text": "Bullet List Element 1", "styles": {} }
    ],
    "children": []
  },
  {
    "id": "49127fb8-c715-4283-aa77-2dc4e8136adc",
    "type": "bulletListItem",
    "props": {
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left"
    },
    "content": [
      { "type": "text", "text": "Bullet List Element 2", "styles": {} }
    ],
    "children": [
      {
        "id": "cec3540d-8da1-4985-88a9-5d1a8e3deb3c",
        "type": "bulletListItem",
        "props": {
          "textColor": "default",
          "backgroundColor": "default",
          "textAlignment": "left"
        },
        "content": [
          { "type": "text", "text": "Sub Bullet List Element 1", "styles": {} }
        ],
        "children": []
      },
      {
        "id": "0f1ee7eb-fdbc-448b-80c4-39b117024097",
        "type": "bulletListItem",
        "props": {
          "textColor": "default",
          "backgroundColor": "default",
          "textAlignment": "left"
        },
        "content": [
          { "type": "text", "text": "Sub Bullet List Element 2", "styles": {} }
        ],
        "children": []
      }
    ]
  },
  {
    "id": "787d76c6-46dd-4207-8860-e3a206b4bd4e",
    "type": "checkListItem",
    "props": {
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left",
      "checked": false
    },
    "content": [{ "type": "text", "text": "Check List", "styles": {} }],
    "children": [
      {
        "id": "0df0bfe3-5f34-4368-81e7-ae31a3406965",
        "type": "checkListItem",
        "props": {
          "textColor": "default",
          "backgroundColor": "default",
          "textAlignment": "left",
          "checked": true
        },
        "content": [{ "type": "text", "text": "Sub Check List", "styles": {} }],
        "children": []
      }
    ]
  },
  {
    "id": "2fb3bb69-0e3a-4387-85f9-fba70e8080b2",
    "type": "paragraph",
    "props": {
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left"
    },
    "content": [{ "type": "text", "text": "Paragraph", "styles": {} }],
    "children": []
  },
  {
    "id": "cdf9884f-2045-4328-ac7d-44bfff839ad2",
    "type": "table",
    "props": { "textColor": "default", "backgroundColor": "default" },
    "content": {
      "type": "tableContent",
      "rows": [
        {
          "cells": [
            [{ "type": "text", "text": "Column 1", "styles": {} }],
            [{ "type": "text", "text": "Column 2", "styles": {} }],
            [{ "type": "text", "text": "Column 3", "styles": {} }]
          ]
        },
        {
          "cells": [
            [{ "type": "text", "text": "Hello", "styles": {} }],
            [{ "type": "text", "text": "From", "styles": {} }],
            [{ "type": "text", "text": "Kalmia", "styles": {} }]
          ]
        }
      ]
    },
    "children": []
  },
  {
    "id": "a657aa06-51a9-48ea-ba5c-94fe4f112ca9",
    "type": "image",
    "props": {
      "backgroundColor": "default",
      "textAlignment": "center",
      "name": "box-image.png",
      "url": "https://docs.difuse.io/images/box-image.png",
      "caption": "DMSBG-100",
      "showPreview": true,
      "previewWidth": 512
    },
    "children": []
  },
  {
    "id": "0040aeb6-8b0f-4417-8c2f-72e26b1dfc05",
    "type": "video",
    "props": {
      "backgroundColor": "default",
      "textAlignment": "center",
      "name": "acrobits-provision.webm",
      "url": "https://portal.difuse.io/acrobits-provision.webm",
      "caption": "Acrobits Provisioning",
      "showPreview": true,
      "previewWidth": 240
    },
    "children": []
  },
  {
    "id": "2bc0f8e4-a0b6-45ec-877a-c813e6903f0a",
    "type": "paragraph",
    "props": {
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left"
    },
    "content": [],
    "children": []
  },
  {
    "id": "64daabd5-21f0-4485-8207-2eb120906600",
    "type": "audio",
    "props": {
      "backgroundColor": "default",
      "name": "Evgeny%20Grinko%20-%20Valse.mp3",
      "url": "https://ia601002.us.archive.org/19/items/EvgenyGrinkoValse/Evgeny%20Grinko%20-%20Valse.mp3",
      "caption": "Valse",
      "showPreview": true
    },
    "children": []
  },
  {
    "id": "81bb1456-799b-4332-89be-3008fc79dea9",
    "type": "alert",
    "props": {
      "textColor": "default",
      "textAlignment": "left",
      "type": "warning"
    },
    "content": [
      { "type": "text", "text": "Warning", "styles": { "bold": true } }
    ],
    "children": []
  },
  {
    "id": "05954cf6-441f-4023-8fff-d85360af73ca",
    "type": "alert",
    "props": {
      "textColor": "default",
      "textAlignment": "left",
      "type": "danger"
    },
    "content": [
      { "type": "text", "text": "Danger", "styles": { "bold": true } }
    ],
    "children": []
  },
  {
    "id": "ea016a11-c017-463f-b396-794dfb5d9df5",
    "type": "alert",
    "props": {
      "textColor": "default",
      "textAlignment": "left",
      "type": "info"
    },
    "content": [
      { "type": "text", "text": "Informative", "styles": { "bold": true } }
    ],
    "children": []
  },
  {
    "id": "419353f0-627e-46c8-8b8c-a3e87c4d197b",
    "type": "alert",
    "props": {
      "textColor": "default",
      "textAlignment": "left",
      "type": "success"
    },
    "content": [
      { "type": "text", "text": "Success", "styles": { "bold": true } }
    ],
    "children": []
  },
  {
    "id": "63c96b50-b50a-487b-97a4-390c788bd955",
    "type": "paragraph",
    "props": {
      "textColor": "default",
      "backgroundColor": "default",
      "textAlignment": "left"
    },
    "content": [],
    "children": []
  }
];

function generatePageGroups(n) {
  const pageGroups = [];

  for (let i = 1; i <= n; i++) {
    const children = [];
    const shuffledOrders = [0, 1, 2].sort(() => Math.random() - 0.5);

    for (let j = 1; j <= 3; j++) {
      children.push({
        name: `Page Group ${i}.${j}`,
        order: shuffledOrders[j - 1]
      });
    }

    pageGroups.push({
      name: `Page Group ${i}`,
      order: i,
      children: children
    });
  }

  return pageGroups;
}

const pageGroups = generatePageGroups(10);

async function authenticateUser(username, password) {
  try {
    const response = await fetch(`${ENDPOINT}/auth/jwt/create`, {
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

async function createDocumentation(objData) {
 try {
    await fetch(`${ENDPOINT}/docs/documentation/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(objData)
    });
    console.log(`Documentation ${objData.name} created`);
  } catch (error) {
    console.error('Error creating documentation:', error);
  }
}

async function getPageGroups(docId) {
  try {
    const response = await fetch(`${ENDPOINT}/docs/page-groups`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.filter((pageGroup) => pageGroup.documentationId === docId);
  } catch (error) {
    console.error('Error fetching page groups:', error);
  }
}

async function createPageGroups(docId) {
  for (const pageGroup of pageGroups) {
    try {
      const response = await fetch(`${ENDPOINT}/docs/page-group/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify({
          documentationId: docId,
          name: pageGroup.name,
          parentId: pageGroup.parentId,
          order: pageGroup.order
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log(`Page Group ${pageGroup.name} created`);

      const pageGroups = await getPageGroups(docId);
      const parentData = pageGroups.find((pg) => pg.name === pageGroup.name);

      if (pageGroup.children && pageGroup.children.length > 0) {
        for (const child of pageGroup.children) {
          try {
            await fetch(`${ENDPOINT}/docs/page-group/create`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
              },
              body: JSON.stringify({
                documentationId: docId,
                name: child.name,
                parentId: parentData.id,
                order: child.order
              })
            });
            console.log(`Child Page Group ${child.name} created`);
          } catch (childError) {
            console.error('Error creating child page group:', childError);
          }
        }
      }
    } catch (error) {
      console.error('Error creating page group:', error);
    }
  }
}

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

async function createPages(count, docId, groupId = null) {
  for (let i = 0; i < count; i++) {
    const modifiedPageData = JSON.parse(JSON.stringify(pageData));
    const pEl = modifiedPageData.find((element) => element.content[0].text === "Paragraph");
    if (pEl) {
      pEl.content[0].text = new LoremIpsum().generateParagraphs(1);
    }

    const slug = '/page-' + generateRandomString(8);
    
    try {
      const response = await fetch(`${ENDPOINT}/docs/page/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify({
          documentationId: parseInt(docId),
          title: `Page ${i}`,
          slug: slug,
          content: JSON.stringify(modifiedPageData),
          order: i,
          pageGroupId: parseInt(groupId) || undefined
        })
      });
    } catch (error) {
      console.error('Error creating page:', error);
    }
  }

  console.log(`Created ${count} pages`);
}

const addDummyData = async () => {
  console.log('-----------------------------------');
  console.log('Creating Documentations...');
  console.log('-----------------------------------');

  for (const documentation of documentations) {
    await createDocumentation(documentation);

    console.log('-----------------------------------');
    console.log('Creating Page Groups...');
    console.log('-----------------------------------');
    await createPageGroups(documentation.id);
    console.log('-----------------------------------');

    console.log('Creating Pages...');
    console.log('-----------------------------------');

    await createPages(16, documentation.id);

    const allPageGroups = await getPageGroups(documentation.id);
    const rootPageGroupIds = allPageGroups.filter((pg) => pg.parentId === null).map((pg) => pg.id);
    
    for (const rootPageGroupId of rootPageGroupIds) {
      await createPages(16, documentation.id, rootPageGroupId);
    }
  }
}

addDummyData();