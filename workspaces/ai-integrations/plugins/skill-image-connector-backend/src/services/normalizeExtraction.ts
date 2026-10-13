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

import { parse as parseYaml } from 'yaml';
import {
  normalizeOciMetadata,
  type NormalizationDiagnostic,
  type OciMarkdownFrontmatter,
  type OciNativeInput,
  type OciSkillCard,
  type TrustedSourceInput,
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
 * Returns the parsed frontmatter or undefined when none is present
 * or the YAML is malformed.
 */
export function parseMarkdownFrontmatter(
  raw: string,
): OciMarkdownFrontmatter | undefined {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith('---')) {
    return undefined;
  }

  // Find the closing delimiter. The opening `---` may be followed by
  // a newline or by content on the same line; we skip the first 3
  // characters (the opening dashes) and search for the next occurrence.
  const afterOpening = trimmed.indexOf('\n');
  if (afterOpening === -1) {
    return undefined;
  }

  const closingIdx = trimmed.indexOf('\n---', afterOpening);
  if (closingIdx === -1) {
    return undefined;
  }

  const frontmatterStr = trimmed.substring(afterOpening + 1, closingIdx);
  try {
    const doc = parseYaml(frontmatterStr);
    if (doc === null || doc === undefined || typeof doc !== 'object') {
      return undefined;
    }
    return doc as OciMarkdownFrontmatter;
  } catch {
    return undefined;
  }
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
  const frontmatter = parseMarkdownFrontmatter(extraction.skillsMd);

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

/**
 * Constructs a normalization result for an ambiguous candidate.
 */
export function ambiguousNormalization(
  reason: string,
): SkillImageNormalization {
  return {
    outcome: 'ambiguous',
    record: null,
    diagnostics: [{ field: 'extraction', message: reason }],
  };
}

/**
 * Constructs a normalization result for a confirmed non-skill image.
 */
export function nonSkillNormalization(reason: string): SkillImageNormalization {
  return {
    outcome: 'non-skill',
    record: null,
    diagnostics: [{ field: 'extraction', message: reason }],
  };
}
