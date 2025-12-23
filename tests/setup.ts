import { expect } from 'vitest';

/**
 * Global test setup for DNA analysis testing
 * Runs before each test file
 */

// Extend Vitest matchers with custom assertions for genetic data
expect.extend({
  /**
   * Check if a genotype is valid (format: rs12345:AA or chr1:12345:AA)
   */
  toBeValidGenotype(received: string) {
    const isValid =
      /^rs\d+:[ATCG]{2}$/.test(received) ||
      /^chr\d+:\d+:[ATCG]{2}$/.test(received);

    return {
      pass: isValid,
      message: () =>
        `Expected ${received} to be a valid genotype (format: rs12345:AA or chr1:12345:AA)`,
    };
  },

  /**
   * Check if an allele name follows standard nomenclature (e.g., *1, *2, *3A)
   */
  toBeValidAlleleName(received: string) {
    const isValid = /^\*\d+[A-Z]?$/.test(received);

    return {
      pass: isValid,
      message: () =>
        `Expected ${received} to be a valid allele name (format: *1, *2, *3A)`,
    };
  },

  /**
   * Check if a phenotype is one of the standard CPIC categories
   */
  toBeValidPhenotype(received: string) {
    const validPhenotypes = [
      'Normal Metabolizer',
      'Intermediate Metabolizer',
      'Poor Metabolizer',
      'Rapid Metabolizer',
      'Ultrarapid Metabolizer',
      'Normal Function',
      'Decreased Function',
      'Poor Function',
      'Increased Function',
      'Unknown',
      'Indeterminate',
    ];

    const isValid = validPhenotypes.includes(received);

    return {
      pass: isValid,
      message: () =>
        `Expected ${received} to be a valid CPIC phenotype. Valid options: ${validPhenotypes.join(', ')}`,
    };
  },

  /**
   * Check if activity score is within valid range (typically 0-3 for most genes)
   */
  toBeValidActivityScore(received: number, min = 0, max = 3) {
    const isValid = typeof received === 'number' && received >= min && received <= max;

    return {
      pass: isValid,
      message: () =>
        `Expected ${received} to be a valid activity score (number between ${min} and ${max})`,
    };
  },
});

// Declare custom matchers for TypeScript
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidGenotype(): T;
    toBeValidAlleleName(): T;
    toBeValidPhenotype(): T;
    toBeValidActivityScore(min?: number, max?: number): T;
  }
}

// Suppress console warnings in tests (optional - remove if you want to see all warnings)
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Filter out specific warnings you want to suppress
  const message = args[0]?.toString() || '';
  if (message.includes('specific-warning-to-suppress')) {
    return;
  }
  originalWarn(...args);
};

// Log test environment info
console.log('🧬 DNA Analysis Test Suite Initialized');
console.log('📊 Medical-Grade Coverage Thresholds: 95% all metrics');
console.log('');
