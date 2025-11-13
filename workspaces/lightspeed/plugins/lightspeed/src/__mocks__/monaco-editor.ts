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

const mockEditor = {
  layout: jest.fn(),
  focus: jest.fn(),
  dispose: jest.fn(),
  getModel: jest.fn(),
  updateOptions: jest.fn(),
};

const mockModel = {
  updateOptions: jest.fn(),
  dispose: jest.fn(),
};

module.exports = {
  editor: {
    create: jest.fn(() => mockEditor),
    getModels: jest.fn(() => [mockModel]),
  },
};
