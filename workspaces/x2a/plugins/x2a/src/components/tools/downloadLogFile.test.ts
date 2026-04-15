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

import { downloadLogFile } from './downloadLogFile';

describe('downloadLogFile', () => {
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;
  let anchorClickMock: jest.Mock;

  beforeEach(() => {
    createObjectURLMock = jest.fn().mockReturnValue('blob:mock-url');
    revokeObjectURLMock = jest.fn();
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;

    anchorClickMock = jest.fn();
    jest.spyOn(document, 'createElement').mockReturnValue({
      set href(_: string) {},
      set download(_: string) {},
      click: anchorClickMock,
    } as unknown as HTMLAnchorElement);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a blob with the provided text', () => {
    downloadLogFile('log content', 'test');

    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));
  });

  it('triggers a download with the correct filename', () => {
    const setDownloadSpy = jest.fn();
    jest.spyOn(document, 'createElement').mockReturnValue({
      set href(_: string) {},
      set download(val: string) {
        setDownloadSpy(val);
      },
      click: anchorClickMock,
    } as unknown as HTMLAnchorElement);

    downloadLogFile('log content', 'analyze-proj-1');

    expect(setDownloadSpy).toHaveBeenCalledWith('analyze-proj-1.log');
  });

  it('clicks the anchor to trigger download', () => {
    downloadLogFile('log content', 'test');

    expect(anchorClickMock).toHaveBeenCalled();
  });

  it('revokes the object URL after download', () => {
    downloadLogFile('log content', 'test');

    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
  });
});
