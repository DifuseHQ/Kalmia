export function nullOrUndefined (a) {
  return a === null || a === undefined;
}

export function pageSize () {
  const pages = [10, 50, 100, 1000];
  return pages;
}

export const languages = [
  { code: 'eng', lang: 'English' },
  { code: 'mal', lang: 'Malayalam' },
  { code: 'hin', lang: 'Hindi' }
];
