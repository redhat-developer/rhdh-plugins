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
import { StylesProvider } from '@mui/styles';

import { FloatingActionButton } from '../types';
import { evaluateFloatingButtonsWithPositions } from '../utils';
import { generateClassName } from '../utils/generateClassName';
import { FloatingButton } from './FloatingButton';

const GlobalFloatingActionButtonInner = ({
  floatingButtons,
}: {
  floatingButtons: FloatingActionButton[];
}) => {
  const floatingButtonMap =
    evaluateFloatingButtonsWithPositions(floatingButtons);

  return (
    <>
      {floatingButtonMap.map(fb => (
        <FloatingButton
          key={fb.slot}
          slot={fb.slot}
          floatingButtons={fb.actions}
        />
      ))}
    </>
  );
};

export const GlobalFloatingActionButton = ({
  floatingButtons,
}: {
  floatingButtons: FloatingActionButton[];
}) => (
  <StylesProvider generateClassName={generateClassName}>
    <GlobalFloatingActionButtonInner floatingButtons={floatingButtons} />
  </StylesProvider>
);
