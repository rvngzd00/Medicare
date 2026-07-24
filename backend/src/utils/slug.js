const replacements = new Map([
  ['ə', 'e'],
  ['Ə', 'e'],
  ['ı', 'i'],
  ['İ', 'i'],
  ['ö', 'o'],
  ['Ö', 'o'],
  ['ü', 'u'],
  ['Ü', 'u'],
  ['ş', 's'],
  ['Ş', 's'],
  ['ç', 'c'],
  ['Ç', 'c'],
  ['ğ', 'g'],
  ['Ğ', 'g']
]);

export function toSlug(value) {
  return [...String(value || '')]
    .map((character) => replacements.get(character) ?? character)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}
