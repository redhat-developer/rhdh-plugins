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

import {
  isSensitiveElement,
  redactText,
  SAFE_LABEL_EXCLUSIONS,
  sanitizeClonedDom,
  SECRET_PATTERNS,
  SENSITIVE_LABEL_PATTERN,
} from '../sensitive-data-redactor';

describe('SECRET_PATTERNS', () => {
  it('should match GitHub PATs', () => {
    expect('ghp_abcdefghijklmnopqrstuvwxyz0123456789').toMatch(
      SECRET_PATTERNS[0],
    );
  });

  it('should match GitLab PATs', () => {
    expect('glpat-abcdefghijklmnopqrst').toMatch(SECRET_PATTERNS[4]);
  });

  it('should match AWS Access Key IDs', () => {
    expect('AKIAIOSFODNN7EXAMPLE').toMatch(SECRET_PATTERNS[6]);
  });

  it('should match JWTs', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    expect(jwt).toMatch(SECRET_PATTERNS[9]);
  });
});

describe('SENSITIVE_LABEL_PATTERN', () => {
  it('should match labels containing "secret"', () => {
    expect(SENSITIVE_LABEL_PATTERN.test('Secret value')).toBe(true);
  });

  it('should match labels containing "token"', () => {
    expect(SENSITIVE_LABEL_PATTERN.test('Personal Token')).toBe(true);
  });

  it('should match labels containing "password"', () => {
    expect(SENSITIVE_LABEL_PATTERN.test('Enter password')).toBe(true);
  });

  it('should match labels containing "api key"', () => {
    expect(SENSITIVE_LABEL_PATTERN.test('API Key')).toBe(true);
  });

  it('should not match unrelated labels', () => {
    expect(SENSITIVE_LABEL_PATTERN.test('Username')).toBe(false);
    expect(SENSITIVE_LABEL_PATTERN.test('Email')).toBe(false);
  });
});

describe('SAFE_LABEL_EXCLUSIONS', () => {
  it('should match "token usage" as safe', () => {
    expect(SAFE_LABEL_EXCLUSIONS.test('Token usage: 500')).toBe(true);
  });

  it('should match "token count" as safe', () => {
    expect(SAFE_LABEL_EXCLUSIONS.test('Token count')).toBe(true);
  });

  it('should not match actual sensitive labels', () => {
    expect(SAFE_LABEL_EXCLUSIONS.test('Access token')).toBe(false);
  });
});

describe('redactText', () => {
  it('should replace GitHub PATs with [REDACTED]', () => {
    const text = 'My token is ghp_abcdefghijklmnopqrstuvwxyz0123456789 here';
    expect(redactText(text)).toBe('My token is [REDACTED] here');
  });

  it('should replace JWTs with [REDACTED]', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const text = `Bearer ${jwt}`;
    const result = redactText(text);
    expect(result).not.toContain('eyJ');
    expect(result).toContain('[REDACTED]');
  });

  it('should replace AWS access key IDs with [REDACTED]', () => {
    const text = 'aws_access_key_id = AKIAIOSFODNN7EXAMPLE';
    expect(redactText(text)).toBe('aws_access_key_id = [REDACTED]');
  });

  it('should replace Bearer tokens with [REDACTED]', () => {
    const text =
      'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.rTCH8cLoGxAm_xw68z-zXVKi9ie6xJn9tnVWjd_9ftE';
    const result = redactText(text);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('Bearer eyJ');
  });

  it('should not alter normal text', () => {
    const text = 'This is a normal sentence with no secrets.';
    expect(redactText(text)).toBe(text);
  });

  it('should handle multiple secrets in one string', () => {
    const text =
      'Key1: ghp_abcdefghijklmnopqrstuvwxyz0123456789 Key2: AKIAIOSFODNN7EXAMPLE';
    const result = redactText(text);
    expect(result).toBe('Key1: [REDACTED] Key2: [REDACTED]');
  });

  it('should handle empty string', () => {
    expect(redactText('')).toBe('');
  });
});

