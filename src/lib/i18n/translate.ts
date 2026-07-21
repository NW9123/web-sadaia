import type { Messages } from "@/messages/ar";

export type TranslateVars = Record<string, string | number>;

/** A translator function: resolves a dot-path key and interpolates {vars}. */
export type Translator = (key: string, vars?: TranslateVars) => string;

function resolve(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Build a translator bound to a dictionary.
 * Missing keys return the key itself (visible in dev) rather than throwing.
 */
export function createTranslator(messages: Messages): Translator {
  return (key, vars) => {
    const template = resolve(messages, key);
    if (template === undefined) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] Missing translation key: ${key}`);
      }
      return key;
    }
    return interpolate(template, vars);
  };
}
