/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate translation data
 */
export async function validateTranslationData(
  data: Record<string, string>,
  language: string,
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check for empty keys
  const emptyKeys = Object.entries(data).filter(
    ([key]) => !key || key.trim() === '',
  );
  if (emptyKeys.length > 0) {
    result.errors.push(`Found ${emptyKeys.length} empty keys`);
    result.isValid = false;
  }

  // Check for empty values
  const emptyValues = Object.entries(data).filter(
    ([, value]) => !value || value.trim() === '',
  );
  if (emptyValues.length > 0) {
    result.warnings.push(
      `Found ${emptyValues.length} empty values for language ${language}`,
    );
  }

  // Check for duplicate keys
  const keys = Object.keys(data);
  const uniqueKeys = new Set(keys);
  if (keys.length !== uniqueKeys.size) {
    result.errors.push(`Found duplicate keys`);
    result.isValid = false;
  }

  // Check for very long keys (potential issues)
  const longKeys = Object.entries(data).filter(([key]) => key.length > 100);
  if (longKeys.length > 0) {
    result.warnings.push(
      `Found ${longKeys.length} very long keys (>100 chars)`,
    );
  }

  // Check for very long values (potential issues)
  const longValues = Object.entries(data).filter(
    ([, value]) => value.length > 500,
  );
  if (longValues.length > 0) {
    result.warnings.push(
      `Found ${longValues.length} very long values (>500 chars)`,
    );
  }

  // Check for keys with special characters that might cause issues
  const specialCharKeys = Object.entries(data).filter(([key]) =>
    /[<>{}[\]()\\\/]/.test(key),
  );
  if (specialCharKeys.length > 0) {
    result.warnings.push(
      `Found ${specialCharKeys.length} keys with special characters`,
    );
  }

  // Check for missing translations (keys that are the same as values)
  const missingTranslations = Object.entries(data).filter(
    ([key, value]) => key === value,
  );
  if (missingTranslations.length > 0) {
    result.warnings.push(
      `Found ${missingTranslations.length} keys that match their values (possible missing translations)`,
    );
  }

  // Check for HTML tags in translations
  // ReDoS protection: use bounded quantifier instead of * to prevent backtracking
  // Limit tag content to 1000 chars to prevent DoS attacks
  const htmlTags = Object.entries(data).filter(([, value]) => {
    // Validate input length first
    if (value.length > 10000) return false; // Skip very long values
    // Use bounded quantifier {0,1000} instead of * to prevent ReDoS
    return /<[^>]{0,1000}>/.test(value);
  });
  if (htmlTags.length > 0) {
    result.warnings.push(`Found ${htmlTags.length} values with HTML tags`);
  }

  // Check for placeholder patterns
  // ReDoS protection: use bounded quantifiers and simpler alternation
  // Limit placeholder content to 500 chars to prevent DoS attacks
  const placeholderPatterns = Object.entries(data).filter(([, value]) => {
    // Validate input length first
    if (value.length > 10000) return false; // Skip very long values
    // Use bounded quantifier {0,500} instead of *? to prevent ReDoS
    // Simplified pattern: check for common placeholder patterns
    return (
      /\{\{/.test(value) ||
      /\$\{/.test(value) ||
      /\%\{/.test(value) ||
      /\{[^}]{0,500}\}/.test(value)
    );
  });
  if (placeholderPatterns.length > 0) {
    result.warnings.push(
      `Found ${placeholderPatterns.length} values with placeholder patterns`,
    );
  }

  // Check for Unicode curly apostrophes/quotes (typographic quotes)
  // U+2018: LEFT SINGLE QUOTATION MARK (')
  // U+2019: RIGHT SINGLE QUOTATION MARK (')
  // U+201C: LEFT DOUBLE QUOTATION MARK (")
  // U+201D: RIGHT DOUBLE QUOTATION MARK (")
  const curlyApostrophes = Object.entries(data).filter(([, value]) =>
    /[\u2018\u2019]/.test(value),
  );
  if (curlyApostrophes.length > 0) {
    result.warnings.push(
      `Found ${curlyApostrophes.length} values with Unicode curly apostrophes (', ') - ` +
        `consider normalizing to standard apostrophe (')`,
    );
  }

  const curlyQuotes = Object.entries(data).filter(([, value]) =>
    /[""]/.test(value),
  );
  if (curlyQuotes.length > 0) {
    result.warnings.push(
      `Found ${curlyQuotes.length} values with Unicode curly quotes (", ") - ` +
        `consider normalizing to standard quotes (")`,
    );
  }

  return result;
}
