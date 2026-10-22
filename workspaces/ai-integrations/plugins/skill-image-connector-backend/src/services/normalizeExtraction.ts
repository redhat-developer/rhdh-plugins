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

/**
 * Parses extracted OCI skill image content and normalizes it using the
 * shared D3 metadata normalizer from ai-skills-common.
 *
 * This module owns YAML and frontmatter parsing. It does not perform
 * any network or OCI operations — it accepts already-extracted,
 * verified string content and produces typed normalization results.
 *
 * @packageDocumentation
 */

import { parse as parseYaml, YAMLParseError } from 'yaml';
import { normalizeOciMetadata } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type {
  NormalizationDiagnostic,
  OciMarkdownFrontmatter,
  OciNativeInput,
  OciSkillCard,
  TrustedSourceInput,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { SkillImageExtraction, SkillImageNormalization } from './types';

/**
 * Parses a SkillCard YAML string into the OciSkillCard structure expected
 * by the shared normalizer.
 *
 * Returns the parsed document or undefined when the content is not a
 * valid YAML object.
 */
export function parseSkillCardYaml(raw: string): OciSkillCard | undefined {
  try {
    const doc = parseYaml(raw);
    if (
      doc === null ||
      doc === undefined ||
      typeof doc !== 'object' ||
      Array.isArray(doc)
    ) {
      return undefined;
    }
    return doc as OciSkillCard;
  } catch {
    return undefined;
  }
}

/**
 * Extracts and parses YAML frontmatter from an OCI skill Markdown
 * document (SKILL.md or SKILLS.md).
 *
 * Frontmatter is delimited by `---` at the start of the file.
 * Returns undefined when frontmatter is absent. Empty frontmatter is valid.
 * Throws for malformed, unclosed, scalar, or array frontmatter.
 */
export function parseMarkdownFrontmatter(
  raw: string,
): OciMarkdownFrontmatter | undefined {
  const lines = raw.trimStart().split(/\r?\n/);
  if (!/^---[ \t]*$/.test(lines[0])) return undefined;
  const closing = lines.findIndex(
    (line, index) => index > 0 && /^---[ \t]*$/.test(line),
  );
  if (closing === -1)
    throw new TypeError('Frontmatter has no closing delimiter');
  const content = lines.slice(1, closing).join('\n');
  if (!content.trim()) return {};
  const doc: unknown = parseYaml(content);
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new TypeError('Frontmatter must be a YAML object');
  }
  return doc as OciMarkdownFrontmatter;
}

/**
 * Normalizes an extracted skill image using the shared D3 normalizer.
 *
 * Parses the raw SkillCard YAML and Markdown frontmatter, maps them
 * into the shared input types, and invokes `normalizeOciMetadata()`
 * with the trusted acquisition metadata.
 *
 * @param extraction - The extracted skill image with raw content.
 * @returns A normalization result classifying the outcome.
 */
export function normalizeSkillImageExtraction(
  extraction: SkillImageExtraction,
): SkillImageNormalization {
  const acquisition = extraction.acquisition;
  if (!acquisition) {
    // Explicit digest references lack tagged identity — normalization
    // is not possible without trusted acquisition metadata.
    return {
      outcome: 'malformed',
      record: null,
      diagnostics: [
        {
          field: 'key',
          message:
            'key: no acquisition metadata available — explicit digest references do not produce tagged identity',
        },
      ],
    };
  }

  const diagnostics: NormalizationDiagnostic[] = [];

  // Parse the SkillCard YAML
  const skillCard = parseSkillCardYaml(extraction.skillImageYaml);
  if (skillCard === undefined) {
    diagnostics.push({
      field: 'skillCard',
      message:
        'skillCard: SkillCard YAML could not be parsed as a valid YAML document',
    });
    return { outcome: 'malformed', record: null, diagnostics };
  }

  // Parse the Markdown frontmatter (optional — absent frontmatter
  // is valid when the SkillCard provides sufficient metadata)
  let frontmatter: OciMarkdownFrontmatter | undefined;
  try {
    frontmatter = parseMarkdownFrontmatter(extraction.skillsMd);
  } catch (error) {
    let reason = 'invalid YAML object';
    if (error instanceof YAMLParseError) {
      const position = error.linePos?.[0];
      reason = `YAML ${error.code}${
        position ? ` at line ${position.line}, column ${position.col}` : ''
      }`;
    } else if (
      error instanceof TypeError &&
      [
        'Frontmatter has no closing delimiter',
        'Frontmatter must be a YAML object',
      ].includes(error.message)
    ) {
      reason = error.message;
    }
    return {
      outcome: 'malformed',
      record: null,
      diagnostics: [
        {
          field: 'frontmatter',
          message: `frontmatter: ${reason}`,
        },
      ],
    };
  }

  // Build the native input for the shared normalizer
  const native: OciNativeInput = {
    skillCard,
    ...(frontmatter !== undefined ? { frontmatter } : {}),
  };

  // Build trusted source identity from verified acquisition metadata
  const trusted: TrustedSourceInput = {
    key: acquisition.key,
    sourceUri: acquisition.sourceUri,
    digest: acquisition.digest,
  };

  // Invoke the shared normalizer
  const result = normalizeOciMetadata(native, trusted);

  if (result.record) {
    return {
      outcome: 'normalized',
      record: result.record,
      diagnostics: result.diagnostics,
    };
  }

  return {
    outcome: 'malformed',
    record: null,
    diagnostics: result.diagnostics,
  };
}
