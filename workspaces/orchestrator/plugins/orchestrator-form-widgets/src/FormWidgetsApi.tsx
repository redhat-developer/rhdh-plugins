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

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import {
  FormDecoratorProps,
  OrchestratorFormApi,
  OrchestratorFormContextProps,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-api';

function LazyDecoratorContent({
  FormComponent,
  contentPromise,
  ...props
}: {
  FormComponent: ComponentType<FormDecoratorProps>;
  contentPromise: Promise<typeof import('./FormDecoratorContent')>;
} & OrchestratorFormContextProps) {
  const [Content, setContent] = useState<ComponentType<any> | null>(null);

  useEffect(() => {
    let mounted = true;
    contentPromise.then(m => {
      if (mounted) setContent(() => m.default);
    });
    return () => {
      mounted = false;
    };
  }, [contentPromise]);

  if (!Content) {
    return null;
  }

  return <Content FormComponent={FormComponent} {...props} />;
}

export class FormWidgetsApi implements OrchestratorFormApi {
  private contentPromise: Promise<
    typeof import('./FormDecoratorContent')
  > | null = null;

  getFormDecorator: OrchestratorFormApi['getFormDecorator'] = () => {
    // eslint-disable-next-line no-console
    console.log('Using FormWidgetsApi by RHDH orchestrator-form-widgets.');

    this.contentPromise ??= import('./FormDecoratorContent');
    const contentPromise = this.contentPromise;

    return (FormComponent: ComponentType<FormDecoratorProps>) =>
      (props: OrchestratorFormContextProps) => (
        <LazyDecoratorContent
          FormComponent={FormComponent}
          contentPromise={contentPromise}
          {...props}
        />
      );
  };

  getReviewComponent: OrchestratorFormApi['getReviewComponent'] = () => {
    // Return undefined to use the default review page
    // To use a custom review page, return your custom component here
    // Example: return CustomReviewPage;
    // See: plugins/orchestrator-form-widgets/src/components/CustomReviewPage.tsx
    return undefined;
  };
}
