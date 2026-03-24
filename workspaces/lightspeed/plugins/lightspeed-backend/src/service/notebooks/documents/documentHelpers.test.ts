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

import { mockServices } from '@backstage/backend-test-utils';

import * as dns from 'dns/promises';

import { DEFAULT_MAX_FILE_SIZE_MB } from '../../constant';
import {
  isValidFileSize,
  isValidFileType,
  isValidURL,
  parseFileContent,
  stripHtmlTags,
  validateURLForSSRF,
} from './documentHelpers';

// Mock DNS module
jest.mock('dns/promises');

describe('documentHelpers', () => {
  const logger = mockServices.logger.mock();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidURL', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(isValidURL('http://example.com')).toBe(true);
      expect(isValidURL('http://example.com/path')).toBe(true);
      expect(isValidURL('http://example.com:8080')).toBe(true);
    });

    it('should return true for valid HTTPS URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('https://example.com/path/to/resource')).toBe(true);
      expect(isValidURL('https://subdomain.example.com')).toBe(true);
    });

    it('should return false for non-HTTP/HTTPS protocols', () => {
      expect(isValidURL('ftp://example.com')).toBe(false);
      expect(isValidURL('file:///etc/passwd')).toBe(false);
      // eslint-disable-next-line no-script-url
      expect(isValidURL('javascript:alert(1)')).toBe(false);
      expect(isValidURL('data:text/html,<script>alert(1)</script>')).toBe(
        false,
      );
    });

    it('should return false for invalid URLs', () => {
      expect(isValidURL('not a url')).toBe(false);
      expect(isValidURL('')).toBe(false);
      expect(isValidURL('example.com')).toBe(false);
      expect(isValidURL('//example.com')).toBe(false);
    });

    it('should return false for malformed URLs', () => {
      expect(isValidURL('http://')).toBe(false);
      expect(isValidURL('https://')).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    const MB = 1024 * 1024;

    it('should return true for files under the preset limit', () => {
      expect(isValidFileSize(0)).toBe(true);
      expect(isValidFileSize(1024)).toBe(true);
      expect(isValidFileSize(MB)).toBe(true);
      expect(isValidFileSize(10 * MB)).toBe(true);
      expect(isValidFileSize(19 * MB)).toBe(true);
    });

    it('should return true for files exactly the preset limit', () => {
      expect(isValidFileSize(DEFAULT_MAX_FILE_SIZE_MB * MB)).toBe(true);
    });

    it('should return false for files over the preset limit', () => {
      expect(isValidFileSize(DEFAULT_MAX_FILE_SIZE_MB * MB + 1)).toBe(false);
      expect(isValidFileSize(DEFAULT_MAX_FILE_SIZE_MB * MB * 1.5)).toBe(false);
    });
  });

  describe('isValidFileType', () => {
    it('should return true for supported file types', () => {
      expect(isValidFileType('md')).toBe(true);
      expect(isValidFileType('txt')).toBe(true);
      expect(isValidFileType('pdf')).toBe(true);
      expect(isValidFileType('json')).toBe(true);
      expect(isValidFileType('yaml')).toBe(true);
      expect(isValidFileType('yml')).toBe(true);
      expect(isValidFileType('log')).toBe(true);
      expect(isValidFileType('url')).toBe(true);
    });

    it('should handle file types with leading dots', () => {
      expect(isValidFileType('.md')).toBe(true);
      expect(isValidFileType('.txt')).toBe(true);
      expect(isValidFileType('.pdf')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isValidFileType('MD')).toBe(true);
      expect(isValidFileType('TXT')).toBe(true);
      expect(isValidFileType('PDF')).toBe(true);
      expect(isValidFileType('JSON')).toBe(true);
      expect(isValidFileType('YAML')).toBe(true);
    });

    it('should return false for unsupported file types', () => {
      expect(isValidFileType('exe')).toBe(false);
      expect(isValidFileType('zip')).toBe(false);
      expect(isValidFileType('doc')).toBe(false);
      expect(isValidFileType('docx')).toBe(false);
      expect(isValidFileType('xls')).toBe(false);
      expect(isValidFileType('mp4')).toBe(false);
      expect(isValidFileType('jpg')).toBe(false);
    });

    it('should return false for empty or invalid input', () => {
      expect(isValidFileType('')).toBe(false);
      expect(isValidFileType('.')).toBe(false);
    });
  });

  describe('parseFileContent', () => {
    it('should parse URL when fileType is "url"', async () => {
      // Mock DNS resolution to allow the URL
      const mockDnsResolve = dns.resolve as jest.MockedFunction<
        typeof dns.resolve
      >;
      mockDnsResolve.mockResolvedValue(['93.184.216.34'] as any);

      // Mock global fetch for URL parsing
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: jest.fn().mockResolvedValue('URL content'),
      } as any);

      const result = await parseFileContent(
        logger,
        'url',
        undefined,
        'https://example.com',
      );

      expect(result.content).toBe('URL content');
      expect(result.metadata.url).toBe('https://example.com');
    });

    it('should throw error when fileType is "url" but no URL provided', async () => {
      await expect(
        parseFileContent(logger, 'url', undefined, undefined),
      ).rejects.toThrow('URL is required when fileType is "url"');
    });

    it('should throw error when no file uploaded for non-URL type', async () => {
      await expect(
        parseFileContent(logger, 'txt', undefined, undefined),
      ).rejects.toThrow('No file uploaded');
    });

    it('should throw error when file size exceeds limit', async () => {
      const largeFile = {
        buffer: Buffer.from('test'),
        originalname: 'large.txt',
        size: 21 * 1024 * 1024, // 21MB
      } as Express.Multer.File;

      await expect(
        parseFileContent(logger, 'txt', largeFile, undefined),
      ).rejects.toThrow(
        `File size exceeds ${DEFAULT_MAX_FILE_SIZE_MB}MB limit`,
      );
    });

    it('should parse valid file successfully', async () => {
      const file = {
        buffer: Buffer.from('test content'),
        originalname: 'test.txt',
        size: 1024,
      } as Express.Multer.File;

      const result = await parseFileContent(logger, 'txt', file, undefined);

      expect(result.content).toBe('test content');
      expect(result.metadata.fileName).toBe('test.txt');
      expect(result.metadata.fileType).toBe('txt');
    });
  });

  describe('validateURLForSSRF - SECURITY CRITICAL', () => {
    const mockDnsResolve = dns.resolve as jest.MockedFunction<
      typeof dns.resolve
    >;

    beforeEach(() => {
      mockDnsResolve.mockReset();
      // Default implementation returns empty array (won't be called for direct IPs)
      mockDnsResolve.mockResolvedValue([] as any);
    });

    describe('IPv4 Address Validation', () => {
      it('should block localhost (127.0.0.1)', async () => {
        await expect(validateURLForSSRF('http://127.0.0.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should block localhost variations', async () => {
        await expect(validateURLForSSRF('http://127.0.0.2')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(validateURLForSSRF('http://127.1.1.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should block private IP ranges - 10.0.0.0/8', async () => {
        await expect(validateURLForSSRF('http://10.0.0.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(validateURLForSSRF('http://10.1.2.3')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(
          validateURLForSSRF('http://10.255.255.255'),
        ).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should block private IP ranges - 172.16.0.0/12', async () => {
        await expect(validateURLForSSRF('http://172.16.0.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(validateURLForSSRF('http://172.20.0.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(
          validateURLForSSRF('http://172.31.255.255'),
        ).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should allow 172.15.x.x and 172.32.x.x (outside private range)', async () => {
        mockDnsResolve.mockResolvedValue(['172.15.0.1'] as any);
        await expect(
          validateURLForSSRF('http://172.15.0.1'),
        ).resolves.toBeUndefined();

        mockDnsResolve.mockResolvedValue(['172.32.0.1'] as any);
        await expect(
          validateURLForSSRF('http://172.32.0.1'),
        ).resolves.toBeUndefined();
      });

      it('should block private IP ranges - 192.168.0.0/16', async () => {
        await expect(validateURLForSSRF('http://192.168.0.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(validateURLForSSRF('http://192.168.1.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(
          validateURLForSSRF('http://192.168.255.255'),
        ).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should block link-local addresses - 169.254.0.0/16', async () => {
        await expect(validateURLForSSRF('http://169.254.0.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        // AWS/GCP metadata endpoint
        await expect(
          validateURLForSSRF('http://169.254.169.254'),
        ).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should block current network - 0.0.0.0/8', async () => {
        await expect(validateURLForSSRF('http://0.0.0.0')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(validateURLForSSRF('http://0.1.2.3')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should block carrier-grade NAT - 100.64.0.0/10', async () => {
        await expect(validateURLForSSRF('http://100.64.0.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(validateURLForSSRF('http://100.100.0.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(
          validateURLForSSRF('http://100.127.255.255'),
        ).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should allow 100.63.x.x and 100.128.x.x (outside CGN range)', async () => {
        mockDnsResolve.mockResolvedValue(['100.63.0.1'] as any);
        await expect(
          validateURLForSSRF('http://100.63.0.1'),
        ).resolves.toBeUndefined();

        mockDnsResolve.mockResolvedValue(['100.128.0.1'] as any);
        await expect(
          validateURLForSSRF('http://100.128.0.1'),
        ).resolves.toBeUndefined();
      });

      it('should block multicast addresses - 224.0.0.0/4', async () => {
        await expect(validateURLForSSRF('http://224.0.0.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(validateURLForSSRF('http://230.0.0.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(
          validateURLForSSRF('http://239.255.255.255'),
        ).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should block reserved addresses - 240.0.0.0/4', async () => {
        await expect(validateURLForSSRF('http://240.0.0.1')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(
          validateURLForSSRF('http://255.255.255.255'),
        ).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should allow public IP addresses', async () => {
        mockDnsResolve.mockResolvedValue(['8.8.8.8'] as any);
        await expect(
          validateURLForSSRF('http://8.8.8.8'),
        ).resolves.toBeUndefined();

        mockDnsResolve.mockResolvedValue(['1.1.1.1'] as any);
        await expect(
          validateURLForSSRF('http://1.1.1.1'),
        ).resolves.toBeUndefined();
      });
    });

    describe('IPv6 Address Validation', () => {
      it('should block IPv6 loopback - ::1', async () => {
        // IPv6 addresses in URLs are treated as direct IPs, not hostnames
        await expect(validateURLForSSRF('http://[::1]')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(
          validateURLForSSRF('http://[0:0:0:0:0:0:0:1]'),
        ).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should block IPv6 unique local addresses - fc00::/7', async () => {
        // These are direct IPv6 addresses, not resolved from hostnames
        await expect(validateURLForSSRF('http://[fc00::1]')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(validateURLForSSRF('http://[fd00::1]')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should block IPv6 link-local addresses - fe80::/10', async () => {
        // These are direct IPv6 addresses, not resolved from hostnames
        await expect(validateURLForSSRF('http://[fe80::1]')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(validateURLForSSRF('http://[fe9f::1]')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(validateURLForSSRF('http://[feaf::1]')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(validateURLForSSRF('http://[febf::1]')).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should block IPv4-mapped IPv6 addresses to private ranges', async () => {
        // These are direct IPv6 addresses, not resolved from hostnames
        await expect(
          validateURLForSSRF('http://[::ffff:127.0.0.1]'),
        ).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(
          validateURLForSSRF('http://[::ffff:192.168.1.1]'),
        ).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
        await expect(
          validateURLForSSRF('http://[::ffff:10.0.0.1]'),
        ).rejects.toThrow(
          'Access to private/internal IP addresses is not allowed',
        );
      });

      it('should allow public IPv6 addresses', async () => {
        mockDnsResolve.mockResolvedValue(['2001:4860:4860::8888'] as any);
        await expect(
          validateURLForSSRF('http://[2001:4860:4860::8888]'),
        ).resolves.toBeUndefined();
      });
    });

    describe('Hostname Resolution', () => {
      it('should block "localhost" hostname', async () => {
        await expect(validateURLForSSRF('http://localhost')).rejects.toThrow(
          'Access to localhost is not allowed',
        );
      });

      it('should block cloud metadata endpoints', async () => {
        await expect(
          validateURLForSSRF('http://metadata.google.internal'),
        ).rejects.toThrow('Access to metadata.google.internal is not allowed');
      });

      it('should block Kubernetes internal service', async () => {
        await expect(
          validateURLForSSRF('http://kubernetes.default.svc'),
        ).rejects.toThrow('Access to kubernetes.default.svc is not allowed');
      });

      it('should block hostnames that resolve to private IPs', async () => {
        mockDnsResolve.mockResolvedValue(['192.168.1.1']);
        await expect(
          validateURLForSSRF('http://internal.example.com'),
        ).rejects.toThrow(
          'URL resolves to private/internal IP address (192.168.1.1), which is not allowed',
        );
      });

      it('should block if ANY resolved IP is private', async () => {
        mockDnsResolve.mockResolvedValue([
          '93.184.216.34',
          '192.168.1.1', // One private IP
        ]);
        await expect(validateURLForSSRF('http://example.com')).rejects.toThrow(
          'URL resolves to private/internal IP address (192.168.1.1), which is not allowed',
        );
      });

      it('should allow hostnames that resolve to public IPs only', async () => {
        mockDnsResolve.mockResolvedValue(['93.184.216.34', '93.184.216.35']);
        await expect(
          validateURLForSSRF('http://example.com'),
        ).resolves.toBeUndefined();
      });

      it('should handle DNS resolution failures', async () => {
        mockDnsResolve.mockRejectedValue(new Error('ENOTFOUND'));
        await expect(
          validateURLForSSRF('http://nonexistent.example.com'),
        ).rejects.toThrow('Failed to resolve hostname: ENOTFOUND');
      });

      it('should preserve original error if it contains "not allowed"', async () => {
        const customError = new Error(
          'Something is not allowed for security reasons',
        );
        mockDnsResolve.mockRejectedValue(customError);
        await expect(
          validateURLForSSRF('http://test.example.com'),
        ).rejects.toThrow('Something is not allowed for security reasons');
      });
    });
  });

  describe('stripHtmlTags', () => {
    it('should remove basic HTML tags', () => {
      const html = '<p>Hello <b>world</b></p>';
      expect(stripHtmlTags(html)).toBe('Hello world');
    });

    it('should preserve text content', () => {
      const html = '<div>This is <span>text</span> content</div>';
      expect(stripHtmlTags(html)).toBe('This is text content');
    });

    it('should ignore script tags', () => {
      const html = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
      expect(stripHtmlTags(html)).toBe('Hello\nWorld');
    });

    it('should ignore style tags', () => {
      const html =
        '<p>Hello</p><style>.test { color: red; }</style><p>World</p>';
      expect(stripHtmlTags(html)).toBe('Hello\nWorld');
    });

    it('should ignore noscript tags', () => {
      const html = '<p>Hello</p><noscript>No JS</noscript><p>World</p>';
      const result = stripHtmlTags(html);
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('should add newlines for block-level tags', () => {
      const html = '<div>Line 1</div><div>Line 2</div>';
      expect(stripHtmlTags(html)).toBe('Line 1\nLine 2');
    });

    it('should add newlines for paragraph tags', () => {
      const html = '<p>Paragraph 1</p><p>Paragraph 2</p>';
      expect(stripHtmlTags(html)).toBe('Paragraph 1\nParagraph 2');
    });

    it('should handle headings', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2><p>Content</p>';
      expect(stripHtmlTags(html)).toBe('Title\nSubtitle\nContent');
    });

    it('should handle br tags', () => {
      const html = 'Line 1<br>Line 2<br>Line 3';
      expect(stripHtmlTags(html)).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should decode HTML entities', () => {
      const html = '<p>&lt;div&gt; &amp; &quot;test&quot;</p>';
      expect(stripHtmlTags(html)).toBe('<div> & "test"');
    });

    it('should collapse multiple whitespace', () => {
      const html = '<p>Text    with     spaces</p>';
      expect(stripHtmlTags(html)).toBe('Text with spaces');
    });

    it('should collapse multiple newlines', () => {
      const html = '<p>Para 1</p>\n\n\n<p>Para 2</p>';
      expect(stripHtmlTags(html)).toBe('Para 1\n\nPara 2');
    });

    it('should trim leading/trailing whitespace', () => {
      const html = '   <p>Text</p>   ';
      expect(stripHtmlTags(html)).toBe('Text');
    });

    it('should handle empty HTML', () => {
      expect(stripHtmlTags('')).toBe('');
      expect(stripHtmlTags('<div></div>')).toBe('');
      expect(stripHtmlTags('<p>   </p>')).toBe('');
    });

    it('should handle nested tags', () => {
      const html =
        '<div><p><span><strong>Nested</strong> text</span></p></div>';
      expect(stripHtmlTags(html)).toBe('Nested text');
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<p>Unclosed tag<p>Another';
      expect(stripHtmlTags(html)).toBe('Unclosed tag\nAnother');
    });

    it('should handle self-closing tags', () => {
      const html = '<p>Line 1<br/>Line 2</p>';
      expect(stripHtmlTags(html)).toBe('Line 1\nLine 2');
    });

    it('should handle complex real-world HTML', () => {
      const html = `
        <html>
          <body>
            <header><h1>Main Title</h1></header>
            <main>
              <p>Paragraph 1</p>
              <p>Paragraph 2</p>
            </main>
            <footer>Footer</footer>
          </body>
        </html>
      `;
      const result = stripHtmlTags(html);
      expect(result).toContain('Main Title');
      expect(result).toContain('Paragraph 1');
      expect(result).toContain('Paragraph 2');
      expect(result).toContain('Footer');
    });
  });
});
