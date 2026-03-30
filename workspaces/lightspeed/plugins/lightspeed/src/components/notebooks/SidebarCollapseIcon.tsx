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

type IconProps = {
  className?: string;
};

export const SidebarCollapseIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M16 21V3H14V21H16ZM12 17V7L7 12L12 17Z" fill="currentColor" />
  </svg>
);

export const SidebarExpandIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M9 21V3H11V21H9ZM13 17V7L18 12L13 17Z" fill="currentColor" />
  </svg>
);

export const AddCircleFilledIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.75 0C12.0312 1.02089e-05 15.5 3.46877 15.5 7.75C15.5 12.0312 12.0312 15.5 7.75 15.5C3.46877 15.5 1.02086e-05 12.0312 0 7.75C0 3.46876 3.46876 0 7.75 0ZM6.875 3.25C6.66876 3.25 6.5 3.41876 6.5 3.625V6.5H3.625C3.41876 6.5 3.25 6.66876 3.25 6.875V8.625C3.25001 8.83123 3.41877 9 3.625 9H6.5V11.875C6.50002 12.0812 6.66877 12.25 6.875 12.25H8.625C8.83122 12.25 8.99998 12.0812 9 11.875V9H11.875C12.0812 8.99998 12.25 8.83122 12.25 8.625V6.875C12.25 6.66877 12.0812 6.50002 11.875 6.5H9V3.625C9 3.41877 8.83123 3.25001 8.625 3.25H6.875Z"
      fill="#0066CC"
    />
  </svg>
);
