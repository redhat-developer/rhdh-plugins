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
import Button from '@mui/material/Button';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export const QuickstartCtaLink = ({ cta, onClick }: any) => {
  if (!cta) return null;

  const isExternalLink =
    cta.link.startsWith('http://') || cta.link.startsWith('https://');

  return isExternalLink ? (
    <Button
      sx={{
        borderRadius: '25px',
        gap: '5px',
      }}
      variant="outlined"
      target="blank"
      href={cta.link}
      onClick={onClick}
    >
      {cta.text}
      <OpenInNewIcon
        sx={{
          fontSize: '15px',
        }}
      />
    </Button>
  ) : (
    <Button
      sx={{ borderRadius: '25px' }}
      variant="outlined"
      href={cta.link}
      onClick={onClick}
    >
      {cta.text}
    </Button>
  );
};