describe('isSensitiveElement', () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument('test');
  });

  it('should detect password inputs', () => {
    const input = doc.createElement('input');
    input.type = 'password';
    doc.body.appendChild(input);
    expect(isSensitiveElement(input, doc)).toBe(true);
  });

  it('should detect elements with sensitive aria-label', () => {
    const input = doc.createElement('input');
    input.setAttribute('aria-label', 'Access token');
    doc.body.appendChild(input);
    expect(isSensitiveElement(input, doc)).toBe(true);
  });

  it('should detect elements with associated sensitive label', () => {
    const label = doc.createElement('label');
    label.setAttribute('for', 'secret-field');
    label.textContent = 'Secret value';
    doc.body.appendChild(label);

    const input = doc.createElement('input');
    input.id = 'secret-field';
    doc.body.appendChild(input);

    expect(isSensitiveElement(input, doc)).toBe(true);
  });

  it('should detect elements inside a sensitive parent label', () => {
    const label = doc.createElement('label');
    label.textContent = 'API Key';

    const input = doc.createElement('input');
    label.appendChild(input);
    doc.body.appendChild(label);

    expect(isSensitiveElement(input, doc)).toBe(true);
  });

  it('should exclude safe labels like "token usage"', () => {
    const input = doc.createElement('input');
    input.setAttribute('aria-label', 'Token usage: 500');
    doc.body.appendChild(input);
    expect(isSensitiveElement(input, doc)).toBe(false);
  });

  it('should return false for normal text inputs', () => {
    const input = doc.createElement('input');
    input.type = 'text';
    input.setAttribute('aria-label', 'Username');
    doc.body.appendChild(input);
    expect(isSensitiveElement(input, doc)).toBe(false);
  });
});

describe('sanitizeClonedDom', () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument('test');
  });

  it('should mask password input values', () => {
    const input = doc.createElement('input');
    input.type = 'password';
    input.value = 'my-secret-password';
    doc.body.appendChild(input);

    sanitizeClonedDom(doc);

    expect(input.value).toBe('••••••••');
  });

  it('should mask inputs with sensitive labels', () => {
    const label = doc.createElement('label');
    label.setAttribute('for', 'token-input');
    label.textContent = 'Bearer Token';
    doc.body.appendChild(label);

    const input = doc.createElement('input');
    input.id = 'token-input';
    input.type = 'text';
    input.value = 'ghp_abcdefghijklmnopqrstuvwxyz0123456789';
    doc.body.appendChild(input);

    sanitizeClonedDom(doc);

    expect(input.value).toBe('••••••••');
  });

  it('should redact secrets in text nodes', () => {
    const span = doc.createElement('span');
    span.textContent = 'Token: ghp_abcdefghijklmnopqrstuvwxyz0123456789';
    doc.body.appendChild(span);

    sanitizeClonedDom(doc);

    expect(span.textContent).toBe('Token: [REDACTED]');
  });

  it('should handle visibility-toggle secrets', () => {
    const container = doc.createElement('div');
    container.className = 'Box';

    const pre = doc.createElement('pre');
    pre.textContent = 'super-secret-value-123';
    container.appendChild(pre);

    const button = doc.createElement('button');
    button.setAttribute('aria-label', 'Hide secret value');
    container.appendChild(button);

    doc.body.appendChild(container);

    sanitizeClonedDom(doc);

    expect(pre.textContent).toBe('••••••••');
  });

  it('should not modify normal text', () => {
    const p = doc.createElement('p');
    p.textContent = 'Hello, this is a normal paragraph.';
    doc.body.appendChild(p);

    sanitizeClonedDom(doc);

    expect(p.textContent).toBe('Hello, this is a normal paragraph.');
  });

  it('should not modify non-sensitive inputs', () => {
    const input = doc.createElement('input');
    input.type = 'text';
    input.setAttribute('aria-label', 'Search');
    input.value = 'my search query';
    doc.body.appendChild(input);

    sanitizeClonedDom(doc);

    expect(input.value).toBe('my search query');
  });
});
