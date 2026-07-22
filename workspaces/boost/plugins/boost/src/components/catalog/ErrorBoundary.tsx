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

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Button } from '@backstage/ui';

interface Props {
  children: ReactNode;
  title?: string;
  retryLabel?: string;
}

interface State {
  error: Error | null;
}

/**
 * Prevents render errors from crashing the RHDH shell.
 * Displays an inline Alert with a retry action.
 *
 * Pass `title` and `retryLabel` from the translation system
 * at the call site — class components cannot use hooks.
 */
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('AI Catalog ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <Alert
          status="danger"
          title={this.props.title ?? 'Something went wrong'}
          description={this.state.error.message}
          customActions={
            <Button variant="secondary" onPress={this.handleRetry}>
              {this.props.retryLabel ?? 'Retry'}
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}
