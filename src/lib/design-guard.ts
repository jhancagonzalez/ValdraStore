/**
 * Reglas de uso de la IA de personalización (HU-12, HU-16).
 *
 * Se ejecutan en el navegador para avisar al instante y en el servidor como
 * control obligatorio, antes de gastar cuota del proveedor. Son deterministas y
 * baratas; la moderación con modelo (`services/personalization/moderation.ts`) es
 * una segunda capa solo en el servidor.
 *
 * No sustituyen la revisión humana: bloquean lo evidente (contenido sexual,
 * violento u ofensivo, marcas registradas, peticiones ajenas al diseño de ropa) y
 * redirigen las peticiones que el modelo resuelve mal (color de la prenda, cambios
 * de toda la prenda en el modo por zona).
 */

export type DesignGuardMode = "create" | "zone" | "redesign" | "text";

export type DesignGuardCode =
  | "empty"
  | "too-short"
  | "blocked-content"
  | "offensive-language"
  | "brand"
  | "personal-data"
  | "off-topic"
  | "garment-color"
  | "whole-garment-zone"
  | "zone-too-large";

export type DesignGuardIssue = {
  code: DesignGuardCode;
  title: string;
  message: string;
  /** Clave de color de una prenda base que cumple lo pedido (para ofrecer el cambio). */
  suggestedColorKey?: string;
  /** La petición funciona mejor con «Rediseñar estampado». */
  suggestRedesign?: boolean;
};

export type DesignGuardInput = {
  idea: string;
  mode: DesignGuardMode;
  /** Color de la prenda base actual (`black`, `white`, `red`, `beige`, `blue`). */
  baseColorKey?: string;
  /** Área de la zona marcada (0 a 1), solo en el modo por zona. */
  selectionArea?: number;
};

/** Por encima de esta área el inpainting reconstruye la prenda en lugar del estampado. */
export const MAX_ZONE_AREA = 0.45;

const MIN_IDEA_CHARACTERS = 3;

export const BASE_COLOR_LABELS: Record<string, string> = {
  beige: "beige",
  black: "negro",
  blue: "azul",
  red: "rojo",
  white: "blanco",
};

