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
import he from 'he';

export const extractImageFromHTML = (html: string): string | undefined => {
  if (!html) return undefined; // Explicitly return undefined
  const match = html.match(/<img[^>]+src=(?:"([^">]+)"|'([^'>]+)')/i);
  return match?.[1] || match?.[2];
};

export const sanitizeXML = (xml: string): string => {
  return xml.replace(
    /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#[xX][0-9a-fA-F]+;)/g,
    '&amp;',
  );
};

export const formatDescription = (text: string) => {
  // Decode HTML entities first
  const decoded = he.decode(text || '');
  // Remove HTML tags and replace &nbsp; with spaces
  const cleanText = decoded
    .replace(/<[^>]*>?/g, '')
    .replace(/\u00A0|&nbsp;/g, ' ');
  if (cleanText.length > 200) {
    return `${cleanText.substring(0, 200)}...`;
  }
  return cleanText;
};
