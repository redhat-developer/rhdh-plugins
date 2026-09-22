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

/* eslint-disable no-script-url */

import { isAllowedUrl, parseAbsoluteUrl } from './urlPolicy';

describe('parseAbsoluteUrl', () => {
  it('parses absolute http/https URLs', () => {
    const http = parseAbsoluteUrl('http://example.com/path');
    expect(http).not.toBeNull();
    expect(http!.protocol).toBe('http:');
    expect(http!.hostname).toBe('example.com');

    const https = parseAbsoluteUrl('https://example.com');
    expect(https).not.toBeNull();
    expect(https!.protocol).toBe('https:');
  });

  it('parses absolute URLs with non-http schemes', () => {
    const parsed = parseAbsoluteUrl('javascript:alert(1)');
    expect(parsed).not.toBeNull();
    expect(parsed!.protocol).toBe('javascript:');
  });

  it('returns null for non-absolute URLs', () => {
    expect(parseAbsoluteUrl('/relative/path')).toBeNull();
    expect(parseAbsoluteUrl('//evil.example/path')).toBeNull();
    expect(parseAbsoluteUrl('git@github.com:org/repo.git')).toBeNull();
    expect(parseAbsoluteUrl('@scope/pkg')).toBeNull();
  });
});

describe('isAllowedUrl (D11)', () => {
  describe('allowed schemes', () => {
    it('accepts http URL', () => {
      expect(isAllowedUrl('http://example.com')).toBe(true);
    });

    it('accepts https URL', () => {
      expect(isAllowedUrl('https://example.com')).toBe(true);
    });

    it('accepts HTTP (case-insensitive)', () => {
      expect(isAllowedUrl('HTTP://example.com')).toBe(true);
    });

    it('accepts HTTPS (case-insensitive)', () => {
      expect(isAllowedUrl('HTTPS://example.com')).toBe(true);
    });

    it('accepts http://localhost:7007/api/mcp/v1', () => {
      expect(isAllowedUrl('http://localhost:7007/api/mcp/v1')).toBe(true);
    });

    it('accepts http://10.0.0.5:8080/mcp (private-looking IPv4)', () => {
      expect(isAllowedUrl('http://10.0.0.5:8080/mcp')).toBe(true);
    });

    it('accepts https://gitlab.internal/org/repo', () => {
      expect(isAllowedUrl('https://gitlab.internal/org/repo')).toBe(true);
    });
  });

  describe('refused schemes', () => {
    it('refuses javascript:', () => {
      expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
    });

    it('refuses data:', () => {
      expect(isAllowedUrl('data:text/html,<script>alert(1)</script>')).toBe(
        false,
      );
    });

    it('refuses file:', () => {
      expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
    });

    it('refuses vbscript:', () => {
      expect(isAllowedUrl('vbscript:MsgBox("test")')).toBe(false);
    });

    it('refuses blob:', () => {
      expect(isAllowedUrl('blob:http://example.com/uuid')).toBe(false);
    });
  });

  describe('non-absolute URLs', () => {
    it('refuses relative path', () => {
      expect(isAllowedUrl('/relative/path')).toBe(false);
    });

    it('refuses scheme-relative //host', () => {
      expect(isAllowedUrl('//evil.example/path')).toBe(false);
    });

    it('refuses scp-like git@host:path', () => {
      expect(isAllowedUrl('git@github.com:org/repo.git')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('refuses null', () => {
      expect(isAllowedUrl(null)).toBe(false);
    });

    it('refuses undefined', () => {
      expect(isAllowedUrl(undefined)).toBe(false);
    });

    it('refuses empty string', () => {
      expect(isAllowedUrl('')).toBe(false);
    });

    it('trims whitespace before parsing', () => {
      expect(isAllowedUrl('  https://example.com  ')).toBe(true);
    });

    it('refuses javascript: with surrounding whitespace', () => {
      expect(isAllowedUrl('  javascript:alert(1)  ')).toBe(false);
    });
  });
});
