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
  extractImageFromHTML,
  formatDescription,
  sanitizeXML,
} from './rss-utils';

describe('rss-utils', () => {
  describe('extractImageFromHTML', () => {
    it('should extract the image URL from HTML with a double-quoted src', () => {
      const html =
        '<p>Some text <img src="http://example.com/image.jpg" alt="Test Image"> more text</p>';
      expect(extractImageFromHTML(html)).toBe('http://example.com/image.jpg');
    });

    it('should extract the image URL from HTML with a single-quoted src', () => {
      const html =
        "<p>Some text <img src='http://example.com/image.png' alt='Test Image'> more text</p>";
      expect(extractImageFromHTML(html)).toBe('http://example.com/image.png');
    });

    it('should extract the first image URL if multiple images exist', () => {
      const html = '<img src="first.gif"><img src="second.jpeg">';
      expect(extractImageFromHTML(html)).toBe('first.gif');
    });

    it('should handle img tags with various attributes', () => {
      const html =
        '<img style="width:100px;" src="http://example.com/image.svg" alt="Test" class="my-image">';
      expect(extractImageFromHTML(html)).toBe('http://example.com/image.svg');
    });

    it('should return undefined if no img tag is present', () => {
      const html = '<p>Just some text, no image here.</p>';
      expect(extractImageFromHTML(html)).toBeUndefined();
    });

    it('should return undefined if img tag has no src attribute', () => {
      const html = '<img alt="No source">';
      expect(extractImageFromHTML(html)).toBeUndefined();
    });

    it('should return undefined if src attribute is empty', () => {
      const html = '<img src="" alt="Empty source">';
      // The regex requires at least one character in the src attribute value
      expect(extractImageFromHTML(html)).toBeUndefined();
    });

    it('should return undefined for empty HTML string', () => {
      const html = '';
      expect(extractImageFromHTML(html)).toBeUndefined();
    });

    it('should be case-insensitive for tag and attribute names', () => {
      const html = '<IMG SRC="http://example.com/case.bmp" ALT="Case Test">';
      expect(extractImageFromHTML(html)).toBe('http://example.com/case.bmp');
    });

    it('should handle self-closing img tags', () => {
      const html = '<img src="http://example.com/selfclosing.tiff" />';
      expect(extractImageFromHTML(html)).toBe(
        'http://example.com/selfclosing.tiff',
      );
    });
  });

  describe('sanitizeXML', () => {
    it('should replace standalone ampersands with &amp;', () => {
      const xml = '<root><item>Fish & Chips</item></root>';
      expect(sanitizeXML(xml)).toBe(
        '<root><item>Fish &amp; Chips</item></root>',
      );
    });

    it('should not replace valid XML entities like &amp;', () => {
      const xml = '<root><item>Already &amp; escaped</item></root>';
      expect(sanitizeXML(xml)).toBe(
        '<root><item>Already &amp; escaped</item></root>',
      );
    });

    it('should not replace valid XML entities like &lt;', () => {
      const xml = '<root><item>Less than &lt; sign</item></root>';
      expect(sanitizeXML(xml)).toBe(
        '<root><item>Less than &lt; sign</item></root>',
      );
    });

    it('should not replace valid XML entities like &gt;', () => {
      const xml = '<root><item>Greater than &gt; sign</item></root>';
      expect(sanitizeXML(xml)).toBe(
        '<root><item>Greater than &gt; sign</item></root>',
      );
    });

    it('should not replace valid XML entities like &quot;', () => {
      const xml = '<root><item>Quote &quot; mark</item></root>';
      expect(sanitizeXML(xml)).toBe(
        '<root><item>Quote &quot; mark</item></root>',
      );
    });

    it('should not replace valid XML entities like &apos;', () => {
      const xml = '<root><item>Apostrophe &apos; s</item></root>';
      expect(sanitizeXML(xml)).toBe(
        '<root><item>Apostrophe &apos; s</item></root>',
      );
    });

    it('should not replace numeric character references (decimal)', () => {
      const xml = '<root><item>Copyright &#169;</item></root>';
      expect(sanitizeXML(xml)).toBe(
        '<root><item>Copyright &#169;</item></root>',
      );
    });

    it('should not replace numeric character references (hexadecimal)', () => {
      const xml = '<root><item>Copyright &#xA9;</item></root>';
      expect(sanitizeXML(xml)).toBe(
        '<root><item>Copyright &#xA9;</item></root>',
      );
    });

    it('should not replace numeric character references (hexadecimal uppercase)', () => {
      const xml = '<root><item>Copyright &#XA9;</item></root>';
      expect(sanitizeXML(xml)).toBe(
        '<root><item>Copyright &#XA9;</item></root>',
      );
    });

    it('should handle multiple standalone ampersands', () => {
      const xml = '<root><item>Me & You & Them</item></root>';
      expect(sanitizeXML(xml)).toBe(
        '<root><item>Me &amp; You &amp; Them</item></root>',
      );
    });

    it('should handle a mix of standalone ampersands and valid entities', () => {
      const xml = '<root><item>Me &amp; You & Them &lt; Here</item></root>';
      expect(sanitizeXML(xml)).toBe(
        '<root><item>Me &amp; You &amp; Them &lt; Here</item></root>',
      );
    });

    it('should return the same string if no ampersands are present', () => {
      const xml = '<root><item>Just plain text</item></root>';
      expect(sanitizeXML(xml)).toBe(
        '<root><item>Just plain text</item></root>',
      );
    });

    it('should return an empty string if input is empty', () => {
      const xml = '';
      expect(sanitizeXML(xml)).toBe('');
    });

    it('should handle ampersands at the beginning and end of the string', () => {
      const xml = '& Start & End &';
      expect(sanitizeXML(xml)).toBe('&amp; Start &amp; End &amp;');
    });

    it('should handle ampersands adjacent to tags', () => {
      const xml = '<tag>&</tag>&<another>';
      expect(sanitizeXML(xml)).toBe('<tag>&amp;</tag>&amp;<another>');
    });
  });

  describe('formatDescription', () => {
    it('should remove HTML tags from the text and decode entities', () => {
      const text = '<p>This is <b>bold</b> text.</p>';
      expect(formatDescription(text)).toBe('This is bold text.');
    });

    it('should replace &nbsp; and \u00A0 with spaces', () => {
      const text = 'Text&nbsp;with\u00A0non-breaking&nbsp;spaces.';
      expect(formatDescription(text)).toBe('Text with non-breaking spaces.');
    });

    it('should remove tags, decode entities, and replace &nbsp;', () => {
      const text = '<div>Mixed&nbsp;content with <a href="#">link</a></div>';
      expect(formatDescription(text)).toBe('Mixed content with link');
    });

    it('should return the text as is if it is shorter than 200 characters after cleaning', () => {
      const text = 'Short description.';
      expect(formatDescription(text)).toBe('Short description.');
    });

    it('should truncate text longer than 200 characters and append "..."', () => {
      const longText = 'a'.repeat(210);
      const expectedText = `${'a'.repeat(200)}...`;
      expect(formatDescription(longText)).toBe(expectedText);
    });

    it('should truncate text with HTML longer than 200 characters after cleaning', () => {
      const longTextWithHTML = `<p>${'b'.repeat(210)}</p>`;
      const expectedText = `${'b'.repeat(200)}...`;
      expect(formatDescription(longTextWithHTML)).toBe(expectedText);
    });

    it('should return the text as is if it is exactly 200 characters long after cleaning', () => {
      const text = 'c'.repeat(200);
      expect(formatDescription(text)).toBe(text);
    });

    it('should return an empty string if the input is empty', () => {
      const text = '';
      expect(formatDescription(text)).toBe('');
    });

    it('should return an empty string if the input contains only HTML tags', () => {
      const text = '<em><i><b></b></i></em>';
      expect(formatDescription(text)).toBe('');
    });
  });
});
