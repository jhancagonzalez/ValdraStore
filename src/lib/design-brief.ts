export const MAX_DESIGN_BRIEF_LENGTH = 1200;

/** Acumula el brief sin permitir que crezca indefinidamente entre revisiones. */
export const appendDesignBrief = (current: string, idea: string) => {
  const next = current.trim() ? `${current.trim()}. ${idea.trim()}` : idea.trim();
  return next.slice(0, MAX_DESIGN_BRIEF_LENGTH);
};
