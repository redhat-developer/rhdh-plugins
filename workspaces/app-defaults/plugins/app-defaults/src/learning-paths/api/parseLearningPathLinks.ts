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

import { LearningPathLink } from '../types';

/**
 * Validates and normalizes learning path data from the proxy or static fallback.
 *
 * @internal
 */
export function parseLearningPathLinks(data: unknown): LearningPathLink[] {
  if (!Array.isArray(data)) {
    throw new TypeError('expected learning paths response to be an array');
  }

  return data.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new TypeError(`learning path at index ${index} must be an object`);
    }

    const record = item as Record<string, unknown>;
    const { label, url, description, hours, minutes, paths } = record;

    if (typeof label !== 'string' || label.length === 0) {
      throw new TypeError(
        `learning path at index ${index} is missing a valid label`,
      );
    }
    if (typeof url !== 'string' || url.length === 0) {
      throw new TypeError(
        `learning path at index ${index} is missing a valid url`,
      );
    }
    if (typeof paths !== 'number') {
      throw new TypeError(
        `learning path at index ${index} is missing a valid paths count`,
      );
    }

    const link: LearningPathLink = { label, url, paths };

    if (description !== undefined) {
      if (typeof description !== 'string') {
        throw new TypeError(
          `learning path at index ${index} has an invalid description`,
        );
      }
      link.description = description;
    }
    if (hours !== undefined) {
      if (typeof hours !== 'number') {
        throw new TypeError(
          `learning path at index ${index} has invalid hours`,
        );
      }
      link.hours = hours;
    }
    if (minutes !== undefined) {
      if (typeof minutes !== 'number') {
        throw new TypeError(
          `learning path at index ${index} has invalid minutes`,
        );
      }
      link.minutes = minutes;
    }

    return link;
  });
}
