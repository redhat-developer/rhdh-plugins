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
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_QUERY_LENGTH,
  MAX_TOTAL_ATTACHMENTS_SIZE_BYTES,
} from './constant';
import { Attachments, QueryRequestBody } from './types';

const JPEG_MAGIC = [0xff, 0xd8, 0xff];

function extractBase64(content: string): string {
  const commaIndex = content.indexOf(',');
  if (commaIndex !== -1 && content.startsWith('data:')) {
    return content.slice(commaIndex + 1);
  }
  return content;
}

function hasValidJpegMagicBytes(content: string): boolean {
  const bytes = Buffer.from(extractBase64(content), 'base64');
  return (
    bytes.length >= JPEG_MAGIC.length &&
    JPEG_MAGIC.every((b, i) => bytes[i] === b)
  );
}

function isValidJson(content: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

function validateAttachments(attachments: Array<Attachments>): string | null {
  let totalSize = 0;

  for (const attachment of attachments) {
    const attachmentSize = attachment.content
      ? Buffer.byteLength(attachment.content, 'utf8')
      : 0;

    if (attachmentSize > MAX_ATTACHMENT_SIZE_BYTES) {
      return `Attachment with type "${attachment.attachment_type}" exceeds maximum size of ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)}MB`;
    }

    totalSize += attachmentSize;

    if (
      attachment.attachment_type === 'image' &&
      attachment.content &&
      !hasValidJpegMagicBytes(attachment.content)
    ) {
      return 'Image attachment does not contain a valid JPEG file';
    }

    if (
      attachment.content_type === 'application/json' &&
      attachment.content &&
      !isValidJson(attachment.content)
    ) {
      return 'Attachment with content_type "application/json" contains invalid JSON';
    }
  }

  if (totalSize > MAX_TOTAL_ATTACHMENTS_SIZE_BYTES) {
    return `Total attachments size exceeds maximum of ${MAX_TOTAL_ATTACHMENTS_SIZE_BYTES / (1024 * 1024)}MB`;
  }

  return null;
}

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

  if (reqData.query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({
      error: `query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`,
    });
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
  const { model, provider, attachments } = req.body;

  if (!attachments || attachments.length === 0) {
    return next();
  }

  const attachmentError = validateAttachments(attachments);
  if (attachmentError) {
    return res.status(400).json({ error: attachmentError });
  }

  const hasImages = attachments.some(
    (att: { attachment_type: string }) => att.attachment_type === 'image',
  );

  if (!hasImages) {
    return next();
  }

  const cacheKey = `${provider}/${model}`;

  // Check if model has been validated
  if (!ModelCapabilitiesCache.has(cacheKey)) {
    return res.status(400).json({
      error:
        'Model vision capability not validated. Please call /v1/validate-model-vision first.',
      model,
    });
  }

  // Check if model supports vision
  const supportsVision = ModelCapabilitiesCache.get(cacheKey);
  if (!supportsVision) {
    return res.status(400).json({
      error:
        'This model does not support JPEG images. Please select a vision-capable model.',
      model,
    });
  }

  return next();
};