/** Minúsculas, sin tildes y con sustituciones habituales para evadir filtros. */
export const normalizeForGuard = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/\$/g, "s")
    .replace(/[_*.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const words = (...terms: string[]) => new RegExp(`\\b(?:${terms.join("|")})\\b`, "i");

/** Contenido que no se imprime ni se envía al modelo. */
const BLOCKED_CONTENT = words(
  // Sexual
  "desnud\\w*",
  "porno\\w*",
  "sexo",
  "sexual\\w*",
  "erotic\\w*",
  "nsfw",
  "xxx",
  "hentai",
  "pene",
  "vagina",
  "genital\\w*",
  "nude\\w*",
  "naked",
  "porn\\w*",
  "sex",
  "topless",
  // Violencia gráfica y autolesión
  "sangre",
  "sangrient\\w*",
  "gore",
  "decapitad\\w*",
  "mutilad\\w*",
  "cadaver\\w*",
  "tortur\\w*",
  "asesinat\\w*",
  "masacre",
  "descuartiz\\w*",
  "suicid\\w*",
  "autolesi\\w*",
  "ahorcad\\w*",
  "blood\\w*",
  "corpse\\w*",
  "murder\\w*",
  "self harm",
  // Odio y extremismo
  "nazi\\w*",
  "esvastica\\w*",
  "svastica\\w*",
  "swastika\\w*",
  "hitler",
  "kkk",
  "ku klux",
  "white power",
  "supremacia blanca",
  "sieg heil",
  "terroris\\w*",
  // Armas y drogas
  "explosiv\\w*",
  "coche bomba",
  "bomba casera",
  "pistola\\w*",
  "revolver\\w*",
  "fusil\\w*",
  "rifle\\w*",
  "ametrallador\\w*",
  "arma de fuego",
  "armas de fuego",
  "cocaina",
  "heroina",
  "metanfetamina",
  "marihuana",
  "cannabis",
  "cocaine",
  "heroin",
  "meth",
  "weed",
);

/** Insultos y lenguaje discriminatorio. */
const OFFENSIVE_LANGUAGE = words(
  "hijueputa\\w*",
  "hijo de puta",
  "malparid\\w*",
  "gonorrea",
  "puta\\w*",
  "puto\\w*",
  "mierda",
  "marica\\w*",
  "maricon\\w*",
  "cabron\\w*",
  "pendej\\w*",
  "fuck\\w*",
  "shit\\w*",
  "bitch\\w*",
  "nigg\\w*",
  "faggot\\w*",
  "retrasad\\w*",
);

/** Marcas, personajes y escudos con derechos de terceros. */
const BRANDS = words(
  "nike",
  "adidas",
  "reebok",
  "gucci",
  "louis vuitton",
  "chanel",
  "prada",
  "versace",
  "balenciaga",
  "supreme",
  "off white",
  "lacoste",
  "tommy hilfiger",
  "ralph lauren",
  "disney",
  "pixar",
  "marvel",
  "dc comics",
  "batman",
  "superman",
  "spiderman",
  "spider man",
  "mickey\\w*",
  "minnie",
  "pokemon",
  "pikachu",
  "hello kitty",
  "star wars",
  "harry potter",
  "coca cola",
  "pepsi",
  "mcdonald\\w*",
  "starbucks",
  "real madrid",
  "fc barcelona",
  "manchester united",
  "america de cali",
  "deportivo cali",
  "atletico nacional",
  "millonarios",
);

const THIRD_PARTY_LOGO = /\b(?:logo|logotipo|escudo|emblema)s? (?:de|del) (?!mi\b|mis\b|nuestr)/i;

const PERSONAL_DATA = [
  /\bhttps?:\/\//i,
  /\bwww\./i,
  /\b[\w-]+\.(?:com|co|net|org|io|app|me|ly)\b/i,
  /[\w.+-]+@[\w-]+\.[\w.]+/,
  /\b\d[\d ]{6,}\d\b/,
];

/** Peticiones que intentan usar la IA para otra cosa o cambiar sus reglas. */
const OFF_TOPIC = words(
  "ignora (?:las|tus|todas las) (?:instrucciones|reglas)",
  "olvida (?:las|tus) (?:instrucciones|reglas)",
  "instrucciones (?:anteriores|del sistema)",
  "prompt del sistema",
  "system prompt",
  "ignore (?:all |the )?(?:previous|above|instructions)",
  "jailbreak",
  "actua como",
  "act as",
  "explicame",
  "explica (?:como|que|por que)",
  "como se hace",
  "escribe (?:un|una|el) (?:codigo|programa|ensayo|poema|correo|cuento)",
  "codigo en",
  "programa en",
  "receta de",
  "tarea de",
  "traduce",
);

/** Preguntas dirigidas al asistente en lugar de una descripción visual. */
const QUESTION =
  /^[¿¡ ]*(?:que|como|cual|cuales|cuanto|cuantos|donde|cuando|por que|quien|what|how|why|who|where)\b.*\?\s*$/i;

const GARMENT_NOUN =
  "(?:camisa|camisas|camiseta|camisetas|prenda|prendas|hoodie|hoodies|buzo|buzos|saco|sacos|sudadera|sudaderas|polo|playera|remera|tela)";

const COLOR_WORDS: Record<string, string> = {
  azul: "blue",
  beige: "beige",
  blanca: "white",
  blanco: "white",
  crema: "beige",
  hueso: "beige",
  negra: "black",
  negro: "black",
  roja: "red",
  rojo: "red",
};

const ANY_COLOR =
  "(azul|beige|blanca|blanco|crema|hueso|negra|negro|roja|rojo|verde|amarill[oa]|morad[oa]|rosad[oa]|rosa|gris|naranja|cafe|marron|vinotinto|fucsia)";

/** Inicio de frase o verbo de cambio, para no confundir «un perro con camiseta azul». */
const GARMENT_LEAD =
  "(?:^(?:una |un |la |el )?|\\b(?:cambia\\w*|pon\\w*|haz\\w*|vuelve\\w*|pinta\\w*|tine\\w*|quiero|deja\\w*) (?:la |el |una |un |toda la |todo el )?)";

const GARMENT_COLOR_PATTERNS = [
  new RegExp(`\\bcolor (?:de|del) (?:la |el )?${GARMENT_NOUN}\\b(?:.*?\\b${ANY_COLOR}\\b)?`, "i"),
  new RegExp(
    `${GARMENT_LEAD}${GARMENT_NOUN}(?: completa| entera)?(?: (?:de|en))?(?: color)? ${ANY_COLOR}\\b`,
    "i",
  ),
  new RegExp(`\\btoda la ${GARMENT_NOUN}\\b.*?\\b${ANY_COLOR}\\b`, "i"),
  new RegExp(`\\b${ANY_COLOR}\\b.*?\\btoda la ${GARMENT_NOUN}\\b`, "i"),
];

const WHOLE_GARMENT =
  /\b(?:tod[oa] (?:la|el) (?:prenda|camis\w*|diseno|estampado|tela|frente)|enter[oa]|complet[oa])\b/i;

const issue = (code: DesignGuardCode, title: string, message: string): DesignGuardIssue => ({
  code,
  title,
  message,
});

/** Devuelve el color pedido para la prenda o `null` si la petición no cambia la prenda. */
export const detectGarmentColorChange = (
  normalizedIdea: string,
): { colorKey: string | null; colorWord: string | null } | null => {
  for (const pattern of GARMENT_COLOR_PATTERNS) {
    const match = normalizedIdea.match(pattern);

    if (match) {
      const colorWord = match.slice(1).find(Boolean) ?? null;
      return { colorKey: colorWord ? (COLOR_WORDS[colorWord] ?? null) : null, colorWord };
    }
  }

  return null;
};

/**
 * Revisa una petición de diseño. Devuelve el primer problema encontrado o `null`
 * si se puede enviar al modelo.
 */
export const checkDesignRequest = ({
  baseColorKey,
  idea,
  mode,
  selectionArea,
}: DesignGuardInput): DesignGuardIssue | null => {
  const trimmed = idea.trim();

  if (trimmed.length === 0) {
    return issue(
      "empty",
      "Falta tu descripción",
      mode === "create"
        ? "Escribe qué quieres en el estampado antes de generar la propuesta."
        : "Escribe qué cambio quieres antes de enviarlo.",
    );
  }

  if (trimmed.replace(/\s/g, "").length < MIN_IDEA_CHARACTERS) {
    return issue(
      "too-short",
      "Describe un poco más",
      "Usa al menos unas palabras: por ejemplo, «un colibrí con flores en el pecho».",
    );
  }

  const normalized = normalizeForGuard(trimmed);

  if (BLOCKED_CONTENT.test(normalized)) {
    return issue(
      "blocked-content",
      "No podemos crear ese diseño",
      "Los estampados no pueden incluir contenido sexual, violento, de odio, armas ni drogas. Prueba con otra idea.",
    );
  }

  if (OFFENSIVE_LANGUAGE.test(normalized)) {
    return issue(
      "offensive-language",
      "Evita palabras ofensivas",
      "No imprimimos insultos ni lenguaje discriminatorio. Cambia el texto e inténtalo de nuevo.",
    );
  }

  if (BRANDS.test(normalized) || THIRD_PARTY_LOGO.test(normalized)) {
    return issue(
      "brand",
      "Sin marcas ni personajes registrados",
      "No podemos usar logos, marcas, escudos ni personajes con derechos de terceros. Describe un diseño original.",
    );
  }

  if (PERSONAL_DATA.some((pattern) => pattern.test(trimmed))) {
    return issue(
      "personal-data",
      "Quita enlaces y datos personales",
      "La descripción no puede incluir enlaces, correos ni números de teléfono.",
    );
  }

  if (OFF_TOPIC.test(normalized) || QUESTION.test(normalized)) {
    return issue(
      "off-topic",
      "Solo diseños para tu prenda",
      "La IA solo crea y ajusta estampados. Describe lo que quieres ver impreso, por ejemplo «montañas con un sol naranja».",
    );
  }

  const garmentColor = detectGarmentColorChange(normalized);

  if (garmentColor && (!garmentColor.colorKey || garmentColor.colorKey !== baseColorKey)) {
    const available = Object.values(BASE_COLOR_LABELS).join(", ");
    const result = issue(
      "garment-color",
      "El color de la prenda se elige en el paso «Prenda»",
      garmentColor.colorKey
        ? `La IA solo cambia el estampado. Para una prenda de color ${BASE_COLOR_LABELS[garmentColor.colorKey]}, elige esa prenda base.`
        : `La IA solo cambia el estampado. Las prendas disponibles son: ${available}.`,
    );
    return garmentColor.colorKey ? { ...result, suggestedColorKey: garmentColor.colorKey } : result;
  }

  if (mode === "zone") {
    if (WHOLE_GARMENT.test(normalized)) {
      return {
        ...issue(
          "whole-garment-zone",
          "Ese cambio es para todo el diseño",
          "«Editar la zona» solo modifica un área pequeña. Para cambiar todo el estampado usa «Rediseñar estampado».",
        ),
        suggestRedesign: true,
      };
    }

    if (selectionArea !== undefined && selectionArea > MAX_ZONE_AREA) {
      return {
        ...issue(
          "zone-too-large",
          "La zona marcada es muy grande",
          "Marca un área más pequeña (por ejemplo «Pecho») o usa «Rediseñar estampado» para cambiar todo el diseño.",
        ),
        suggestRedesign: true,
      };
    }
  }

  return null;
};
