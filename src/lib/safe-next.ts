const hasControlCharacter = (value: string): boolean =>
  [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });

/**
 * Accepts only same-origin absolute paths. Rejects protocol-relative paths,
 * backslashes and control characters (which URL parsers can strip and turn
 * into an external redirect). Returns the fallback otherwise.
 */
export const safeNextPath = (value: string | undefined, fallback?: string): string | undefined => {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  if (hasControlCharacter(value)) {
    return fallback;
  }

  return value;
};
