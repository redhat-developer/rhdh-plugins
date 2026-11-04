/*
 * Copyright The Backstage Authors
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
import { render } from '@testing-library/react';
import type MonacoEditor from 'monaco-editor';

import { CodeEditorContextProvider, useCodeEditor } from './CodeEditorContext';

type CodeEditor = ReturnType<typeof useCodeEditor>;

/**
 * Minimal fake Monaco editor that records setValue/focus calls and keeps the
 * last value so getValue reflects it.
 */
const createFakeEditor = () => {
  let value = '';
  const setValue = jest.fn((next: string) => {
    value = next;
  });
  const getValue = jest.fn(() => value);
  const focus = jest.fn();
  const editor = {
    setValue,
    getValue,
    focus,
  } as unknown as MonacoEditor.editor.ICodeEditor;
  return { editor, setValue, getValue, focus };
};

/** Renders the provider and returns the (stable) context value. */
const renderContext = (): CodeEditor => {
  let captured: CodeEditor | undefined;
  const Capture = () => {
    captured = useCodeEditor();
    return null;
  };
  render(
    <CodeEditorContextProvider>
      <Capture />
    </CodeEditorContextProvider>,
  );
  return captured!;
};

describe('CodeEditorContextProvider', () => {
  it('applies a value set before the editor mounts once it registers', () => {
    const codeEditor = renderContext();
    const { editor, setValue, focus } = createFakeEditor();

    // setValue is called before Monaco has mounted (the flaky case): it must
    // not be dropped.
    codeEditor.setValue('plugins:\n  - package: oci://example\n');
    expect(setValue).not.toHaveBeenCalled();

    // When the lazy-loaded editor finally registers, the buffered value is
    // flushed.
    codeEditor.setEditor(editor);
    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith(
      'plugins:\n  - package: oci://example\n',
    );
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('flushes only the latest pre-mount value', () => {
    const codeEditor = renderContext();
    const { editor, setValue } = createFakeEditor();

    codeEditor.setValue('first');
    codeEditor.setValue('second');
    codeEditor.setEditor(editor);

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith('second');
  });

  it('honours autoFocus=false for a buffered value', () => {
    const codeEditor = renderContext();
    const { editor, setValue, focus } = createFakeEditor();

    codeEditor.setValue('no-focus', false);
    codeEditor.setEditor(editor);

    expect(setValue).toHaveBeenCalledWith('no-focus');
    expect(focus).not.toHaveBeenCalled();
  });

  it('applies values immediately once the editor is registered', () => {
    const codeEditor = renderContext();
    const { editor, setValue, focus } = createFakeEditor();

    codeEditor.setEditor(editor);
    codeEditor.setValue('live');

    expect(setValue).toHaveBeenCalledTimes(1);
    expect(setValue).toHaveBeenCalledWith('live');
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('does not re-flush a buffered value on a later setValue', () => {
    const codeEditor = renderContext();
    const { editor, setValue } = createFakeEditor();

    codeEditor.setValue('buffered');
    codeEditor.setEditor(editor);
    codeEditor.setValue('direct');

    expect(setValue).toHaveBeenNthCalledWith(1, 'buffered');
    expect(setValue).toHaveBeenNthCalledWith(2, 'direct');
    expect(setValue).toHaveBeenCalledTimes(2);
  });
});
