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
import Typography from '@mui/material/Typography';
import { styled, useTheme } from '@mui/material/styles';

import { useTranslation } from '../../hooks/useTranslation';

const StyledLegend = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  paddingLeft: theme.spacing(3.2),
}));

const StyledLegendItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const StyledLegendColorBox = styled(Box)<{ color: string }>(({ color }) => ({
  width: '10px',
  height: '10px',
  backgroundColor: color,
  flexShrink: 0,
}));

type CustomLegendProps = {
  thresholds: any;
};

const CustomLegend = (props: CustomLegendProps) => {
  const { thresholds } = props;
  const theme = useTheme();
  const { t } = useTranslation();

  if (
    !thresholds ||
    thresholds?.definition?.rules?.length === 0 ||
    thresholds?.definition?.rules === undefined
  ) {
    return (
      <StyledLegend>
        <StyledLegendItem>
          <StyledLegendColorBox color={theme.palette.grey['400']} /> --
        </StyledLegendItem>
      </StyledLegend>
    );
  }

  return (
    <StyledLegend>
      {thresholds?.definition?.rules?.map(
        ({
          key: ruleKey,
          expression: ruleExpression,
        }: {
          key: string;
          expression: string;
        }) => {
          return (
            <StyledLegendItem key={`legend-${ruleKey}`}>
              <StyledLegendColorBox
                color={
                  (
                    {
                      error: theme.palette.error.main,
                      warning: theme.palette.warning.main,
                      success: theme.palette.success.main,
                    } as Record<string, string>
                  )[ruleKey] ?? theme.palette.success.main
                }
              />
              <Typography
                variant="body2"
                sx={{ fontSize: '0.875rem', fontWeight: 400 }}
              >
                {(() => {
                  const translated = t(`thresholds.${ruleKey}` as any, {});
                  // If translation returns the ruleKey itself, fallback to capitalized ruleKey
                  return translated === `thresholds.${ruleKey}`
                    ? ruleKey.charAt(0).toUpperCase() + ruleKey.slice(1)
                    : translated;
                })()}{' '}
                {ruleExpression && `${ruleExpression}`}
              </Typography>
            </StyledLegendItem>
          );
        },
      )}
    </StyledLegend>
  );
};

export default CustomLegend;
