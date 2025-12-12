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
import { createBackendModule } from '@backstage/backend-plugin-api';
import { scorecardMetricsExtensionPoint } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { BinaryArtifactsMetricProvider } from './metricProviders/BinaryArtifactsMetricProvider';
import { BranchProtectionMetricProvider } from './metricProviders/BranchProtectionMetricProvider';
import { CITestsMetricProvider } from './metricProviders/CITestsMetricProvider';
import { CIIBestPracticesMetricProvider } from './metricProviders/CIIBestPracticesMetricProvider';
import { CodeReviewMetricProvider } from './metricProviders/CodeReviewMetricProvider';
import { ContributorsMetricProvider } from './metricProviders/ContributorsMetricProvider';
import { DangerousWorkflowMetricProvider } from './metricProviders/DangerousWorkflowMetricProvider';
import { DependencyUpdateToolMetricProvider } from './metricProviders/DependencyUpdateToolMetricProvider';
import { FuzzingMetricProvider } from './metricProviders/FuzzingMetricProvider';
import { LicenseMetricProvider } from './metricProviders/LicenseMetricProvider';
import { MaintainedMetricProvider } from './metricProviders/MaintainedMetricProvider';
import { PackagingMetricProvider } from './metricProviders/PackagingMetricProvider';
import { PinnedDependenciesMetricProvider } from './metricProviders/PinnedDependenciesMetricProvider';
import { SASTMetricProvider } from './metricProviders/SASTMetricProvider';
import { SecurityPolicyMetricProvider } from './metricProviders/SecurityPolicyMetricProvider';
import { SignedReleasesMetricProvider } from './metricProviders/SignedReleasesMetricProvider';
import { TokenPermissionsMetricProvider } from './metricProviders/TokenPermissionsMetricProvider';
import { VulnerabilitiesMetricProvider } from './metricProviders/VulnerabilitiesMetricProvider';

export const scorecardModuleOpenSSF = createBackendModule({
  pluginId: 'scorecard',
  moduleId: 'openssf',
  register(reg) {
    reg.registerInit({
      deps: {
        metrics: scorecardMetricsExtensionPoint,
      },
      async init({ metrics }) {
        // Register all OpenSSF metric providers
        metrics.addMetricProvider(new BinaryArtifactsMetricProvider());
        metrics.addMetricProvider(new BranchProtectionMetricProvider());
        metrics.addMetricProvider(new CITestsMetricProvider());
        metrics.addMetricProvider(new CIIBestPracticesMetricProvider());
        metrics.addMetricProvider(new CodeReviewMetricProvider());
        metrics.addMetricProvider(new ContributorsMetricProvider());
        metrics.addMetricProvider(new DangerousWorkflowMetricProvider());
        metrics.addMetricProvider(new DependencyUpdateToolMetricProvider());
        metrics.addMetricProvider(new FuzzingMetricProvider());
        metrics.addMetricProvider(new LicenseMetricProvider());
        metrics.addMetricProvider(new MaintainedMetricProvider());
        metrics.addMetricProvider(new PackagingMetricProvider());
        metrics.addMetricProvider(new PinnedDependenciesMetricProvider());
        metrics.addMetricProvider(new SASTMetricProvider());
        metrics.addMetricProvider(new SecurityPolicyMetricProvider());
        metrics.addMetricProvider(new SignedReleasesMetricProvider());
        metrics.addMetricProvider(new TokenPermissionsMetricProvider());
        metrics.addMetricProvider(new VulnerabilitiesMetricProvider());
      },
    });
  },
});
