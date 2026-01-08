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
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

interface SectionWrapperProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode;
  title: string;
}

const SectionWrapper = ({ children, title }: SectionWrapperProps) => {
  return (
    <Box
      component={Paper}
      sx={{
        padding: '24px 24px 0 24px',
        border: theme => `1px solid ${theme.palette.grey[300]}`,
        borderRadius: 3,
      }}
    >
      <Typography
        variant="h3"
        sx={{
          display: 'flex',
          alignItems: 'center',
          fontWeight: '500',
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
};

export default SectionWrapper;
