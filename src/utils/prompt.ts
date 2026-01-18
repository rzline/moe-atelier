export const normalizePrompt = (prompt: string) => prompt.trim().replace(/\s+/g, ' ');

export const buildPromptKey = (prompt: string) => {
  const normalized = normalizePrompt(prompt);
  return normalized ? normalized.toLowerCase() : '__empty__';
};
