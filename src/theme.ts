import { extendTheme } from '@chakra-ui/theme-utils';
import type { ThemeConfig } from '@chakra-ui/theme';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  colors: {
    brand: {
      500: '#1976d2',
    },
  },
}); 