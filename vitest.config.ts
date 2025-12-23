import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test utilities available in all tests
    globals: true,
    
    // Setup files run before each test file
    setupFiles: ['./tests/setup.ts'],
    
    // Coverage configuration for medical-grade standards
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      
      // Medical-grade coverage thresholds
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
      
      // Include only source files
      include: ['src/analysis/**/*.ts'],
      
      // Exclude test files and types
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/types.ts',
        'src/**/index.ts', // Re-exports only
        'tests/**',
        'node_modules/**',
      ],
      
      // Report uncovered lines
      all: true,
    },
    
    // Test file patterns
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    
    // Timeout for async tests (important for large genetic data parsing)
    testTimeout: 10000,
    
    // Run tests in parallel for speed
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    
    // Reporter configuration
    reporters: ['verbose'],
    
    // Watch mode settings
    watch: false,
  },
  
  // TypeScript/path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@analysis': path.resolve(__dirname, './src/analysis'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
});
