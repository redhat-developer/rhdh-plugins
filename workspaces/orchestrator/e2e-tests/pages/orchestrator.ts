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

import { Page, expect } from '@playwright/test';
import { OrchestratorHelper } from '../utils/helper';
import type { OrchestratorMessages } from '../utils/translations';

export type CreateGithubBranchWorkflowInputs = {
  owner: string;
  repo: string;
  baseBranch: string;
  targetBranch: string;
};

export type UiPropsWorkflowInputs = {
  name: string;
  email: string;
  simpleText: string;
  objectExample: string;
};

type SampleRetryHits = {
  allProps: number;
  statusCodesNoMatch: number;
  noRetry: number;
};

export class Orchestrator {
  private page: Page;
  private orchestratorHelper: OrchestratorHelper;
  private translations: OrchestratorMessages;
  private locale: string;
  private sampleRetryHits: SampleRetryHits = {
    allProps: 0,
    statusCodesNoMatch: 0,
    noRetry: 0,
  };

  constructor(page: Page, translations: OrchestratorMessages, locale = 'en') {
    this.page = page;
    this.translations = translations;
    this.locale = locale.split('-')[0];
    this.orchestratorHelper = new OrchestratorHelper(page, translations);
  }

  async navigateToOrchestrator() {
    await this.page.goto('/orchestrator');
    await this.page
      .getByRole('heading', { name: this.translations.page.title })
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 });
  }

  async navigateToWorkflowRunTab(navText: string) {
    const navLink = this.page.getByRole('tab', { name: navText }).first();
    await navLink.waitFor({ state: 'visible', timeout: 8_000 });
    await navLink.click();
    await expect(navLink).toHaveAttribute('aria-selected', 'true');
  }

  async navigateToCatalog() {
    await this.page.goto('/catalog');
    await this.page
      .getByRole('heading', { name: 'Red Hat Catalog' })
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 });
  }

  async searchWorkflow(workflowName: string) {
    await this.orchestratorHelper.searchInputPlaceholder(workflowName);
    await expect(
      this.page.getByRole('row', { name: workflowName }),
    ).toBeVisible();
  }

  async openWorkflowFromTable(workflowName: string) {
    await this.page
      .getByRole('row', { name: workflowName })
      .getByRole('link', { name: workflowName })
      .click();
    await this.orchestratorHelper.verifyHeading(workflowName);
  }

  async clickRunWorkflowFromDetails() {
    await this.orchestratorHelper.clickButton(
      this.translations.workflow.buttons.run,
    );
    await expect(
      this.page.getByText(this.translations.run.title),
    ).toBeVisible();
  }

  async submitWorkflowRunForm() {
    const nextButton = this.page.getByRole('button', {
      name: this.translations.common.next,
    });
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
    await this.orchestratorHelper.clickButton(this.translations.common.run);
  }

  async fillUiPropsWorkflowInputs(inputs: UiPropsWorkflowInputs) {
    await this.page.getByRole('textbox', { name: 'Name' }).fill(inputs.name);
    await this.page.getByRole('textbox', { name: 'Email' }).fill(inputs.email);
    await this.orchestratorHelper.clickButton(this.translations.common.next);
    await this.page
      .getByRole('textbox', { name: 'Simple Text Field' })
      .fill(inputs.simpleText);
    await this.page
      .getByRole('textbox', { name: 'Object Type Example' })
      .fill(inputs.objectExample);
    await this.orchestratorHelper.clickButton(this.translations.common.next);
  }

  async submitWorkflowRunFromReview() {
    await expect(
      this.page.getByText(this.translations.run.title).first(),
    ).toBeVisible();
    await this.orchestratorHelper.clickButton(this.translations.common.run);
  }

  async verifyUiPropsWorkflowInstanceDetails(workflowName: string) {
    const displayWorkflowName =
      workflowName.charAt(0).toUpperCase() +
      workflowName.slice(1).toLocaleLowerCase('en-US');

    await expect(
      this.page.getByText(
        `${this.translations.workflow.fields.runStatus} ${this.translations.table.status.completed}`,
      ),
    ).toBeVisible({ timeout: 60_000 });

    // TODO: Remove the ja branch when bug https://redhat.atlassian.net/browse/RHDHBUGS-3406 is fixed
    const resultsText =
      this.locale === 'ja'
        ? `${this.translations.run.results}${this.translations.table.actions.run}`
        : `${this.translations.run.results}${this.translations.run.status.completed}`;

    const instanceDetailTexts = [
      resultsText,
      `${this.translations.workflow.fields.workflow}${displayWorkflowName}`,
      `${this.translations.workflow.fields.workflowStatus} ${this.translations.workflow.status.available}`,
    ];
    for (const text of instanceDetailTexts) {
      await expect(this.page.getByText(text)).toBeVisible();
    }

    const instanceDetailHeadings = [
      this.translations.workflow.fields.workflowId,
      this.translations.workflow.fields.duration,
      this.translations.workflow.fields.started,
      this.translations.workflow.fields.description,
    ];
    for (const heading of instanceDetailHeadings) {
      await expect(
        this.page.getByRole('heading', { name: heading }),
      ).toBeVisible();
    }
  }

  private formatRunVariablesStringField(
    fieldName: string,
    value: string,
  ): string {
    const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${fieldName}": "${escapedValue}"`;
  }

  async verifyUiPropsWorkflowRunVariables(inputs: UiPropsWorkflowInputs) {
    await this.orchestratorHelper.clickLink(
      this.translations.run.viewVariables,
    );
    await expect(
      this.page.getByText(`{ "name": "${inputs.name}"`),
    ).toBeVisible();
    await expect(
      this.page.getByText(`"email": "${inputs.email}"`),
    ).toBeVisible();
    await expect(
      this.page.getByText(`{ "simpleText": "${inputs.simpleText}"`),
    ).toBeVisible();
    await expect(
      this.page.getByText(
        this.formatRunVariablesStringField(
          'objectExample',
          inputs.objectExample,
        ),
      ),
    ).toBeVisible();
    await this.orchestratorHelper.closeBar(this.translations.common.close);
  }

  async fillGreetingWorkflowForm(language = 'English', name = 'John') {
    await this.page.getByLabel('Language', { exact: true }).click();
    await this.page.getByRole('option', { name: language }).click();
    const nameField = this.page.getByLabel('Name', { exact: true });
    if (await nameField.isVisible()) {
      await nameField.fill(name);
    }
    const nextButton = this.page.getByRole('button', {
      name: this.translations.common.next,
    });
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
  }

  async runGreetingWorkflowFromExecuteForm() {
    await this.orchestratorHelper.clickButton(this.translations.common.run);
    await expect(
      this.page.getByText(this.translations.table.status.completed, {
        exact: true,
      }),
    ).toBeVisible({ timeout: 120_000 });
  }

  async runGreetingWorkflow(workflowName: string, language = 'English') {
    await this.searchWorkflow(workflowName);
    await this.openWorkflowFromTable(workflowName);
    await this.clickRunWorkflowFromDetails();
    await this.fillGreetingWorkflowForm(language);
    await this.runGreetingWorkflowFromExecuteForm();
  }

  async reRunGreetingWorkflow(language = 'English') {
    await expect(
      this.page.getByText(this.translations.workflow.buttons.runAgain),
    ).toBeVisible();
    // Uncomment the below lines and remove the line 254 with bug fix https://redhat.atlassian.net/browse/RHDHBUGS-3400
    // await this.orchestratorHelper.clickButton(
    //   this.translations.workflow.buttons.runAgain,
    // );
    await this.page
      .locator('div')
      .filter({ hasText: this.translations.workflow.buttons.runAgain })
      .last()
      .getByRole('button')
      .click();
    await this.fillGreetingWorkflowForm(language);
    await this.runGreetingWorkflowFromExecuteForm();
  }

  async validateGreetingWorkflowTableRow(workflowName: string) {
    const workflowRow = this.page.getByRole('row', { name: workflowName });

    await expect(workflowRow).toContainText(
      this.translations.workflow.status.available,
    );
    await expect(
      workflowRow.locator('div').filter({ hasText: /^100%$/ }),
    ).toBeVisible();
    await expect(
      workflowRow
        .getByRole('button', {
          name: this.translations.table.actions.run,
          exact: true,
        })
        .first(),
    ).toBeVisible();
    await expect(
      workflowRow
        .getByRole('button', { name: this.translations.table.actions.viewRuns })
        .first(),
    ).toBeVisible();
  }

  async validateWorkflowDetails(workflowName: string) {
    await this.orchestratorHelper.verifyHeading(workflowName);
    await this.verifyDetailsCard();
    await this.verifySuccessRatioCard();
    await expect(
      this.page.getByText(this.translations.workflow.definition, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByText(this.translations.workflow.inputSchema, {
        exact: true,
      }),
    ).toBeVisible();
    await this.page
      .getByRole('button', {
        name: this.translations.workflow.inputSchemaDescription,
      })
      .click();
    await expect(
      this.page.getByRole('tooltip', {
        name: this.translations.workflow.inputSchemaDescription,
      }),
    ).toBeVisible();
  }

  async verifyDetailsCard() {
    await expect(
      this.page.getByText(this.translations.workflow.details, { exact: true }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', {
        name: this.translations.workflow.fields.workflowStatus,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', {
        name: this.translations.workflow.fields.version,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', {
        name: this.translations.workflow.fields.description,
      }),
    ).toBeVisible();
  }

  async verifySuccessRatioCard() {
    await expect(
      this.page.getByText(this.translations.workflow.successRatio, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByText(this.translations.workflow.statsSuccess, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByText(this.translations.workflow.statsFailed, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByText(this.translations.workflow.runSuccess, {
        exact: true,
      }),
    ).toBeVisible();
    await this.page
      .getByRole('button', {
        name: this.translations.workflow.successRatioDescription,
      })
      .hover();
    await this.page
      .getByRole('button', {
        name: this.translations.workflow.successRatioDescription,
      })
      .click();
    await expect(
      this.page.getByRole('tooltip', {
        name: this.translations.workflow.successRatioDescription,
      }),
    ).toBeVisible();
  }

  async verifyWorkflowRunDetails() {
    await expect(
      this.page.getByText(this.translations.workflow.details, { exact: true }),
    ).toBeVisible();
    await expect(
      this.page.getByText(this.translations.run.results, { exact: true }),
    ).toBeVisible();
    await expect(
      this.page.getByText(this.translations.workflow.progress, { exact: true }),
    ).toBeVisible();
    await expect(
      this.page
        .locator('div')
        .filter({ hasText: this.translations.table.status.completed })
        .first(),
    ).toBeVisible();
  }

  async verifyWorkflowDetails() {
    await expect(
      this.page.getByText(this.translations.workflow.details, { exact: true }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', {
        name: this.translations.workflow.fields.workflowStatus,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', {
        name: this.translations.workflow.fields.description,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', {
        name: this.translations.workflow.fields.version,
      }),
    ).toBeVisible();
    await expect(
      this.page.getByText(this.translations.workflow.status.available),
    ).toBeVisible();
    await expect(
      this.page.getByText(this.translations.workflow.definition, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(this.page.locator('pre').first()).toBeVisible();
    await expect(
      this.page.getByRole('button', { name: 'Copy text' }),
    ).toBeVisible();
  }

  async verifyWorkflowRunTab(runsCount?: number) {
    const escapedRunsCount = this.translations.table.title.allWorkflowRuns
      .split('{{count}}')
      .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('\\d+');
    await expect(
      this.page.getByText(
        runsCount
          ? this.translations.table.title.allWorkflowRuns.replace(
              '{{count}}',
              runsCount.toString(),
            )
          : new RegExp(`^${escapedRunsCount}$`),
      ),
    ).toBeVisible({ timeout: 5000 });
    await this.orchestratorHelper.verifyTableHeadingAndRows([
      'ID',
      this.translations.table.headers.runStatus,
      this.translations.table.headers.started,
      this.translations.table.headers.duration,
    ]);
    await expect(
      this.page
        .getByRole('button', {
          name: this.translations.table.actions.run,
          exact: true,
        })
        .first(),
    ).toBeVisible();
    await expect(
      this.page
        .getByLabel(this.translations.table.filters.status)
        .getByRole('button', { name: 'All' }),
    ).toBeVisible();
    await expect(
      this.page
        .getByLabel(this.translations.table.filters.started)
        .getByRole('button', { name: 'All' }),
    ).toBeVisible();
  }

  async runUiPropsWorkflow(
    workflowName: string,
    inputs: UiPropsWorkflowInputs,
  ) {
    await this.searchWorkflow(workflowName);
    await this.openWorkflowFromTable(workflowName);
    await this.clickRunWorkflowFromDetails();
    await this.fillUiPropsWorkflowInputs(inputs);
    await this.submitWorkflowRunFromReview();
  }

  async verifyWorkflowRunTabDetails() {
    await this.orchestratorHelper.verifyTableHeadingAndRows([
      'ID',
      this.translations.table.headers.workflowName,
      this.translations.table.headers.version,
      this.translations.table.headers.entity,
      this.translations.table.headers.status,
      this.translations.table.headers.started,
      this.translations.table.headers.runBy,
      'Actions',
    ]);
    const statuses = [
      this.translations.table.status.running,
      this.translations.table.status.failed,
      this.translations.table.status.completed,
      this.translations.table.status.aborted,
      this.translations.table.status.pending,
    ];
    await this.page
      .getByLabel(this.translations.table.filters.status)
      .getByRole('button', { name: 'All' })
      .click();
    for (const status of statuses) {
      await expect(this.page.getByRole('option', { name: status })).toHaveText(
        status,
      );
      await this.page.getByRole('option', { name: status }).click();
      await this.page.getByRole('button', { name: status }).click();
    }
    await this.page.getByRole('option', { name: 'All', exact: true }).click();
    const startTimings = [
      this.translations.table.filters.startedOptions.today,
      this.translations.table.filters.startedOptions.yesterday,
      this.translations.table.filters.startedOptions.last7days,
      this.translations.table.filters.startedOptions.thisMonth,
    ];
    await this.page
      .getByLabel(this.translations.table.filters.started)
      .getByRole('button', { name: 'All' })
      .click();
    for (const startTime of startTimings) {
      await expect(
        this.page.getByRole('option', { name: startTime }),
      ).toHaveText(startTime);
      await this.page.getByRole('option', { name: startTime }).click();
      await this.page.getByRole('button', { name: startTime }).click();
    }
    await this.page.getByRole('option', { name: 'All' }).click();
    const entityOptions = [];
    await this.page
      .getByLabel(this.translations.table.filters.entity)
      .getByRole('button', { name: 'All' })
      .click();
    await expect(
      this.page.getByRole('option', { name: 'my-component' }),
    ).toHaveText('my-component');
    await this.page.getByRole('option', { name: 'my-component' }).click();
    await this.page.getByRole('button', { name: 'my-component' }).click();
    await this.page.getByRole('option', { name: 'All' }).click();
    await this.page
      .getByLabel(this.translations.table.filters.runBy)
      .getByRole('button', { name: 'All' })
      .click();
    await expect(
      this.page.getByRole('option', { name: 'Guest User' }),
    ).toHaveText('Guest User');
    await this.page.getByRole('option', { name: 'Guest User' }).click();
    await this.page.getByRole('button', { name: 'Guest User' }).click();
    await this.page.getByRole('option', { name: 'All' }).click();
  }

  private retryTestJsonOk(value: string) {
    return {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value }),
    };
  }

  async setupSampleRetryTestRoutes() {
    this.sampleRetryHits = {
      allProps: 0,
      statusCodesNoMatch: 0,
      noRetry: 0,
    };

    await this.page.route('**/api/retry-test/**', async route => {
      const url = route.request().url();

      if (url.includes('all-props')) {
        this.sampleRetryHits.allProps += 1;
        if (this.sampleRetryHits.allProps <= 3) {
          await route.fulfill({ status: 404, body: 'unavailable' });
        } else {
          await route.fulfill(this.retryTestJsonOk('ok'));
        }
        return;
      }

      if (url.includes('status-codes-no-404')) {
        this.sampleRetryHits.statusCodesNoMatch += 1;
        await route.fulfill({ status: 404, body: 'not found' });
        return;
      }

      if (url.includes('no-retry-props')) {
        this.sampleRetryHits.noRetry += 1;
        await route.fulfill({ status: 503, body: 'no retry' });
        return;
      }

      await route.continue();
    });
  }

  async cleanupSampleRetryTestRoutes() {
    await this.page.unroute('**/api/retry-test/**');
  }

  async runSampleRetryTest(workflowName: string) {
    await this.setupSampleRetryTestRoutes();
    await this.searchWorkflow(workflowName);
    await this.openWorkflowFromTable(workflowName);
    await this.clickRunWorkflowFromDetails();
  }

  async verifySampleRetryTest() {
    await expect(
      this.page.getByRole('textbox', { name: 'Retry Test (all props)' }),
    ).toHaveValue('ok', { timeout: 150_000 });
    await expect(
      this.page.getByTestId('root_retryStatusCodesNoMatch-error-text'),
    ).toBeVisible({ timeout: 60_000 });
    await expect(
      this.page.getByTestId('root_retryNoProps-error-text'),
    ).toBeVisible({ timeout: 60_000 });

    expect(this.sampleRetryHits.allProps).toBe(4);
    expect(this.sampleRetryHits.statusCodesNoMatch).toBe(1);
    expect(this.sampleRetryHits.noRetry).toBe(1);

    await this.cleanupSampleRetryTestRoutes();
  }
}
