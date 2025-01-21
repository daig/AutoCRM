import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
} as const;

const colors = {
  brand: {
    500: '#1976d2',
  },
};

export const theme = extendTheme({ config, colors }); 