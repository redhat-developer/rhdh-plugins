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

import RedHatDisplay from './assets/fonts/RedHatDisplay/RedHatDisplayVF.woff2';
import RedHatDisplayItalic from './assets/fonts/RedHatDisplay/RedHatDisplayVF-Italic.woff2';
import RedHatText from './assets/fonts/RedHatText/RedHatTextVF.woff2';
import RedHatTextItalic from './assets/fonts/RedHatText/RedHatTextVF-Italic.woff2';
import RedHatMono from './assets/fonts/RedHatMono/RedHatMonoVF.woff2';
import RedHatMonoItalic from './assets/fonts/RedHatMono/RedHatMonoVF-Italic.woff2';

const RedHatDisplayFontFace = {
  fontFamily: 'RedHatDisplay',
  src: `url(${RedHatDisplay}) format('woff2-variations')`,
  fontWeight: '300 900',
  fontStyle: 'normal',
  fontDisplay: 'fallback',
};

const RedHatDisplayItalicFontFace = {
  fontFamily: 'RedHatDisplay',
  src: `url(${RedHatDisplayItalic}) format('woff2-variations')`,
  fontWeight: '300 900',
  fontStyle: 'italic',
  fontDisplay: 'fallback',
};

export const RedHatTextFontFace = {
  fontFamily: 'RedHatText',
  src: `url(${RedHatText}) format('woff2-variations')`,
  fontWeight: '300 700',
  fontStyle: 'normal',
  fontDisplay: 'fallback',
};

const RedHatTextItalicFontFace = {
  fontFamily: 'RedHatText',
  src: `url(${RedHatTextItalic}) format('woff2-variations')`,
  fontWeight: '300 700',
  fontStyle: 'italic',
  fontDisplay: 'fallback',
};

const RedHatMonoFontFace = {
  fontFamily: 'RedHatMono',
  src: `url(${RedHatMono}) format('woff2-variations')`,
  fontWeight: '300 700',
  fontStyle: 'normal',
  fontDisplay: 'fallback',
};

const RedHatMonoItalicFontFace = {
  fontFamily: 'RedHatMono',
  src: `url(${RedHatMonoItalic}) format('woff2-variations')`,
  fontWeight: '300 700',
  fontStyle: 'italic',
  fontDisplay: 'fallback',
};

export const redHatFontFaces = [
  RedHatDisplayFontFace,
  RedHatDisplayItalicFontFace,
  RedHatTextFontFace,
  RedHatTextItalicFontFace,
  RedHatMonoFontFace,
  RedHatMonoItalicFontFace,
];

export const redHatFonts = {
  text: [
    'RedHatText',
    '"Helvetica Neue"',
    '-apple-system',
    '"Segoe UI"',
    'Roboto',
    'Helvetica',
    'Arial',
    'sans-serif',
  ].join(', '),
  heading: [
    'RedHatDisplay',
    '"Helvetica Neue"',
    '-apple-system',
    '"Segoe UI"',
    'Roboto',
    'Helvetica',
    'Arial',
    'sans-serif',
  ].join(', '),
  monospace: [
    'RedHatMono',
    '"Liberation Mono"',
    'consolas',
    '"SFMono-Regular"',
    'menlo',
    'monaco',
    '"Courier New"',
    'monospace',
  ].join(', '),
};
