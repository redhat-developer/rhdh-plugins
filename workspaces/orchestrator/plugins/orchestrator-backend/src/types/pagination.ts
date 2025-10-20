/*
 * Copyright 2024 The Backstage Authors
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
import { Request } from 'express-serve-static-core';

import { PaginationInfoDTO } from '@redhat/backstage-plugin-orchestrator-common';

export interface Pagination {
  offset?: number;
  limit?: number;
  order?: string;
  sortField?: string;
}

export function buildPagination(req: Request): Pagination {
  const pagination: Pagination = {
    limit: undefined,
    offset: undefined,
    order: undefined,
    sortField: undefined,
  };

  if (!req.body?.paginationInfo) {
    return pagination;
  }
  const { offset, pageSize, orderBy, orderDirection } = req.body
    .paginationInfo as PaginationInfoDTO;

  if (!isNaN(Number(offset))) {
    pagination.offset = Number(offset);
  }

  if (!isNaN(Number(pageSize))) {
    pagination.limit = Number(pageSize);
  }

  if (orderBy) {
    pagination.sortField = String(orderBy);
  }

  if (orderDirection) {
    pagination.order = String(orderDirection).toUpperCase();
  }
  return pagination;
}

export function buildPaginationTmp(
  paginationInfo?: PaginationInfoDTO,
): Pagination {
  const pagination: Pagination = {
    limit: undefined,
    offset: undefined,
    order: undefined,
    sortField: undefined,
  };

  if (!paginationInfo) {
    return pagination;
  }
  const { offset, pageSize, orderBy, orderDirection } = paginationInfo;

  if (!isNaN(Number(offset))) {
    pagination.offset = Number(offset);
  }

  if (!isNaN(Number(pageSize))) {
    pagination.limit = Number(pageSize);
  }

  if (orderBy) {
    pagination.sortField = String(orderBy);
  }

  if (orderDirection) {
    pagination.order = String(orderDirection).toUpperCase();
  }
  return pagination;
}
