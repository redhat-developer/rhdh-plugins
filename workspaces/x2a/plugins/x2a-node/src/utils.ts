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

import crypto from 'node:crypto';
import type {
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';
import { RELATION_MEMBER_OF } from '@backstage/catalog-model';
import type { CatalogService } from '@backstage/plugin-catalog-node';
import type { Job } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import type { ReconcileJobDeps } from './services';

/** @public */
export const SYSTEM_USER_REF = 'user:default/system';

/**
 * Type guard: narrows generic BackstageCredentials to a user principal.
 * @public
 */
export function isUserCredentials(
  credentials: BackstageCredentials,
): credentials is BackstageCredentials<BackstageUserPrincipal> {
  return (
    typeof (credentials?.principal as { userEntityRef?: unknown })
      ?.userEntityRef === 'string'
  );
}

/**
 * Safely extracts user reference from credentials with fallback.
 * Returns the real userEntityRef for user principals and
 * {@link SYSTEM_USER_REF} for service/other principals.
 * @public
 */
export function getUserRef(credentials: BackstageCredentials): string {
  if (isUserCredentials(credentials)) {
    return credentials.principal.userEntityRef;
  }
  return SYSTEM_USER_REF;
}

/**
 * Returns the list of Backstage group entity refs the user is a member of.
 * Fetches the user entity from the catalog and extracts targetRef from
 * relations of type RELATION_MEMBER_OF.
 * Returns an empty array if the user is not in the catalog or has no group memberships.
 * @public
 */
export async function getGroupsOfUser(
  userEntityRef: string,
  options: {
    catalog: CatalogService;
    credentials: BackstageCredentials;
  },
): Promise<string[]> {
  try {
    const userEntity = await options.catalog.getEntityByRef(userEntityRef, {
      credentials: options.credentials,
    });

    if (!userEntity?.relations) {
      return [];
    }

    const memberOfRelations =
      userEntity.relations.filter(
        relation => relation.type === RELATION_MEMBER_OF,
      ) ?? [];

    return memberOfRelations.map(relation => relation.targetRef);
  } catch {
    return [];
  }
}

/**
 * Reconciles the job status between the database and the Kubernetes cluster.
 * @public
 */
export async function reconcileJobStatus(
  job: Job,
  deps: ReconcileJobDeps,
): Promise<Job> {
  if (!['pending', 'running'].includes(job.status)) {
    return job;
  }
  if (!job.k8sJobName) {
    return job;
  }

  deps.logger.info(
    `Reconciling job ${job.id} (k8s: ${job.k8sJobName}), DB status: '${job.status}'`,
  );
  const k8sStatus = await deps.kubeService.getJobStatus(job.k8sJobName);

  if (k8sStatus.status === 'success' || k8sStatus.status === 'error') {
    let log: string | null = null;
    try {
      log = (await deps.kubeService.getJobLogs(job.k8sJobName)) as string;
    } catch {
      deps.logger.warn(
        `Could not fetch logs for job ${job.id} (k8s job: ${job.k8sJobName})`,
      );
    }
    const updated = await deps.x2aDatabase.updateJob({
      id: job.id,
      status: k8sStatus.status,
      finishedAt: new Date(),
      log,
    });
    deps.logger.info(
      `Reconciled job ${job.id}: DB had '${job.status}', K8s reports '${k8sStatus.status}'`,
    );
    return updated ?? job;
  }

  return job;
}

/**
 * Generate a 256-bit hex callback token to match HMAC-SHA256 strength.
 * @public
 */
export function generateCallbackToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
