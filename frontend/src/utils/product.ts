
export function sortSizes(sizes: string[]): string[] {
  const order = ['P', 'M', 'G', 'GG', 'Único'];
  return sizes.sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.localeCompare(b);
  });
}
