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

import type { NextFunction, Request, Response } from 'express';

import { ModelCapabilitiesCache } from './attachment-validation';
import { QueryRequestBody } from './types';

export const validateCompletionsRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const reqData: QueryRequestBody = req.body;

  if (typeof reqData.model !== 'string' || reqData.model.trim() === '') {
    return res
      .status(400)
      .json({ error: 'model is required and must be a non-empty string' });
  }

  if (typeof reqData.provider !== 'string' || reqData.provider.trim() === '') {
    return res
      .status(400)
      .json({ error: 'provider is required and must be a non-empty string' });
  }

  if (typeof reqData.query !== 'string' || reqData.query.trim() === '') {
    return res
      .status(400)
      .json({ error: 'query is required and must be a non-empty string' });
  }

  return next();
};

export const validateLoadHistoryRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const historyLength = Number(req.query.historyLength);

  if (historyLength && !Number.isInteger(historyLength)) {
    return res.status(400).send('historyLength has to be a valid integer');
  }

  // TODO: Need to extract out the user_id from conversation_id, and verify with the login user entity

  return next();
};

export const validateAttachmentsForModel = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { model, attachments } = req.body;

  if (!attachments || attachments.length === 0) {
    return next();
  }

  const hasImages = attachments.some(
    (att: { attachment_type: string }) => att.attachment_type === 'image',
  );

  if (!hasImages) {
    return next();
  }

  // Check if model has been validated
  if (!ModelCapabilitiesCache.has(model)) {
    return res.status(400).json({
      error:
        'Model vision capability not validated. Please call /v1/validate-model-vision first.',
      model,
    });
  }

  // Check if model supports vision
  const supportsVision = ModelCapabilitiesCache.get(model);
  if (!supportsVision) {
    return res.status(400).json({
      error:
        'This model does not support JPEG images. Please select a vision-capable model.',
      model,
    });
  }

  return next();
};
