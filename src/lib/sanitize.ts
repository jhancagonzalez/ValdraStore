/**
 * Elimina caracteres de control no imprimibles sin tocar tabulaciones, saltos
 * de línea ni retornos de carro. Evita que un texto rompa un SVG o un prompt.
 */
export const stripControlCharacters = (value: string) => {
  let result = "";

  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;

    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)) {
      result += character;
    }
  }

  return result;
};
