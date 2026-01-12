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
import { ReactNode, useEffect, useRef } from 'react';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * @public
 * Button with loading state.
 */
const SubmitButton = ({
  submitting,
  handleClick,
  children,
  focusOnMount,
}: {
  submitting: boolean;
  handleClick?: () => void;
  children: ReactNode;
  focusOnMount?: boolean;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (focusOnMount) {
      ref.current?.focus();
    }
  }, [focusOnMount]);
  return (
    <Button
      ref={ref}
      variant="contained"
      color="primary"
      onClick={handleClick}
      disabled={submitting}
      type="submit"
      startIcon={submitting ? <CircularProgress size="1rem" /> : null}
      // work around for using react 18 with material 4 causes button to crash when pressing enter, see https://github.com/mui/material-ui/issues/30953
      // this will be resolved when upgrading to material 5
      disableRipple
    >
      {children}
    </Button>
  );
};

export default SubmitButton;
