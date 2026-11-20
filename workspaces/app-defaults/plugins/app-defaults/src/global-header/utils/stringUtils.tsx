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

import Typography from '@mui/material/Typography';

/**
 * Highlights the substring that matches the query term.
 * @param text The full text to render.
 * @param query The query term to highlight.
 * @returns JSX.Element with highlighted matching substring.
 */
export const highlightMatch = (text: string, query: string) => {
  if (!query) return <>{text}</>;

  const escapeRegex = (input: string) =>
    input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedQuery = escapeRegex(query);

  const regex = new RegExp(`(${escapedQuery})`, 'i');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <Typography
            key={`${part}-${index}`}
            component="span"
            sx={{ fontWeight: 'normal' }}
          >
            {part}
          </Typography>
        ) : (
          <Typography
            key={`${part}-${index}`}
            component="span"
            sx={{ fontWeight: 'bold' }}
          >
            {part}
          </Typography>
        ),
      )}
    </>
  );
};

export const createSearchLink = (searchTerm: string) => {
  return `/search?query=${encodeURIComponent(searchTerm)}`;
};
