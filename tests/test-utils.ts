import { describe, it, expect } from 'vitest';

/**
 * Test Utilities for DNA Analysis
 * Provides factories, validators, and helpers for testing genetic data
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface TestGenotype {
  rsid: string;
  chromosome: string;
  position: number;
  genotype: string;
  provider?: 'ancestry' | '23andme' | 'generic';
}

export interface TestDiplotype {
  gene: string;
  allele1: string;
  allele2: string;
  activityScore?: number;
  phenotype?: string;
}

export interface TestVariant {
  rsid: string;
  alleles: string[];
  consequence?: string;
  gene?: string;
}

// =============================================================================
// GENOTYPE FACTORIES
// =============================================================================

/**
 * Create a test genotype with proper formatting
 */
export function createTestGenotype(
  rsid: string,
  genotype: string,
  options?: {
    chromosome?: string;
    position?: number;
    provider?: 'ancestry' | '23andme' | 'generic';
  }
): TestGenotype {
  return {
    rsid,
    chromosome: options?.chromosome || 'chr1',
    position: options?.position || 12345,
    genotype,
    provider: options?.provider || 'generic',
  };
}

/**
 * Create a batch of test genotypes
 */
export function createTestGenotypes(
  variants: Array<{ rsid: string; genotype: string }>
): TestGenotype[] {
  return variants.map((v) => createTestGenotype(v.rsid, v.genotype));
}

/**
 * Create genotype data in different provider formats
 */
export function createProviderGenotype(
  rsid: string,
  genotype: string,
  provider: 'ancestry' | '23andme'
): Record<string, any> {
  const base = {
    rsid,
    chromosome: 'chr1',
    position: 12345,
  };

  switch (provider) {
    case 'ancestry':
      return {
        ...base,
        allele1: genotype[0],
        allele2: genotype[1],
      };
    case '23andme':
      return {
        ...base,
        genotype,
      };
    default:
      return { ...base, genotype };
  }
}

// =============================================================================
// DIPLOTYPE FACTORIES
// =============================================================================

/**
 * Create a test diplotype
 */
export function createTestDiplotype(
  gene: string,
  allele1: string,
  allele2: string,
  options?: {
    activityScore?: number;
    phenotype?: string;
  }
): TestDiplotype {
  return {
    gene,
    allele1,
    allele2,
    activityScore: options?.activityScore,
    phenotype: options?.phenotype,
  };
}

// =============================================================================
// VALIDATORS
// =============================================================================

/**
 * Validate genotype format
 */
export function isValidGenotype(genotype: string): boolean {
  return /^[ATCG-]{1,2}$/.test(genotype);
}

/**
 * Validate allele name format
 */
export function isValidAlleleName(allele: string): boolean {
  return /^\*\d+[A-Z]?$/.test(allele);
}

/**
 * Validate activity score range
 */
export function isValidActivityScore(score: number, min = 0, max = 3): boolean {
  return typeof score === 'number' && score >= min && score <= max;
}

/**
 * Validate CPIC phenotype
 */
