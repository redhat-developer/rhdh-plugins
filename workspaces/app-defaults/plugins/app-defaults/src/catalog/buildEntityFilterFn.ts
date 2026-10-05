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

import type { Entity } from '@backstage/catalog-model';
import { hasLabels, isKind, isOrphan } from '@backstage/plugin-catalog';

const seenParseErrorExpressionStrings = new Set<string>();
const seenDuplicateExpressionStrings = new Set<string>();

type EntityMatcher = (entity: Entity) => boolean;

/**
 * Combines NFS entity-card `filterFunction` and deprecated `filterExpression`
 * inputs the same way the stock catalog Overview tab does.
 */
export function buildEntityFilterFn(
  filterFunction?: (entity: Entity) => boolean,
  filterExpression?: string,
): (entity: Entity) => boolean {
  if (
    filterFunction &&
    filterExpression &&
    !seenDuplicateExpressionStrings.has(filterExpression)
  ) {
    // eslint-disable-next-line no-console -- matches stock catalog entity filter warnings
    console.warn(
      `Duplicate entity filter methods found, both '${filterExpression}' as well as a callback function, which is not permitted - using the callback`,
    );
    seenDuplicateExpressionStrings.add(filterExpression);
  }
  const filter = filterFunction || filterExpression;
  if (!filter) {
    return () => true;
  }
  if (typeof filter === 'function') {
    return subject => filter(subject);
  }
  const result = parseFilterExpression(filter);
  if (
    result.expressionParseErrors.length &&
    !seenParseErrorExpressionStrings.has(filter)
  ) {
    // eslint-disable-next-line no-console -- matches stock catalog entity filter warnings
    console.warn(
      `Error(s) in entity filter expression '${filter}'`,
      result.expressionParseErrors,
    );
    seenParseErrorExpressionStrings.add(filter);
  }
  return result.filterFn;
}

function parseFilterExpression(expression: string): {
  filterFn: EntityMatcher;
  expressionParseErrors: Error[];
} {
  const expressionParseErrors: Error[] = [];
  const matchers = splitFilterExpression(expression, error =>
    expressionParseErrors.push(error),
  ).flatMap(part => {
    const matcher = matcherForPart(part, error =>
      expressionParseErrors.push(error),
    );
    if (!matcher) {
      return [];
    }
    return [part.negation ? (entity: Entity) => !matcher(entity) : matcher];
  });
  const filterFn = (entity: Entity) =>
    matchers.every(matcher => {
      try {
        return matcher(entity);
      } catch {
        return false;
      }
    });
  return { filterFn, expressionParseErrors };
}

function splitFilterExpression(
  expression: string,
  onParseError: (error: Error) => void,
) {
  const parts: Array<{
    key: string;
    parameters: string[];
    negation: boolean;
  }> = [];
  for (const word of expression
    .split(' ')
    .map(w => w.trim())
    .filter(Boolean)) {
    const match = word.match(/^(not:)?([^:]+):(.+)$/);
    if (!match) {
      onParseError(
        new Error(
          `'${word}' is not a valid filter expression, expected 'key:parameter' form`,
        ),
      );
      continue;
    }
    parts.push({
      key: match[2],
      parameters: match[3].split(',').filter(Boolean),
      negation: Boolean(match[1]),
    });
  }
  return parts;
}

function matcherForPart(
  part: { key: string; parameters: string[] },
  onParseError: (error: Error) => void,
): EntityMatcher | undefined {
  switch (part.key) {
    case 'kind':
      return isKind(part.parameters);
    case 'type':
      return entity => {
        const value = entity.spec?.type;
        const types = part.parameters.map(p => p.toLocaleLowerCase('en-US'));
        return (
          typeof value === 'string' &&
          types.includes(value.toLocaleLowerCase('en-US'))
        );
      };
    case 'is': {
      const matchers = part.parameters.flatMap(parameter => {
        if (parameter.toLocaleLowerCase('en-US') === 'orphan') {
          return [isOrphan];
        }
        onParseError(
          new Error(
            `'${parameter}' is not a valid parameter for 'is' filter expressions, expected one of 'orphan'`,
          ),
        );
        return [];
      });
      return entity => (matchers.length ? matchers.some(m => m(entity)) : true);
    }
    case 'has': {
      const matchers = part.parameters.flatMap(parameter => {
        const key = parameter.toLocaleLowerCase('en-US');
        if (key === 'labels') {
          return [hasLabels];
        }
        if (key === 'links') {
          return [(entity: Entity) => (entity.metadata.links ?? []).length > 0];
        }
        onParseError(
          new Error(
            `'${parameter}' is not a valid parameter for 'has' filter expressions, expected one of 'labels', 'links'`,
          ),
        );
        return [];
      });
      return entity => (matchers.length ? matchers.some(m => m(entity)) : true);
    }
    default:
      onParseError(
        new Error(
          `'${part.key}' is not a valid filter expression key, expected one of 'kind', 'type', 'is', 'has'`,
        ),
      );
      return undefined;
  }
}
