import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.cafeberlin.mobile',
  appName: 'Cafe Berlin',
  webDir: 'dist',
  android: {
    backgroundColor: '#fffaf7',
    adjustMarginsForEdgeToEdge: 'auto',
  },
};

export default config;