export function isValidCPICPhenotype(phenotype: string): boolean {
  const valid = [
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
  return valid.includes(phenotype);
}

// =============================================================================
// TEST DATA SETS
// =============================================================================

/**
 * Standard test genotypes for CYP2C9
 */
export const CYP2C9_TEST_GENOTYPES = {
  wildtype: [
    createTestGenotype('rs1799853', 'CC'), // *1/*1 (430C>T)
    createTestGenotype('rs1057910', 'AA'), // *1/*1 (1075A>C)
  ],
  heterozygous_star2: [
    createTestGenotype('rs1799853', 'CT'), // *1/*2
    createTestGenotype('rs1057910', 'AA'),
  ],
  homozygous_star2: [
    createTestGenotype('rs1799853', 'TT'), // *2/*2
    createTestGenotype('rs1057910', 'AA'),
  ],
  heterozygous_star3: [
    createTestGenotype('rs1799853', 'CC'),
    createTestGenotype('rs1057910', 'AC'), // *1/*3
  ],
  compound_heterozygous: [
    createTestGenotype('rs1799853', 'CT'),
    createTestGenotype('rs1057910', 'AC'), // *2/*3
  ],
};

/**
 * Standard test genotypes for VKORC1
 */
export const VKORC1_TEST_GENOTYPES = {
  GG: createTestGenotype('rs9923231', 'GG'), // High dose
  AG: createTestGenotype('rs9923231', 'AG'), // Medium dose
  AA: createTestGenotype('rs9923231', 'AA'), // Low dose
};

/**
 * Standard test genotypes for SLCO1B1
 */
export const SLCO1B1_TEST_GENOTYPES = {
  normal: createTestGenotype('rs4149056', 'TT'), // *1/*1
  intermediate: createTestGenotype('rs4149056', 'TC'), // *1/*5
  poor: createTestGenotype('rs4149056', 'CC'), // *5/*5
};

/**
 * Standard test genotypes for F5 (Factor V Leiden)
 * 
 * rs6025 (R506Q):
 * - Reference allele: G (normal coagulation)
 * - Alternate allele: A (Leiden mutation, APC resistance)
 * - 23andMe reports on forward strand: G>A
 * 
 * Clinical Reference: ClinVar VCV000015164
 */
export const F5_TEST_GENOTYPES = {
  normal: createTestGenotype('rs6025', 'GG'), // No mutation - normal Factor V
  heterozygous: createTestGenotype('rs6025', 'AG'), // One copy - 5-7x VTE risk
  homozygous: createTestGenotype('rs6025', 'AA'), // Two copies - 50-80x VTE risk
};

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

/**
 * Assert that an analyzer result has required fields
 */
export function assertAnalyzerResult(result: any, requiredFields: string[]) {
  expect(result).toBeDefined();
  expect(result).toBeTypeOf('object');

  requiredFields.forEach((field) => {
    expect(result).toHaveProperty(field);
  });
}

/**
 * Assert that a recommendation has required safety fields
 */
export function assertSafetyRecommendation(recommendation: any) {
  expect(recommendation).toBeDefined();
  expect(recommendation).toHaveProperty('level'); // 'normal', 'caution', 'warning'
  expect(recommendation).toHaveProperty('message');
  expect(recommendation.message).toBeTypeOf('string');
  expect(recommendation.message.length).toBeGreaterThan(0);
}

/**
 * Assert that a drug recommendation has clinical guidance
 */
export function assertDrugRecommendation(recommendation: any) {
  assertSafetyRecommendation(recommendation);
  expect(recommendation).toHaveProperty('drug');
  expect(recommendation).toHaveProperty('guideline'); // Optional but recommended
}

// =============================================================================
// TEST SCENARIOS
// =============================================================================

/**
 * Common test scenarios for any gene analyzer
 */
export function createStandardAnalyzerTests(
  analyzerName: string,
  analyzeFunction: (genotypes: TestGenotype[]) => any,
  testCases: Array<{
    name: string;
    genotypes: TestGenotype[];
    expectedPhenotype: string;
    expectedActivityScore?: number;
  }>
) {
  describe(`${analyzerName} - Standard Tests`, () => {
    testCases.forEach(({ name, genotypes, expectedPhenotype, expectedActivityScore }) => {
      it(`should correctly analyze ${name}`, () => {
        const result = analyzeFunction(genotypes);

        expect(result).toBeDefined();
        expect(result.phenotype).toBe(expectedPhenotype);

        if (expectedActivityScore !== undefined) {
          expect(result.activityScore).toBe(expectedActivityScore);
        }
      });
    });

    it('should handle missing/incomplete data gracefully', () => {
      const result = analyzeFunction([]);
      expect(result.phenotype).toBe('Unknown');
    });

    it('should handle invalid genotypes safely', () => {
      const invalidGenotypes = [createTestGenotype('rs999999', 'XX')];
      const result = analyzeFunction(invalidGenotypes);
      expect(result).toBeDefined();
      // Should not throw, should return safe default
    });
  });
}

// =============================================================================
// PERFORMANCE HELPERS
// =============================================================================

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; timeMs: number }> {
  const start = performance.now();
  const result = await fn();
  const timeMs = performance.now() - start;
  return { result, timeMs };
}

/**
 * Assert that a function executes within a time limit
 */
export async function assertPerformance<T>(
  fn: () => T | Promise<T>,
  maxTimeMs: number
): Promise<T> {
  const { result, timeMs } = await measureExecutionTime(fn);
  expect(timeMs).toBeLessThan(maxTimeMs);
  return result;
}
