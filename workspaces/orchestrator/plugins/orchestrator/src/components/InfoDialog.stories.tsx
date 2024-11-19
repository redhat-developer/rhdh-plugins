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
import React from 'react';

import { Button } from '@material-ui/core';
import { useArgs } from '@storybook/preview-api';
import { Meta, StoryObj } from '@storybook/react';

import { InfoDialog } from './InfoDialog';

const meta = {
  title: 'Orchestrator/InfoDialog',
  component: InfoDialog,
} satisfies Meta<typeof InfoDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const handleSubmit = () => {};

const ConfirmationDialogContent = () => (
  <div>
    Are you sure you want to submit? By clicking the submit button, you cannot
    change the action
  </div>
);
const AlertDialogContent = () => (
  <div>
    This app sends anonymous location data, even when it is not running.
  </div>
);

export const ConfirmDialogStory: Story = {
  name: 'Confirm Dialog',
  args: {
    title: 'Confirm',
    open: true,
    children: <ConfirmationDialogContent />,
  },
  render: function Render(args) {
    const [{ open }, updateArgs] = useArgs();

    const handleClose = () => {
      updateArgs({ open: !open });
    };

    const DialogActions = () => (
      <>
        <Button onClick={handleClose} color="primary">
          Disagree
        </Button>
        <Button onClick={handleSubmit} color="primary">
          Agree
        </Button>
      </>
    );

    return (
      <InfoDialog
        {...args}
        onClose={handleClose}
        dialogActions={<DialogActions />}
      />
    );
  },
};

export const AlertDialogStory: Story = {
  name: 'Alert Dialog',
  args: {
    title: 'Alert',
    open: true,
    children: <AlertDialogContent />,
  },
  render: function Render(args) {
    const [{ open }, updateArgs] = useArgs();

    const handleClose = () => {
      updateArgs({ open: !open });
    };

    const DialogActions = () => (
      <>
        <Button onClick={handleClose} color="primary">
          OK
        </Button>
      </>
    );

    return (
      <InfoDialog
        {...args}
        onClose={handleClose}
        dialogActions={<DialogActions />}
      />
    );
  },
};
