import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('src/data/vtf8ListsData')) {
            return 'vtf-8lists-data';
          }
          if (id.includes('src/data/landingData')) {
            return 'vtf-landing-data';
          }
          if (id.includes('src/components/KateLinhChatbot')) {
            return 'vtf-katelinh-ai';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/hinh anh tham khao/**',
        '**/tsconfig.json',
      ],
    },
  },
});
