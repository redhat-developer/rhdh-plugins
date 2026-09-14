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

import { getScopedDialogProps } from '../scoped-dialog-utils';

describe('getScopedDialogProps', () => {
  it('places fullscreen dialogs in the top-right when requested', () => {
    const props = getScopedDialogProps(false, { placement: 'top-right' });

    expect(props.disablePortal).toBeUndefined();
    expect(props.sx).toEqual(
      expect.objectContaining({
        '& .MuiDialog-container': expect.objectContaining({
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
        }),
      }),
    );
  });

  it('anchors compact top-right dialogs to the overlay corner', () => {
    const props = getScopedDialogProps(true, { placement: 'top-right' });

    expect(props.disablePortal).toBe(true);
    expect(props.sx).toEqual(
      expect.objectContaining({
        position: 'absolute',
        '& .MuiDialog-container': expect.objectContaining({
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
        }),
      }),
    );
    expect(props.PaperProps?.sx).toEqual(
      expect.objectContaining({
        marginLeft: 'auto !important',
        marginRight: '16px !important',
      }),
    );
  });

  it('keeps compact dialogs centered by default', () => {
    const props = getScopedDialogProps(true);

    expect(props.sx).toEqual(
      expect.not.objectContaining({
        '& .MuiDialog-container': expect.anything(),
      }),
    );
    expect(props.PaperProps?.sx).toEqual(
      expect.objectContaining({
        marginLeft: '40px !important',
        marginRight: '40px !important',
      }),
    );
  });
});
