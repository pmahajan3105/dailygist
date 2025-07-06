import * as React from 'react';
import { Box as MuiBox, BoxProps as MuiBoxProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface BoxProps extends MuiBoxProps {
  /**
   * If true, the component will have a subtle border radius and box shadow
   * @default false
   */
  elevated?: boolean;
  /**
   * If true, the component will have a subtle background color
   * @default false
   */
  filled?: boolean;
  /**
   * If true, the component will have a subtle border
   * @default false
   */
  outlined?: boolean;
  /**
   * The border radius of the component
   * @default 'medium'
   */
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'xlarge' | 'circular' | number;
  /**
   * The component used for the root node
   * @default 'div'
   */
  component?: React.ElementType;
}

const StyledBox = styled(MuiBox, {
  shouldForwardProp: (prop) => !['elevated', 'filled', 'outlined', 'borderRadius'].includes(prop as string),
})<BoxProps>(({ theme, elevated, filled, outlined, borderRadius = 'medium' }) => {
  // Handle border radius
  const getBorderRadius = () => {
    if (typeof borderRadius === 'number') return borderRadius;
    switch (borderRadius) {
      case 'small':
        return theme.shape.borderRadius * 0.5;
      case 'medium':
        return theme.shape.borderRadius;
      case 'large':
        return theme.shape.borderRadius * 2;
      case 'xlarge':
        return theme.shape.borderRadius * 4;
      case 'circular':
        return '50%';
      case 'none':
      default:
        return 0;
    }
  };

  return {
    ...(elevated && {
      boxShadow: theme.shadows[2],
      '&:hover': {
        boxShadow: theme.shadows[4],
      },
      transition: theme.transitions.create(['box-shadow'], {
        duration: theme.transitions.duration.shorter,
      }),
    }),
    ...(filled && {
      backgroundColor: theme.palette.mode === 'light' 
        ? theme.palette.grey[100] 
        : theme.palette.grey[800],
    }),
    ...(outlined && {
      border: `1px solid ${theme.palette.divider}`,
    }),
    borderRadius: getBorderRadius(),
    overflow: 'hidden',
  };
});

/**
 * The Box component serves as a wrapper component for most of the CSS utility needs.
 * It creates a flex container and provides a way to use all the system props.
 * It's based on the Material-UI Box component with additional styling options.
 */
const Box = React.forwardRef<HTMLDivElement, BoxProps>(function Box(props, ref) {
  const { children, ...other } = props;
  return <StyledBox ref={ref} {...other}>{children}</StyledBox>;
});

export default Box;
