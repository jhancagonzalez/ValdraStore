const INSERTION_VERB =
  /\b(agrega|añade|pon|escribe|coloca|imprime|incluye|que\s+diga|que\s+digan|diciendo)\b/i;
const REMOVAL_VERB = /\b(quita|elimina|borra|remueve|saca)\b/i;
const DESIGN_NOUN =
  /\b(borde|color|patrón|patron|fondo|forma|diseño|diseno|raya|rayas|línea|linea|estrella|sol|luna|flor|árbol|arbol|textura|sombra|logo|imagen|figura)\b/i;
const BAD_PREFIX =
  /^(en|de|con|para|más|mas|muy|el|la|los|las|un|una|grande|grandes|pequeño|pequeña|pequeños|pequeñas|negro|negra|blanco|blanca|rojo|roja|azul|beige)\b/i;

const DOUBLE_QUOTED = /["“]([^"”]{1,80})["”]/;
const SINGLE_QUOTED = /'([^']{1,80})'/;
const CAPS_TEXT = /\b[A-Z][A-Z0-9]*(?:\s+[A-Z][A-Z0-9]*){1,4}\b/;

const TEXT_PATTERNS = [
  /(?:palabra|palabras|texto|frase|letras)\s*(?:que\s+diga|que\s+digan|diciendo|:)?\s*(.+)$/i,
  /(?:que\s+diga|que\s+digan|diciendo)\s+(.+)$/i,
  /(?:word|text|saying)\s+(.+)$/i,
];

const WRITE_PATTERNS = [/(?:escribe|coloca|imprime)\s+(.+)$/i];

const cleanExtractedText = (value: string) => {
  const text = value
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/[.,;:]+$/g, "")
    .replace(
      /\s+(?:en|al|sobre)\s+(?:el|la|los|las)?\s*(?:pecho|manga|espalda|centro|zona|arriba|abajo|hombro|cintura)\b.*$/i,
      "",
    )
    .replace(/\s+(?:de\s+color|color)\s+.*$/i, "")
    .replace(/\s+(?:más|mas|muy)\s+.*$/i, "")
    .trim();

  if (text.length === 0 || BAD_PREFIX.test(text) || DESIGN_NOUN.test(text)) {
    return null;
  }

  return text;
};

/**
 * Extrae el texto que el cliente quiere imprimir. Solo acepta inserciones
 * explícitas o una frase en mayúsculas entre comillas; nunca interpreta una
 * instrucción de borrado o de estilo como texto.
 */
export const extractDesignText = (idea: string): string | null => {
  const trimmed = idea.trim();

  if (trimmed.length === 0 || (REMOVAL_VERB.test(trimmed) && !INSERTION_VERB.test(trimmed))) {
    return null;
  }

  const quoted = trimmed.match(DOUBLE_QUOTED) ?? trimmed.match(SINGLE_QUOTED);
  const quotedIsStandalone = Boolean(quoted?.[0] && trimmed === quoted[0]);

  if (quoted?.[1] && (INSERTION_VERB.test(trimmed) || quotedIsStandalone)) {
    const text = cleanExtractedText(quoted[1]);

    if (text) {
      return text;
    }
  }

  if (INSERTION_VERB.test(trimmed)) {
    for (const pattern of TEXT_PATTERNS) {
      const match = trimmed.match(pattern);
      const text = match?.[1] ? cleanExtractedText(match[1]) : null;

      if (text) {
        return text;
      }
    }

    for (const pattern of WRITE_PATTERNS) {
      const match = trimmed.match(pattern);
      const text = match?.[1] ? cleanExtractedText(match[1]) : null;

      if (text) {
        return text;
      }
    }
  }

  const caps = trimmed.match(CAPS_TEXT);

  if (!caps?.[0]) {
    return null;
  }

  const prefix = trimmed.slice(0, caps.index ?? 0);
  const capsIsStandalone = trimmed === caps[0] && !DESIGN_NOUN.test(prefix);

  if ((INSERTION_VERB.test(trimmed) && !DESIGN_NOUN.test(prefix)) || capsIsStandalone) {
    const text = cleanExtractedText(caps[0])?.replace(
      /^(agrega|añade|pon|escribe|coloca|imprime|incluye)\s+/i,
      "",
    );

    return text ?? null;
  }

  return null;
};
