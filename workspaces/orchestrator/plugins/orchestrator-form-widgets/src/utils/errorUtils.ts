export const getErrorMessage = (prefix: string, error: unknown): string => {
  if (!error) {
    return prefix;
  }
  if (error instanceof Error && error.message) {
    return `${prefix}: ${error.message}`;
  }
  const errorString = String(error);
  return errorString ? `${prefix}: ${errorString}` : prefix;
};
