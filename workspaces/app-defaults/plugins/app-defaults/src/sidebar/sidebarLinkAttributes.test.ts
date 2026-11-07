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
  isExternalSidebarUrl,
  parseSidebarHtmlLinkTarget,
  resolveSidebarLinkAttributes,
} from './sidebarLinkAttributes';

describe('sidebarLinkAttributes', () => {
  describe('parseSidebarHtmlLinkTarget', () => {
    it('accepts _blank and _self', () => {
      expect(parseSidebarHtmlLinkTarget('_blank')).toBe('_blank');
      expect(parseSidebarHtmlLinkTarget('_self')).toBe('_self');
    });

    it('ignores invalid values', () => {
      expect(parseSidebarHtmlLinkTarget('_top')).toBeUndefined();
      expect(parseSidebarHtmlLinkTarget('')).toBeUndefined();
      expect(parseSidebarHtmlLinkTarget(undefined)).toBeUndefined();
    });
  });

  describe('isExternalSidebarUrl', () => {
    it('detects http(s) URLs', () => {
      expect(isExternalSidebarUrl('https://docs.example.com')).toBe(true);
      expect(isExternalSidebarUrl('http://help.example.com')).toBe(true);
      expect(isExternalSidebarUrl('/catalog')).toBe(false);
    });
  });

  describe('resolveSidebarLinkAttributes', () => {
    it('returns empty when target is omitted', () => {
      expect(
        resolveSidebarLinkAttributes('https://example.com', undefined),
      ).toEqual({});
    });

    it('sets rel and icon for external _blank', () => {
      expect(
        resolveSidebarLinkAttributes('https://example.com', '_blank'),
      ).toEqual({
        target: '_blank',
        rel: 'noopener noreferrer',
        externalLinkIcon: true,
      });
    });

    it('sets rel but no icon for internal _blank', () => {
      expect(resolveSidebarLinkAttributes('/catalog', '_blank')).toEqual({
        target: '_blank',
        rel: 'noopener noreferrer',
        externalLinkIcon: false,
      });
    });

    it('passes _self without rel', () => {
      expect(
        resolveSidebarLinkAttributes('https://example.com', '_self'),
      ).toEqual({
        target: '_self',
      });
    });
  });
});
