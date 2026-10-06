/** Lowercase without accents, for searches that should match "Barán" with "baran". */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
}
