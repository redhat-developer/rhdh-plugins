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
 * WARNING: These regexes are stateful (/g). Reset lastIndex before calling
 * .test() or .exec() directly. Prefer using redactText() instead.
 */
export const SECRET_PATTERNS: RegExp[] = [
  // GitHub tokens (classic PAT, server-to-server, OAuth, fine-grained, user-to-server, refresh)
  /gh[pousr]_[a-zA-Z0-9]{36,}/g,
  /github_pat_[a-zA-Z0-9_]{22,}/g,
  // GitLab PAT
  /glpat-[a-zA-Z0-9\-_]{20,}/g,
  // OpenAI / Anthropic API keys
  /sk-[a-zA-Z0-9-]{32,}/g,
  // AWS access key IDs
  /AKIA[0-9A-Z]{16}/g,
  // Slack tokens (app, bot, refresh, session, user)
  /xox[abrsp]-[0-9]+-[A-Za-z0-9]+/g,
  // Slack incoming webhooks
  /https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9]+\/B[A-Za-z0-9]+\/[A-Za-z0-9]+/g,
  // npm access tokens
  /npm_[A-Za-z0-9]{36,}/g,
  // Google API keys
  /AIza[A-Za-z0-9_-]{35}/g,
  // Azure AD client secrets (v2 format: 3 chars + 7Q~ or 8Q~ + 31 chars)
  /[\w~.-]{3}[78]Q~[\w~.-]{31}/g,
  // JWTs
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*/g,
  // PEM private keys
  /-----BEGIN[A-Z ]*PRIVATE KEY-----[\s\S]*?-----END[A-Z ]*PRIVATE KEY-----/g,
  // Basic auth in URIs (e.g. https://user:pass@host)
  /\w+:\/\/[^/\s:]+:[^/\s@]+@[^/\s]+/g,
  // Bearer tokens
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

  for (const attr of ['aria-label', 'name', 'title', 'placeholder']) {
    const val = el.getAttribute(attr) || '';
    if (SENSITIVE_LABEL_PATTERN.test(val) && !SAFE_LABEL_EXCLUSIONS.test(val)) {
      return true;
    }
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
  // 2. Regex-scan all remaining input/textarea values for token patterns
  clonedDoc.querySelectorAll('input, textarea').forEach(el => {
    if (isSensitiveElement(el, clonedDoc)) {
      (el as HTMLInputElement).value = MASK;
    } else {
      const inp = el as HTMLInputElement;
      if (inp.value) {
        inp.value = redactText(inp.value);
      }
    }
  });

  // 3. Regex scan all text nodes for token patterns
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

  // 4. Handle visibility-toggle secrets (e.g. Akeyless show/hide pattern)
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
