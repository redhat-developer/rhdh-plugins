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

/**
 * State for multi-source pagination
 * Tracks both K8s API and Kubearchive tokens separately
 */
export interface SourcePaginationState {
  k8sToken?: string; // continue token from Kubernetes API
  kubearchiveToken?: string; // continue token from Kubearchive
}

export interface PaginationState {
  [sourceKey: string]: SourcePaginationState;
}

/**
 * pagination token with user identity for security
 */
export interface PaginationToken {
  userId: string;
  state: PaginationState;
}

/**
 * Encode pagination state into a base64 continuation token with user identity
 */
export const encodeContinuationToken = (
  state: PaginationState,
  userId: string,
): string => {
  const token: PaginationToken = {
    userId,
    state,
  };
  const json = JSON.stringify(token);
  return Buffer.from(json).toString('base64');
};

/**
 * Decode continuation token back to pagination state and validate user identity
 */
export const decodeContinuationToken = (
  token: string,
  expectedUserId: string,
): PaginationState => {
  try {
    const json = Buffer.from(token, 'base64').toString('utf8');
    const decoded: PaginationToken = JSON.parse(json);

    // validate that the token belongs to the current user
    if (decoded.userId !== expectedUserId) {
      throw new Error('Continuation token does not belong to the current user');
    }

    return decoded.state;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Invalid continuation token');
  }
};
