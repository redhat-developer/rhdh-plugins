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

import {
  FormGroup,
  FormSelect,
  FormSelectOption,
  ToolbarItem,
} from '@patternfly/react-core';

type Props = {
  applications?: string[];
  selectedApplication?: string;
  onSelectedApplication?: (val: string) => void;
  isFetching: boolean;
};

export const ApplicationSelector = ({
  applications,
  selectedApplication,
  onSelectedApplication,
  isFetching,
}: Props) => {
  if (!applications?.length || !onSelectedApplication) return null;

  return (
    <ToolbarItem>
      <FormGroup label="Application">
        <FormSelect
          id="application-selector"
          data-testid="application-selector"
          value={selectedApplication}
          onChange={(_e, value) => onSelectedApplication(value as string)}
          label="Application"
          isDisabled={isFetching}
        >
          <FormSelectOption value="All" key="All" label="All" />
          {applications.map(app => (
            <FormSelectOption key={app} value={app} label={app} />
          ))}
        </FormSelect>
      </FormGroup>
    </ToolbarItem>
  );
};
