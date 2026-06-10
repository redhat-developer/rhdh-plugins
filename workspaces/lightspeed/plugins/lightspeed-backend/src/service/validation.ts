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

import {
  ALLOWED_PROXY_PREFIXES,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_QUERY_LENGTH,
  MAX_TOTAL_ATTACHMENTS_SIZE_BYTES,
} from './constant';
import { QueryRequestBody } from './types';

export function isAllowedProxyPath(path: string): boolean {
  return ALLOWED_PROXY_PREFIXES.some(
    prefix => path === prefix || path.startsWith(`${prefix}/`),
  );
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

  // Validate query length (RHIDP-13062)
  if (reqData.query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({
      error: `query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`,
    });
  }

  // Validate attachments if present (RHIDP-13062)
  if (reqData.attachments && Array.isArray(reqData.attachments)) {
    let totalSize = 0;

    for (let i = 0; i < reqData.attachments.length; i++) {
      const attachment = reqData.attachments[i];

      // Calculate attachment size (content is base64 or plain text)
      const attachmentSize = attachment.content
        ? Buffer.byteLength(attachment.content, 'utf8')
        : 0;

      if (attachmentSize > MAX_ATTACHMENT_SIZE_BYTES) {
        return res.status(400).json({
          error: `Attachment "${attachment.name}" exceeds maximum size of ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)}MB`,
        });
      }

      totalSize += attachmentSize;
    }

    if (totalSize > MAX_TOTAL_ATTACHMENTS_SIZE_BYTES) {
      return res.status(400).json({
        error: `Total attachments size exceeds maximum of ${MAX_TOTAL_ATTACHMENTS_SIZE_BYTES / (1024 * 1024)}MB`,
      });
    }
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
