export function nullOrUndefined (a) {
  return a === null || a === undefined;
}

export function pageSize () {
  const pages = [5, 10, 15, 25, 35, 45, 55, 100];
  return pages;
}
