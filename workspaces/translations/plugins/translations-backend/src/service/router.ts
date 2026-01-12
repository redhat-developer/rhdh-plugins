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
import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import express, { Router } from 'express';

import { TranslationService } from './TranslationService';

/**
 *  @public
 *
 */
export interface RouterOptions {
  logger: LoggerService;
  config: Config;
}
/**
 *  @public
 *
 */
export async function createRouter({
  logger,
  config,
}: RouterOptions): Promise<Router> {
  const translationService = new TranslationService(config, logger);

  const router = Router();
  router.use(express.json());

  router.get('/', async (_, res) => {
    try {
      const result = await translationService.getTranslations();
      res.json(result.translations);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (
        errorMessage.includes('All configured translation files were not found')
      ) {
        res
          .status(404)
          .json({ error: 'All configured translation files were not found' });
      } else if (
        errorMessage.includes(
          'No valid translation files found in the provided files',
        )
      ) {
        res.status(404).json({
          error: 'No valid translation files found in the provided files',
        });
      } else {
        logger.error(`Failed to process translation files: ${error}`);
        res.status(500).json({ error: 'Failed to process translation files' });
      }
    }
  });

  return router;
}
