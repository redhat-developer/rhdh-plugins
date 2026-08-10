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

const REDACTED = '[REDACTED]';
const MASK = '••••••••';

/**
 * Regex patterns matching known secret/token formats.
 * Each pattern uses the global flag for replaceAll behavior.
 */
export const SECRET_PATTERNS: RegExp[] = [
  /ghp_[a-zA-Z0-9]{36,}/g,
  /ghs_[a-zA-Z0-9]{36,}/g,
  /gho_[a-zA-Z0-9]{36,}/g,
  /github_pat_[a-zA-Z0-9_]{22,}/g,
  /glpat-[a-zA-Z0-9\-_]{20,}/g,
  /sk-[a-zA-Z0-9]{32,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /xoxb-[0-9]+-[A-Za-z0-9]+/g,
  /xoxp-[0-9]+-[A-Za-z0-9]+/g,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*/g,
  /-----BEGIN[A-Z ]*PRIVATE KEY-----[\s\S]*?-----END[A-Z ]*PRIVATE KEY-----/g,
  /Bearer\s+[A-Za-z0-9\-._~+/]{20,}=*/g,
];

/**
 * Label text patterns that indicate a field holds sensitive content.
 */
export const SENSITIVE_LABEL_PATTERN =
  /secret|token|password|api.?key|credential|private.?key|access.?key/i;

/**
 * Label patterns that are safe false-positives and should NOT trigger redaction.
 */
export const SAFE_LABEL_EXCLUSIONS =
  /token usage|token count|token limit|token budget/i;

/**
 * Scans text for known secret patterns and replaces them with [REDACTED].
 * Used by DOM extraction to sanitize extracted text before sending.
 */
export function redactText(text: string): string {
  let result = text;
  for (const pattern of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    result = result.replace(pattern, REDACTED);
  }
  return result;
}

/**
 * Determines if an input/textarea element is likely holding a secret,
 * based on its type, aria-label, or associated label element.
 */
export function isSensitiveElement(el: Element, doc: Document): boolean {
  if ((el as HTMLInputElement).type === 'password') {
    return true;
  }

  const ariaLabel = el.getAttribute('aria-label') || '';
  if (
    SENSITIVE_LABEL_PATTERN.test(ariaLabel) &&
    !SAFE_LABEL_EXCLUSIONS.test(ariaLabel)
  ) {
    return true;
  }

  const id = el.getAttribute('id');
  if (id) {
    const label = doc.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent && SENSITIVE_LABEL_PATTERN.test(label.textContent)) {
      return !SAFE_LABEL_EXCLUSIONS.test(label.textContent);
    }
  }

  const parentLabel = el.closest('label');
  if (
    parentLabel?.textContent &&
    SENSITIVE_LABEL_PATTERN.test(parentLabel.textContent)
  ) {
    return !SAFE_LABEL_EXCLUSIONS.test(parentLabel.textContent);
  }

  return false;
}

/**
 * Sanitizes a cloned DOM before it is rendered to canvas.
 * Used in html2canvas onclone callback.
 * Mutates the clone — safe because it's not the live DOM.
 */
export function sanitizeClonedDom(clonedDoc: Document): void {
  // 1. Mask all sensitive inputs/textareas (password fields + label-detected)
  clonedDoc.querySelectorAll('input, textarea').forEach(el => {
    if (isSensitiveElement(el, clonedDoc)) {
      (el as HTMLInputElement).value = MASK;
    }
  });

  // 2. Regex scan all text nodes for token patterns
  const walker = clonedDoc.createTreeWalker(
    clonedDoc.body,
    NodeFilter.SHOW_TEXT,
  );
  let node = walker.nextNode();
  while (node) {
    if (node.textContent) {
      const redacted = redactText(node.textContent);
      if (redacted !== node.textContent) {
        node.textContent = redacted;
      }
    }
    node = walker.nextNode();
  }

  // 3. Handle visibility-toggle secrets (e.g. Akeyless show/hide pattern)
  clonedDoc
    .querySelectorAll(
      '[aria-label*="Hide secret" i], [aria-label*="Hide value" i]',
    )
    .forEach(btn => {
      const container = btn.closest('[class*="Box"], [class*="flex"]');
      if (container) {
        const textEl = container.querySelector('pre, code, span, p');
        if (textEl?.textContent && textEl.textContent !== MASK) {
          textEl.textContent = MASK;
        }
      }
    });
}
