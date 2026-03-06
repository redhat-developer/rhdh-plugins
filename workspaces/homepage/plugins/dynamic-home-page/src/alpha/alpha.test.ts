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
  homePageDevModule,
  homepageTranslationsModule,
  homepageTranslationRef,
  homepageTranslations,
} from './index';
import { homePageLayoutExtension } from './extensions/homePageLayoutExtension';
import {
  onboardingSectionWidget,
  entitySectionWidget,
  templateSectionWidget,
  quickAccessCardWidget,
  searchBarWidget,
  featuredDocsCardWidget,
  catalogStarredWidget,
  disableToolkit,
  RecentlyVisitedWidget,
  TopVisitedWidget,
} from './extensions/homePageCards';
import { quickAccessApi } from './extensions/apis';

describe('Dynamic Home Page plugin Alpha (NFS)', () => {
  describe('Modules', () => {
    it('should export homePageDevModule with correct structure', () => {
      expect(homePageDevModule).toBeDefined();
      expect(homePageDevModule.$$type).toBe('@backstage/FrontendModule');
      expect(homePageDevModule.pluginId).toBe('home');
    });

    it('should export homepageTranslationsModule with correct structure', () => {
      expect(homepageTranslationsModule).toBeDefined();
      expect(homepageTranslationsModule.$$type).toBe(
        '@backstage/FrontendModule',
      );
      expect(homepageTranslationsModule.pluginId).toBe('app');
    });
  });

  describe('Translations', () => {
    it('should export homepageTranslationRef', () => {
      expect(homepageTranslationRef).toBeDefined();
      expect(homepageTranslationRef.id).toBe('plugin.homepage');
    });

    it('should export homepageTranslations', () => {
      expect(homepageTranslations).toBeDefined();
      expect(typeof homepageTranslations).toBe('object');
    });
  });

  describe('Layout Extension', () => {
    it('should export homePageLayoutExtension', () => {
      expect(homePageLayoutExtension).toBeDefined();
    });
  });

  describe('Widget Extensions', () => {
    it('should export all widget extensions', () => {
      expect(onboardingSectionWidget).toBeDefined();
      expect(entitySectionWidget).toBeDefined();
      expect(templateSectionWidget).toBeDefined();
      expect(quickAccessCardWidget).toBeDefined();
      expect(searchBarWidget).toBeDefined();
      expect(featuredDocsCardWidget).toBeDefined();
      expect(catalogStarredWidget).toBeDefined();
      expect(disableToolkit).toBeDefined();
      expect(RecentlyVisitedWidget).toBeDefined();
      expect(TopVisitedWidget).toBeDefined();
    });
  });

  describe('APIs', () => {
    it('should export quickAccessApi', () => {
      expect(quickAccessApi).toBeDefined();
    });
  });
});
