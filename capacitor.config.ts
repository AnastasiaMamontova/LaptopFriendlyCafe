import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.cafeberlin.mobile',
  appName: 'Cafe Berlin',
  webDir: 'dist',
  android: {
    backgroundColor: '#f8f6f0',
    adjustMarginsForEdgeToEdge: 'auto',
  },
};

export default config;
