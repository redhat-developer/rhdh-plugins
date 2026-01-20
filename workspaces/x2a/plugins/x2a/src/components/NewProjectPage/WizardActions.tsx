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
import { LinkButton } from '@backstage/core-components';
import { Button, Grid } from '@material-ui/core';

export type WizardActionsProps = {
  canNext: boolean;
  canBack: boolean;
  onCancelLink: string;
  onBack: () => void;
  onNext: () => void;
};

export const WizardActions = ({
  canNext,
  canBack,
  onCancelLink,
  onBack,
  onNext,
}: WizardActionsProps) => {
  return (
    <Grid container spacing={3} direction="row" justifyContent="space-between">
      <Grid item>
        <LinkButton variant="text" to={onCancelLink}>
          Cancel
        </LinkButton>
      </Grid>

      <Grid item>
        <Button variant="text" disabled={!canBack} onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!canNext}
          onClick={onNext}
        >
          Next
        </Button>
      </Grid>
    </Grid>
  );
};
