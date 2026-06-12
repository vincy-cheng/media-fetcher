const DISALLOWED_FILENAME_CHARS = /[^\p{L}\p{N} \-_.,&()?!]/gu;

export function sanitizeFilenameBaseName(input: string): string {
  return input.replace(DISALLOWED_FILENAME_CHARS, "_").trim();
}

export function hasDisallowedFilenameChars(input: string): boolean {
  // RegExp#test with /g is stateful; use replace comparison instead.
  return input !== input.replace(DISALLOWED_FILENAME_CHARS, "_");
}

export function extensionForFormat(format: string): string {
  return `.${format.toLowerCase()}`;
}
