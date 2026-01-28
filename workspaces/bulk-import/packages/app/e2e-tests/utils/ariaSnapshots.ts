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

import { BulkImportMessages, replaceTemplate } from './translations';

/**
 * Creates aria snapshot chunks for the Preview Pull Request Sidebar.
 * Each chunk represents a logical section of the sidebar for better readability and maintainability.
 *
 * @param t - Translation messages object
 * @returns Object containing aria snapshot strings for each section
 */
export function getPreviewSidebarSnapshots(t: BulkImportMessages) {
  const prDetails = replaceTemplate(t.previewFile.pullRequest.details, {
    tool: t.previewFile.pullRequest.title,
  });
  const prTitleLabel = replaceTemplate(t.previewFile.pullRequest.titleLabel, {
    tool: t.previewFile.pullRequest.title,
  });
  const prBodyLabel = replaceTemplate(t.previewFile.pullRequest.bodyLabel, {
    tool: t.previewFile.pullRequest.title,
  });
  const annotationsSeparator = replaceTemplate(
    t.previewFile.useSemicolonSeparator,
    { label: t.previewFile.pullRequest.annotations.toLowerCase() },
  );
  const labelsSeparator = replaceTemplate(t.previewFile.useSemicolonSeparator, {
    label: t.previewFile.pullRequest.labels.toLowerCase(),
  });
  const specSeparator = replaceTemplate(t.previewFile.useSemicolonSeparator, {
    label: t.previewFile.pullRequest.spec.toLowerCase(),
  });

  // Parse the useCodeOwnersFile translation: "Use *CODEOWNERS* file as Entity Owner"
  // The asterisks mark emphasis around CODEOWNERS
  const codeOwnersText = t.previewFile.pullRequest.useCodeOwnersFile;
  const codeOwnersCheckboxName = codeOwnersText.replace(/\*/g, '');
  const codeOwnersParts = codeOwnersText.split('*CODEOWNERS*');
  const codeOwnersBeforeText = codeOwnersParts[0].trim();
  const codeOwnersAfterText = codeOwnersParts[1].trim();

  return {
    /**
     * Pull request details section - contains title and body textboxes
     */
    pullRequestDetails: `
    - heading "${prDetails}" [level=6]
    - text: ${prTitleLabel}
    - textbox "${prTitleLabel}":
      - /placeholder: ${t.previewFile.pullRequest.titlePlaceholder}
      - text: Add catalog-info.yaml config file
    - text: ${prBodyLabel}
    - textbox "${prBodyLabel}":
      - /placeholder: ${t.previewFile.pullRequest.bodyPlaceholder}
      - text: /This pull request adds a \\*\\*Backstage entity metadata file\\*\\* to this repository so that the component can be added to the \\[software catalog\\]\\(http:\\/\\/localhost:\\d+\\/catalog\\)\\. After this pull request is merged, the component will become available\\. For more information, read an \\[overview of the Backstage software catalog\\]\\(https:\\/\\/backstage\\.io\\/docs\\/features\\/software-catalog\\/\\)\\. View the import job in your app \\[here\\]\\(http:\\/\\/localhost:\\d+\\/bulk-import\\?repository=https:\\/\\/github\\.com\\/test-org\\/backend-service&defaultBranch=main\\)\\./
  `,

    /**
     * Entity configuration heading and component name field
     */
    entityConfigHeader: `
    - heading "${t.previewFile.pullRequest.entityConfiguration}" [level=6]
    - text: ${t.previewFile.pullRequest.componentNameLabel}
    - textbox "${t.previewFile.pullRequest.componentNameLabel}":
      - /placeholder: ${t.previewFile.pullRequest.componentNamePlaceholder}
  `,

    /**
     * Entity owner selection field
     */
    entityOwner: `
    - text: ${t.previewFile.pullRequest.entityOwnerLabel}
    - combobox "${t.previewFile.pullRequest.entityOwnerLabel}": user:development/guest
    - button "Open"
    - paragraph: ${t.previewFile.pullRequest.entityOwnerHelper}
  `,

    /**
     * CODEOWNERS checkbox option
     */
    codeownersOption: `
    - checkbox "${codeOwnersCheckboxName}"
    - paragraph:
      - text: ${codeOwnersBeforeText}
      - emphasis: CODEOWNERS
      - text: ${codeOwnersAfterText}
    - paragraph: "${t.previewFile.pullRequest.codeOwnersWarning}"
  `,

    /**
     * Annotations field
     */
    annotations: `
    - text: ${t.previewFile.pullRequest.annotations}
    - textbox "${t.previewFile.pullRequest.annotations}":
      - /placeholder: "${t.previewFile.keyValuePlaceholder}"
      - text: "github.com/project-slug: test-org/backend-service"
    - paragraph: ${annotationsSeparator}
  `,

    /**
     * Labels field
     */
    labels: `
    - text: ${t.previewFile.pullRequest.labels}
    - textbox "${t.previewFile.pullRequest.labels}":
      - /placeholder: "${t.previewFile.keyValuePlaceholder}"
    - paragraph: ${labelsSeparator}
  `,

    /**
     * Spec field
     */
    spec: `
    - text: ${t.previewFile.pullRequest.spec}
    - textbox "${t.previewFile.pullRequest.spec}":
      - /placeholder: "${t.previewFile.keyValuePlaceholder}"
      - text: "type: other; lifecycle: unknown; owner: user:development/guest"
    - paragraph: ${specSeparator}
  `,

    /**
     * Preview pull request section - shows the PR preview with links
     */
    previewPullRequest: `
    - heading "${t.previewFile.preview} ${t.previewFile.pullRequest.title.toLowerCase()}" [level=6]
    - text: Add catalog-info.yaml config file Create a new Pull Request
    - paragraph:
      - text: This pull request adds a
      - strong: Backstage entity metadata file
      - text: to this repository so that the component can be added to the
      - link "software catalog":
        - /url: /http:\\/\\/localhost:300\\d\\/catalog/
      - text: . After this pull request is merged, the component will become available. For more information, read an
      - link "overview of the Backstage software catalog":
        - /url: https://backstage.io/docs/features/software-catalog/
      - text: . View the import job in your app
      - link "here":
        - /url: /http:\\/\\/localhost:300\\d\\/bulk-import\\?repository=https:\\/\\/github\\.com\\/test-org\\/backend-service&defaultBranch=main/
      - text: .
  `,

    /**
     * Preview entities section - shows the generated catalog-info.yaml content
     */
    previewEntities: `
    - heading "${t.previewFile.pullRequest.previewEntities}" [level=6]
    - code: https://github.com/test-org/backend-service/catalog-info.yaml
    - code: "apiVersion: backstage.io/v1alpha1 kind: Component metadata: name: backend-service annotations: github.com/project-slug: test-org/backend-service spec: type: other lifecycle: unknown owner: user:development/guest"
  `,
  };
}

/**
 * Type for the preview sidebar snapshots object
 */
export type PreviewSidebarSnapshotsType = ReturnType<
  typeof getPreviewSidebarSnapshots
>;

/**
 * Helper function to get all preview sidebar snapshots combined.
 * Use this when you need to validate the entire sidebar at once.
 *
 * @param t - Translation messages object
 * @returns Combined aria snapshot string for the entire sidebar
 */
export function getFullPreviewSidebarSnapshot(t: BulkImportMessages): string {
  const snapshots = getPreviewSidebarSnapshots(t);
  return `
    ${snapshots.pullRequestDetails}
    ${snapshots.entityConfigHeader}
    ${snapshots.entityOwner}
    ${snapshots.codeownersOption}
    ${snapshots.annotations}
    ${snapshots.labels}
    ${snapshots.spec}
    ${snapshots.previewPullRequest}
    ${snapshots.previewEntities}
  `;
}
