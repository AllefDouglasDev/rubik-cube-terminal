// Dígitos grandes: cada glifo tem 5 linhas; "#" vira um bloco cheio.
const GLYPHS = {
  0: ["######", "##  ##", "##  ##", "##  ##", "######"],
  1: ["  ##  ", "####  ", "  ##  ", "  ##  ", "######"],
  2: ["######", "    ##", "######", "##    ", "######"],
  3: ["######", "    ##", "######", "    ##", "######"],
  4: ["##  ##", "##  ##", "######", "    ##", "    ##"],
  5: ["######", "##    ", "######", "    ##", "######"],
  6: ["######", "##    ", "######", "##  ##", "######"],
  7: ["######", "    ##", "   ## ", "  ##  ", "  ##  "],
  8: ["######", "##  ##", "######", "##  ##", "######"],
  9: ["######", "##  ##", "######", "    ##", "######"],
  ".": ["  ", "  ", "  ", "  ", "##"],
  ":": ["  ", "##", "  ", "##", "  "],
};

export const GLYPH_HEIGHT = 5;
const GAP = 2;

// Linhas do texto em dígitos grandes, ampliadas por `scale` nas duas direções.
export function bigText(text, scale = 1) {
  const glyphs = [...text].map((ch) => GLYPHS[ch]).filter(Boolean);
  const lines = [];
  for (let row = 0; row < GLYPH_HEIGHT; row++) {
    const line = glyphs
      .map((g) => [...g[row]].map((c) => c.repeat(scale)).join(""))
      .join(" ".repeat(GAP * scale));
    for (let i = 0; i < scale; i++) lines.push(line);
  }
  return lines;
}
