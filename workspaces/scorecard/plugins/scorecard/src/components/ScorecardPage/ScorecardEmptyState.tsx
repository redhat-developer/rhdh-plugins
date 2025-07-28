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
import { Link } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

import noScorecardSvg from '../../images/no-scorecard.svg';

const ScorecardEmptyState: React.FC = () => {
  return (
    <Box sx={{ minHeight: '500px', p: 4 }}>
      <Grid container spacing={4} alignItems="center" justifyContent="center">
        <Grid item xs={12} md={6}>
          <Typography
            sx={theme => ({
              fontSize: '2rem',
              fontWeight: 600,
              color: theme.palette.text.primary,
              mb: 2,
            })}
          >
            No scorecards added yet
          </Typography>

          <Typography
            sx={theme => ({
              fontSize: '1.125rem',
              color: theme.palette.text.secondary,
              mb: 3,
              lineHeight: 1.5,
            })}
          >
            Scorecards help you monitor component health at a glance. To begin,
            explore our documentation for setup guidelines.
          </Typography>

          <Link to="/docs">
            <Button
              sx={{
                backgroundColor: '#1976d2',
                color: 'white',
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 500,
                textTransform: 'none',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
              }}
            >
              View documentation
            </Button>
          </Link>
        </Grid>

        <Grid item xs={12} md={6} style={{ textAlign: 'center' }}>
          <Box
            component="img"
            src={noScorecardSvg}
            alt="No scorecards"
            sx={{
              width: '100%',
              maxWidth: '600px',
              height: 'auto',
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScorecardEmptyState;
