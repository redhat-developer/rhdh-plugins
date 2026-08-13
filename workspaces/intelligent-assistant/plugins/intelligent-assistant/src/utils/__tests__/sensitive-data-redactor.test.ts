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
  SENSITIVE_LABEL_PATTERN,
} from '../sensitive-data-redactor';

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
  // --- GitHub tokens ---
  it('should replace GitHub classic PATs (ghp_)', () => {
    const text = 'token: ghp_ABCDEFghijklmnopqrstuvwxyz0123456789';
    expect(redactText(text)).toBe('token: [REDACTED]');
  });

  it('should replace GitHub server tokens (ghs_)', () => {
    const text = 'ghs_ABCDEFghijklmnopqrstuvwxyz0123456789';
    expect(redactText(text)).toBe('[REDACTED]');
  });

  it('should replace GitHub OAuth tokens (gho_)', () => {
    const text = 'gho_ABCDEFghijklmnopqrstuvwxyz0123456789';
    expect(redactText(text)).toBe('[REDACTED]');
  });

  it('should replace GitHub user-to-server tokens (ghu_)', () => {
    const text = 'ghu_ABCDEFghijklmnopqrstuvwxyz0123456789';
    expect(redactText(text)).toBe('[REDACTED]');
  });

  it('should replace GitHub refresh tokens (ghr_)', () => {
    const text = 'ghr_ABCDEFghijklmnopqrstuvwxyz0123456789';
    expect(redactText(text)).toBe('[REDACTED]');
  });

  it('should replace GitHub fine-grained PATs (github_pat_)', () => {
    const text =
      'github_pat_11ABCDEF22_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP';
    expect(redactText(text)).toBe('[REDACTED]');
  });

  // --- GitLab PAT ---
  it('should replace GitLab PATs (glpat-)', () => {
    const text = 'GITLAB_TOKEN=glpat-AAAABBBBCCCCDDDDEEEE';
    expect(redactText(text)).toBe('GITLAB_TOKEN=[REDACTED]');
  });

  // --- OpenAI / Anthropic ---
  it('should replace OpenAI keys (old format)', () => {
    const text = 'sk-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKL';
    expect(redactText(text)).toBe('[REDACTED]');
  });

  it('should replace OpenAI keys with hyphens (new format)', () => {
    const text =
      'key: sk-proj-abc123-def456-ghi789-jklmnopqrstuvwxyz0123456789abc';
    expect(redactText(text)).toBe('key: [REDACTED]');
  });

  // --- AWS ---
  it('should replace AWS access key IDs (AKIA)', () => {
    const text = 'aws_access_key_id = AKIAIOSFODNN7EXAMPLE';
    expect(redactText(text)).toBe('aws_access_key_id = [REDACTED]');
  });

  // --- Slack tokens (all 5 prefixes) ---
  it('should replace Slack bot tokens (xoxb-)', () => {
    const text = 'SLACK_TOKEN=xoxb-123456789012-1234567890123';
    expect(redactText(text)).toBe('SLACK_TOKEN=[REDACTED]');
  });

  it('should replace Slack user tokens (xoxp-)', () => {
    const text = 'token: xoxp-123456789012-abcdef1234567890';
    expect(redactText(text)).toBe('token: [REDACTED]');
  });

  it('should replace Slack app-level tokens (xoxa-)', () => {
    const text = 'xoxa-2-123456';
    expect(redactText(text)).toBe('[REDACTED]');
  });

  it('should replace Slack refresh tokens (xoxr-)', () => {
    const text = 'refresh: xoxr-123456-abcdef7890';
    expect(redactText(text)).toBe('refresh: [REDACTED]');
  });

  it('should replace Slack session tokens (xoxs-)', () => {
    const text = 'session: xoxs-987654-ghijkl1234';
    expect(redactText(text)).toBe('session: [REDACTED]');
  });

  // --- Slack webhooks ---
  it('should replace Slack incoming webhook URLs', () => {
    const text =
      'url: https://hooks.slack.com/services/T024F9JRE/B024F9JRE/abc123def456ghi789';
    expect(redactText(text)).toBe('url: [REDACTED]');
  });

  // --- npm tokens ---
  it('should replace npm access tokens (npm_)', () => {
    const text = 'NPM_TOKEN=npm_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789ab';
    expect(redactText(text)).toBe('NPM_TOKEN=[REDACTED]');
  });

  // --- Google API keys ---
  it('should replace Google API keys (AIza)', () => {
    const text = 'GOOGLE_API_KEY=AIzaSyA1bcDeFgHiJkLmNoPqRsTuVwXyZ012345';
    expect(redactText(text)).toBe('GOOGLE_API_KEY=[REDACTED]');
  });

  // --- Azure AD client secrets ---
  it('should replace Azure AD client secrets (7Q~ format)', () => {
    const text = 'AZURE_SECRET=abc7Q~abcdefghijklmnopqrstuvwxyz01234';
    expect(redactText(text)).toBe('AZURE_SECRET=[REDACTED]');
  });

  it('should replace Azure AD client secrets (8Q~ format)', () => {
    const text = 'secret: XYZ8Q~ABCDEFGHIJKLMNOPQRSTUVWXYZabcde';
    expect(redactText(text)).toBe('secret: [REDACTED]');
  });

  // --- JWTs ---
  it('should replace JWTs', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const result = redactText(jwt);
    expect(result).not.toContain('eyJ');
    expect(result).toContain('[REDACTED]');
  });

  // --- PEM private keys ---
  it('should replace PEM private keys', () => {
    const text =
      '-----BEGIN RSA PRIVATE KEY-----\nMIIBogIBAAJBALRiMLAH\n-----END RSA PRIVATE KEY-----';
    expect(redactText(text)).toBe('[REDACTED]');
  });

  // --- Basic auth in URIs ---
  it('should replace Basic auth in URIs', () => {
    const text = 'db: mongodb://admin:SuperSecret123@db.example.com:27017/mydb';
    const result = redactText(text);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('SuperSecret123');
  });

  it('should replace postgres connection strings with credentials', () => {
    const text = 'postgres://dbuser:p4ssw0rd@localhost:5432/catalog';
    const result = redactText(text);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('p4ssw0rd');
  });

  // --- Bearer tokens ---
  it('should replace Bearer tokens', () => {
    const text =
      'Authorization: Bearer ya29.a0AfH6SMBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const result = redactText(text);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('ya29');
  });

  // --- General ---
  it('should not alter normal text', () => {
    const text = 'This is a normal sentence with no secrets.';
    expect(redactText(text)).toBe(text);
  });

  it('should handle multiple secrets in one string', () => {
    const text =
      'Key1: ghp_ABCDEFghijklmnopqrstuvwxyz0123456789 Key2: AKIAIOSFODNN7EXAMPLE';
    const result = redactText(text);
    expect(result).toBe('Key1: [REDACTED] Key2: [REDACTED]');
  });

  it('should handle empty string', () => {
    expect(redactText('')).toBe('');
  });

  it('should not false-positive on URLs without credentials', () => {
    const text = 'Visit https://example.com/api/v1/users';
    expect(redactText(text)).toBe(text);
  });

  it('should not false-positive on UUIDs', () => {
    const text = '550e8400-e29b-41d4-a716-446655440000';
    expect(redactText(text)).toBe(text);
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

  it('should detect elements with sensitive name attribute', () => {
    const input = doc.createElement('input');
    input.setAttribute('name', 'api_token');
    doc.body.appendChild(input);
    expect(isSensitiveElement(input, doc)).toBe(true);
  });

  it('should detect elements with sensitive placeholder', () => {
    const input = doc.createElement('input');
    input.setAttribute('placeholder', 'Enter your secret key');
    doc.body.appendChild(input);
    expect(isSensitiveElement(input, doc)).toBe(true);
  });

  it('should detect elements with sensitive title', () => {
    const input = doc.createElement('input');
    input.setAttribute('title', 'Access token');
    doc.body.appendChild(input);
    expect(isSensitiveElement(input, doc)).toBe(true);
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

  it('should not modify non-sensitive inputs without tokens', () => {
    const input = doc.createElement('input');
    input.type = 'text';
    input.setAttribute('aria-label', 'Search');
    input.value = 'my search query';
    doc.body.appendChild(input);

    sanitizeClonedDom(doc);

    expect(input.value).toBe('my search query');
  });

  it('should redact token pasted in a non-sensitive input', () => {
    const input = doc.createElement('input');
    input.type = 'text';
    input.setAttribute('aria-label', 'Search');
    input.value = 'find ghp_abcdefghijklmnopqrstuvwxyz0123456789 in results';
    doc.body.appendChild(input);

    sanitizeClonedDom(doc);

    expect(input.value).toBe('find [REDACTED] in results');
  });
});
