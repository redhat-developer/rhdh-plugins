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
import { LoggerService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';

import { Parser } from 'htmlparser2';

import dns from 'dns/promises';
import { isIP } from 'net';

import {
  DEFAULT_MAX_FILE_SIZE_MB,
  HTML_BLOCK_TAGS,
  HTML_IGNORED_TAGS,
  SupportedFileType,
} from '../../constant';
import { parseFile } from './fileParser';

/**
 * Validate URL format
 */
export const isValidURL = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Validate file size (max 20MB by default)
 */
export const isValidFileSize = (fileSize: number): boolean => {
  const maxSize = DEFAULT_MAX_FILE_SIZE_MB;
  return fileSize <= maxSize;
};

/**
 * Validate file type
 */
export const isValidFileType = (fileType: string): boolean => {
  const normalizedType = fileType.toLowerCase().replace(/^\./, '');
  return Object.values(SupportedFileType).includes(
    normalizedType as SupportedFileType,
  );
};

/**
 * Parse file from upload or URL
 * @param logger - Logger service
 * @param fileType - File type
 * @param file - File
 * @param urlParam - URL parameter
 * @returns Parsed file
 */
export const parseFileContent = async (
  logger: LoggerService,
  fileType: string,
  file?: Express.Multer.File,
  urlParam?: string,
) => {
  if (fileType === 'url') {
    if (!urlParam) {
      throw new InputError('URL is required when fileType is "url"');
    }
    logger.info(`Fetching URL ${urlParam} for fileType ${fileType}`);
    return await parseFile(Buffer.from(''), urlParam, fileType);
  }
  if (!file) {
    throw new InputError('No file uploaded');
  }
  if (!isValidFileSize(file.size)) {
    throw new InputError(
      `File size exceeds ${DEFAULT_MAX_FILE_SIZE_MB / 1024 / 1024}MB limit`,
    );
  }
  logger.info(`Parsing file ${file.originalname} for fileType ${fileType}`);
  return await parseFile(file.buffer, file.originalname, fileType);
};

/**
 * Check if an IP address is private, internal, or a metadata endpoint
 * Blocks SSRF attacks to internal networks
 */
const isPrivateOrInternalIP = (ip: string): boolean => {
  // Check if it's a valid IP
  const ipVersion = isIP(ip);
  if (ipVersion === 0) {
    return false; // Not a valid IP
  }

  if (ipVersion === 4) {
    const parts = ip.split('.').map(Number);

    switch (parts[0]) {
      case 0: // 0.0.0.0/8 - Current network
      case 10: // 10.0.0.0/8 - Private
      case 127: // 127.0.0.0/8 - Loopback
        return true;
      case 100: // 100.64.0.0/10 - Carrier-grade NAT
        return parts[1] >= 64 && parts[1] <= 127;
      case 169: // 169.254.0.0/16 - Link-local (includes cloud metadata endpoint 169.254.169.254)
        return parts[1] === 254;
      case 172: // 172.16.0.0/12 - Private
        return parts[1] >= 16 && parts[1] <= 31;
      case 192: // 192.168.0.0/16 - Private
        return parts[1] === 168;
      default:
        // 224.0.0.0/4 - Multicast, 240.0.0.0/4 - Reserved
        return parts[0] >= 224;
    }
  } else if (ipVersion === 6) {
    const lower = ip.toLowerCase();

    // ::1 - Loopback
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;

    // fc00::/7 - Unique local address
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

    // fe80::/10 - Link-local
    if (
      lower.startsWith('fe8') ||
      lower.startsWith('fe9') ||
      lower.startsWith('fea') ||
      lower.startsWith('feb')
    )
      return true;

    // ::ffff:0:0/96 - IPv4-mapped IPv6
    if (lower.startsWith('::ffff:')) {
      const ipv4Part = ip.substring(7);
      // Check if it's in dotted-decimal format (e.g., ::ffff:127.0.0.1)
      if (ipv4Part.includes('.')) {
        return isPrivateOrInternalIP(ipv4Part);
      }
      // Handle hex format (e.g., ::ffff:7f00:1 which is 127.0.0.1)
      // Extract the hex parts and check against private ranges
      const parts = ipv4Part.split(':');
      if (parts.length >= 1) {
        const firstHex = parseInt(parts[0], 16);
        // Check for common private ranges in hex:
        // 127.x.x.x -> 0x7F00-0x7FFF (loopback)
        // 10.x.x.x -> 0x0A00-0x0AFF (private)
        // 192.168.x.x -> 0xC0A8 (private)
        // 172.16-31.x.x -> 0xAC10-0xAC1F (private)
        // 169.254.x.x -> 0xA9FE (link-local)
        if (
          (firstHex >= 0x7f00 && firstHex <= 0x7fff) || // 127.x.x.x
          (firstHex >= 0x0a00 && firstHex <= 0x0aff) || // 10.x.x.x
          firstHex === 0xc0a8 || // 192.168.x.x
          (firstHex >= 0xac10 && firstHex <= 0xac1f) || // 172.16-31.x.x
          firstHex === 0xa9fe // 169.254.x.x
        ) {
          return true;
        }
      }
    }
  }

  return false;
};

/**
 * Validate URL and check for SSRF vulnerabilities
 * Resolves hostname to IP and blocks private/internal addresses
 */
export const validateURLForSSRF = async (urlString: string): Promise<void> => {
  const url = new URL(urlString);

  // Strip brackets from IPv6 addresses (e.g., [::1] -> ::1)
  const hostname = url.hostname.replace(/^\[|\]$/g, '');

  // Check if hostname is already an IP address
  const ipVersion = isIP(hostname);
  if (ipVersion !== 0) {
    if (isPrivateOrInternalIP(hostname)) {
      throw new InputError(
        'Access to private/internal IP addresses is not allowed',
      );
    }
    return;
  }

  // Block localhost and common internal hostnames
  const lowerHostname = hostname.toLowerCase();
  const blockedHostnames = [
    'localhost',
    'metadata.google.internal', // GCP metadata
    'kubernetes.default.svc', // K8s internal service
    'host.docker.internal', // Docker internal service
    '169.254.169.254', // AWS/GCP/Azure metadata endpoint
    '127.0.0.1', // Loopback address
    '0.0.0.0', // Current network address
    '::1', // Loopback address
    '::', // Current network address
  ];

  if (blockedHostnames.includes(lowerHostname)) {
    throw new InputError(`Access to ${lowerHostname} is not allowed`);
  }

  // Resolve hostname to IP addresses
  try {
    const addresses = await dns.resolve(hostname);

    // Check all resolved IPs
    for (const address of addresses) {
      if (isPrivateOrInternalIP(address)) {
        throw new InputError(
          `URL resolves to private/internal IP address (${address}), which is not allowed`,
        );
      }
    }
  } catch (error: any) {
    // If DNS resolution fails, throw the error
    if (error.message?.includes('not allowed')) {
      throw error;
    }
    throw new Error(`Failed to resolve hostname: ${error.message}`);
  }
};

/**
 * Sanitize title to create a valid document ID
 * Converts title to lowercase, replaces spaces/special chars with hyphens
 */
export const sanitizeTitle = (title: string): string => {
  return (
    title
      .trim()
      .toLocaleLowerCase('en-US')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+/g, '')
      .replace(/-$/g, '') || 'untitled'
  );
};

/**
 * Strip HTML tags and extract readable text from HTML content
 * @public
 */
export const stripHtmlTags = (html: string): string => {
  let text = '';
  let ignoring = false;

  const parser = new Parser(
    {
      onopentag(name) {
        if (HTML_IGNORED_TAGS.has(name)) ignoring = true;
      },
      onclosetag(name) {
        if (HTML_IGNORED_TAGS.has(name)) ignoring = false;
        if (HTML_BLOCK_TAGS.has(name)) text += '\n';
      },
      ontext(data) {
        if (!ignoring) text += data;
      },
    },
    { decodeEntities: true },
  );

  parser.write(html);
  parser.end();

  return text
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
};
