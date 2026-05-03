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
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WorkflowErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[WorkflowBuilder] Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: 300,
            p: 4,
            gap: 2,
          }}
        >
          <Alert severity="error" sx={{ maxWidth: 500, width: '100%' }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {this.props.fallbackTitle || 'Something went wrong'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {this.state.error?.message || 'An unexpected error occurred in the workflow builder.'}
            </Typography>
          </Alert>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={this.handleReset}
            sx={{ textTransform: 'none' }}
          >
            Try again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
