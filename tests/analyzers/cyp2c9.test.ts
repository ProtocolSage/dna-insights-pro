import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTestGenotype,
  CYP2C9_TEST_GENOTYPES,
  assertAnalyzerResult,
  assertDrugRecommendation,
} from '../test-utils';

/**
 * CYP2C9 Analyzer Tests
 * Gold standard test suite for medical-grade analyzer
 * 
 * Clinical Context:
 * - CYP2C9 metabolizes ~15% of drugs (warfarin, NSAIDs, sulfonylureas)
 * - Key variants: *2 (rs1799853), *3 (rs1057910)
 * - Activity scoring: *1=1.0, *2=0.5, *3=0.0
 * 
 * References:
 * - CPIC Guideline for CYP2C9 and VKORC1 genotypes and warfarin dosing
 * - PMID: 21716271
 */

// Import the real analyzer via test adapter
import { analyzeCYP2C9 } from './cyp2c9-test-adapter';

describe('CYP2C9 Analyzer', () => {
  // ==========================================================================
  // BASIC FUNCTIONALITY
  // ==========================================================================

  describe('Basic Functionality', () => {
    it('should analyze wildtype (*1/*1) correctly', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.wildtype);

      expect(result.gene).toBe('CYP2C9');
      expect(result.diplotype).toBe('*1/*1');
      expect(result.phenotype).toBe('Normal Metabolizer');
      expect(result.activityScore).toBe(2.0);
    });

    it('should analyze *1/*2 heterozygote correctly', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.heterozygous_star2);

      expect(result.diplotype).toBe('*1/*2');
      expect(result.phenotype).toBe('Intermediate Metabolizer');
      expect(result.activityScore).toBe(1.5); // 1.0 + 0.5
    });

    it('should analyze *2/*2 homozygote correctly', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.homozygous_star2);

      expect(result.diplotype).toBe('*2/*2');
      expect(result.phenotype).toBe('Intermediate Metabolizer');
      expect(result.activityScore).toBe(1.0); // 0.5 + 0.5
    });

    it('should analyze *1/*3 heterozygote correctly', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.heterozygous_star3);

      expect(result.diplotype).toBe('*1/*3');
      expect(result.phenotype).toBe('Intermediate Metabolizer');
      expect(result.activityScore).toBe(1.0); // 1.0 + 0.0
    });

    it('should analyze *2/*3 compound heterozygote correctly', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.compound_heterozygous);

      expect(result.diplotype).toBe('*2/*3');
      expect(result.phenotype).toBe('Poor Metabolizer');
      expect(result.activityScore).toBe(0.5); // 0.5 + 0.0
    });

    it('should analyze *3/*3 poor metabolizer correctly', () => {
      const genotypes = [
        createTestGenotype('rs1799853', 'CC'),
        createTestGenotype('rs1057910', 'CC'), // Homozygous *3
      ];

      const result = analyzeCYP2C9(genotypes);

      expect(result.diplotype).toBe('*3/*3');
      expect(result.phenotype).toBe('Poor Metabolizer');
      expect(result.activityScore).toBe(0.0);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle missing rs1799853 data', () => {
      const genotypes = [createTestGenotype('rs1057910', 'AA')];
      const result = analyzeCYP2C9(genotypes);

      expect(result.phenotype).toBe('Unknown');
      expect(result).toHaveProperty('warning');
    });

    it('should handle missing rs1057910 data', () => {
      const genotypes = [createTestGenotype('rs1799853', 'CC')];
      const result = analyzeCYP2C9(genotypes);

      expect(result.phenotype).toBe('Unknown');
      expect(result).toHaveProperty('warning');
    });

    it('should handle completely missing data', () => {
      const result = analyzeCYP2C9([]);

      expect(result.phenotype).toBe('Unknown');
      expect(result).toHaveProperty('warning');
      expect(result.warning).toContain('insufficient');
    });

    it('should handle invalid genotypes gracefully', () => {
      const genotypes = [
        createTestGenotype('rs1799853', 'XX'), // Invalid
        createTestGenotype('rs1057910', 'YY'), // Invalid
      ];

      const result = analyzeCYP2C9(genotypes);

      expect(result.phenotype).toBe('Unknown');
      expect(result).not.toThrow;
    });

    it('should handle heterozygous null calls', () => {
      const genotypes = [
        createTestGenotype('rs1799853', 'C-'), // Heterozygous deletion
        createTestGenotype('rs1057910', 'AA'),
      ];

      const result = analyzeCYP2C9(genotypes);
      expect(result).toBeDefined();
      // Should handle gracefully - specific behavior depends on implementation
    });
  });

  // ==========================================================================
  // PROVIDER-SPECIFIC FORMATS
  // ==========================================================================

  describe('Provider Format Handling', () => {
    it('should handle 23andMe format (genotype string)', () => {
      // 23andMe provides genotypes as strings (only format supported)
      const genotypes = [
        { rsid: 'rs1799853', genotype: 'CT' },
        { rsid: 'rs1057910', genotype: 'AA' },
      ];

      const result = analyzeCYP2C9(genotypes);
      expect(result.diplotype).toBe('*1/*2');
    });
  });

  // ==========================================================================
  // DRUG RECOMMENDATIONS
  // ==========================================================================

  describe('Drug Recommendations', () => {
    it('should provide warfarin dosing guidance for *1/*1', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.wildtype);

      const warfarinRec = result.drugs?.find((d: any) => d.drug === 'warfarin');
      expect(warfarinRec).toBeDefined();
      assertDrugRecommendation(warfarinRec);
      // Case-insensitive check for standard dosing message
      expect(warfarinRec.message.toLowerCase()).toContain('standard');
    });

    it('should provide dose reduction for *1/*2', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.heterozygous_star2);

      const warfarinRec = result.drugs?.find((d: any) => d.drug === 'warfarin');
      expect(warfarinRec).toBeDefined();
      // Case-insensitive check for dose reduction message
      expect(warfarinRec.message.toLowerCase()).toContain('reduce');
      expect(warfarinRec.level).toBe('caution');
    });

    it('should provide significant dose reduction for *2/*3', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.compound_heterozygous);

      const warfarinRec = result.drugs?.find((d: any) => d.drug === 'warfarin');
      expect(warfarinRec).toBeDefined();
      expect(warfarinRec.level).toBe('warning');
      // Case-insensitive check for dose reduction message
      expect(warfarinRec.message.toLowerCase()).toContain('reduce');
    });

    it('should include NSAIDs recommendations', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.homozygous_star2);

      const nsaidRecs = result.drugs?.filter((d: any) =>
        ['ibuprofen', 'celecoxib', 'piroxicam'].includes(d.drug)
      );

      expect(nsaidRecs.length).toBeGreaterThan(0);
    });

    it('should include sulfonylurea guidance for diabetes patients', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.heterozygous_star3);

      const sulfonylureaRecs = result.drugs?.filter((d: any) =>
        ['glipizide', 'glyburide'].includes(d.drug)
      );

      expect(sulfonylureaRecs.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // CLINICAL VALIDATION
  // ==========================================================================

  describe('Clinical Validation', () => {
    it('should reference CPIC guidelines', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.wildtype);

      expect(result).toHaveProperty('guidelines');
      expect(result.guidelines).toContain('CPIC');
    });

    it('should include evidence citations (PMIDs)', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.wildtype);

      expect(result).toHaveProperty('references');
      expect(result.references).toBeInstanceOf(Array);
      expect(result.references.length).toBeGreaterThan(0);

      // Check for PMID format
      const hasPMID = result.references.some((ref: string) =>
        /PMID:\s*\d+/.test(ref)
      );
      expect(hasPMID).toBe(true);
    });

    it('should include disclaimer about clinical consultation', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.wildtype);

      expect(result).toHaveProperty('disclaimer');
      expect(result.disclaimer).toContain('healthcare provider');
    });
  });

  // ==========================================================================
  // PERFORMANCE & RELIABILITY
  // ==========================================================================

  describe('Performance & Reliability', () => {
    it('should execute in under 100ms', async () => {
      const start = performance.now();
      analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.wildtype);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should be deterministic (same input = same output)', () => {
      const result1 = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.wildtype);
      const result2 = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.wildtype);

      expect(result1).toEqual(result2);
    });

    it('should handle large batch processing', () => {
      // Simulate processing multiple samples
      const samples = Array(100)
        .fill(null)
        .map(() => CYP2C9_TEST_GENOTYPES.wildtype);

      const start = performance.now();
      samples.forEach((genotypes) => analyzeCYP2C9(genotypes));
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // 100 samples in under 1 second
    });
  });

  // ==========================================================================
  // REGRESSION TESTS
  // ==========================================================================

  describe('Regression Tests', () => {
    it('should not misclassify *1/*2 as *1/*1 (Bug #001)', () => {
      // Previous bug: heterozygous calls were being treated as wildtype
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.heterozygous_star2);

      expect(result.diplotype).not.toBe('*1/*1');
      expect(result.activityScore).not.toBe(2.0);
    });

    it('should handle null genotypes without crashing (Bug #002)', () => {
      const genotypes = [
        createTestGenotype('rs1799853', '--'),
        createTestGenotype('rs1057910', '--'),
      ];

      expect(() => analyzeCYP2C9(genotypes)).not.toThrow();
    });
  });

  // ==========================================================================
  // DATA INTEGRITY
  // ==========================================================================

  describe('Data Integrity', () => {
    it('should return all required fields', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.wildtype);

      const requiredFields = [
        'gene',
        'diplotype',
        'phenotype',
        'activityScore',
        'drugs',
        'guidelines',
        'references',
        'disclaimer',
      ];

      assertAnalyzerResult(result, requiredFields);
    });

    it('should return activity scores within valid range', () => {
      const testCases = [
        CYP2C9_TEST_GENOTYPES.wildtype,
        CYP2C9_TEST_GENOTYPES.heterozygous_star2,
        CYP2C9_TEST_GENOTYPES.homozygous_star2,
        CYP2C9_TEST_GENOTYPES.heterozygous_star3,
        CYP2C9_TEST_GENOTYPES.compound_heterozygous,
      ];

      testCases.forEach((genotypes) => {
        const result = analyzeCYP2C9(genotypes);
        expect(result.activityScore).toBeGreaterThanOrEqual(0);
        expect(result.activityScore).toBeLessThanOrEqual(2.0);
      });
    });

    it('should never return undefined for critical fields', () => {
      const result = analyzeCYP2C9(CYP2C9_TEST_GENOTYPES.wildtype);

      expect(result.gene).not.toBeUndefined();
      expect(result.phenotype).not.toBeUndefined();
      expect(result.diplotype).not.toBeUndefined();
    });
  });
});

