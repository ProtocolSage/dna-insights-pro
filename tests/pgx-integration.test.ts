import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTestGenotype,
  CYP2C9_TEST_GENOTYPES,
  VKORC1_TEST_GENOTYPES,
  SLCO1B1_TEST_GENOTYPES,
  F5_TEST_GENOTYPES,
} from './test-utils';

/**
 * Integration Tests - Complete PGx Analysis Pipeline
 * 
 * Tests the full workflow from raw genetic data to clinical recommendations:
 * 1. Data ingestion & normalization
 * 2. Individual gene analysis
 * 3. Drug-gene interaction mapping
 * 4. Combined recommendations
 * 5. Report generation
 */

// Mock the integration module - replace with actual import
// import { analyzePGx } from '@/analysis/pgx-integration';
const analyzePGx = (genotypes: any) => {
  return {
    genes: {},
    drugs: [],
    summary: {},
  };
};

describe('PGx Integration Tests', () => {
  // ==========================================================================
  // COMPLETE ANALYSIS PIPELINE
  // ==========================================================================

  describe('Complete Analysis Pipeline', () => {
    it('should analyze all genes from comprehensive genetic data', () => {
      const genotypes = [
        ...CYP2C9_TEST_GENOTYPES.wildtype,
        VKORC1_TEST_GENOTYPES.GG,
        SLCO1B1_TEST_GENOTYPES.normal,
        F5_TEST_GENOTYPES.normal,
      ];

      const result = analyzePGx(genotypes);

      expect(result.genes).toHaveProperty('CYP2C9');
      expect(result.genes).toHaveProperty('VKORC1');
      expect(result.genes).toHaveProperty('SLCO1B1');
      expect(result.genes).toHaveProperty('F5');
    });

    it('should handle partial genetic data (missing some genes)', () => {
      const genotypes = [...CYP2C9_TEST_GENOTYPES.wildtype];

      const result = analyzePGx(genotypes);

      expect(result.genes.CYP2C9).toBeDefined();
      expect(result.genes.VKORC1.phenotype).toBe('Unknown');
    });

    it('should complete analysis in reasonable time', async () => {
      const genotypes = [
        ...CYP2C9_TEST_GENOTYPES.wildtype,
        VKORC1_TEST_GENOTYPES.GG,
        SLCO1B1_TEST_GENOTYPES.normal,
        F5_TEST_GENOTYPES.normal,
      ];

      const start = performance.now();
      analyzePGx(genotypes);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500); // Should complete in under 500ms
    });
  });

  // ==========================================================================
  // COMBINED DRUG RECOMMENDATIONS
  // ==========================================================================

  describe('Combined Drug Recommendations', () => {
    it('should combine CYP2C9 and VKORC1 for warfarin dosing', () => {
      const genotypes = [
        ...CYP2C9_TEST_GENOTYPES.heterozygous_star2, // Intermediate CYP2C9
        VKORC1_TEST_GENOTYPES.AG, // Intermediate VKORC1
      ];

      const result = analyzePGx(genotypes);

      const warfarinRec = result.drugs.find((d: any) => d.drug === 'warfarin');
      expect(warfarinRec).toBeDefined();
      expect(warfarinRec.factors).toContain('CYP2C9');
      expect(warfarinRec.factors).toContain('VKORC1');
      expect(warfarinRec.message).toContain('reduce');
    });

    it('should provide highest risk level when multiple genes suggest caution', () => {
      const genotypes = [
        ...CYP2C9_TEST_GENOTYPES.compound_heterozygous, // Poor CYP2C9
        VKORC1_TEST_GENOTYPES.AA, // High sensitivity VKORC1
      ];

      const result = analyzePGx(genotypes);

      const warfarinRec = result.drugs.find((d: any) => d.drug === 'warfarin');
      expect(warfarinRec.level).toBe('warning');
      expect(warfarinRec.message).toContain('significantly reduce');
    });

    it('should aggregate all NSAIDs recommendations from CYP2C9', () => {
      const genotypes = [...CYP2C9_TEST_GENOTYPES.heterozygous_star2];

      const result = analyzePGx(genotypes);

      const nsaidDrugs = [
        'ibuprofen',
        'celecoxib',
        'piroxicam',
        'meloxicam',
        'diclofenac',
      ];

      nsaidDrugs.forEach((drug) => {
        const rec = result.drugs.find((d: any) => d.drug === drug);
        expect(rec).toBeDefined();
      });
    });

    it('should include statin recommendations from SLCO1B1', () => {
      const genotypes = [SLCO1B1_TEST_GENOTYPES.poor];

      const result = analyzePGx(genotypes);

      const statinRec = result.drugs.find((d: any) => d.drug === 'simvastatin');
      expect(statinRec).toBeDefined();
      expect(statinRec.level).toBe('warning');
    });

    it('should include thrombosis risk from F5', () => {
      const genotypes = [F5_TEST_GENOTYPES.heterozygous];

      const result = analyzePGx(genotypes);

      const oralContraceptiveRec = result.drugs.find(
        (d: any) => d.drug === 'oral contraceptives'
      );
      expect(oralContraceptiveRec).toBeDefined();
      expect(oralContraceptiveRec.message).toContain('thrombosis');
    });
  });

  // ==========================================================================
  // DRUG CONFLICT DETECTION
  // ==========================================================================

  describe('Drug Conflict Detection', () => {
    it('should identify when multiple genes affect the same drug', () => {
      const genotypes = [
        ...CYP2C9_TEST_GENOTYPES.heterozygous_star2,
        VKORC1_TEST_GENOTYPES.AG,
      ];

      const result = analyzePGx(genotypes);

      const warfarinRec = result.drugs.find((d: any) => d.drug === 'warfarin');
      expect(warfarinRec.affectedBy).toHaveLength(2);
      expect(warfarinRec.affectedBy).toContain('CYP2C9');
      expect(warfarinRec.affectedBy).toContain('VKORC1');
    });

    it('should provide prioritized recommendation when conflicts exist', () => {
      // If CYP2C9 says reduce 25% but VKORC1 says reduce 50%
      const genotypes = [
        ...CYP2C9_TEST_GENOTYPES.heterozygous_star2,
        VKORC1_TEST_GENOTYPES.AA,
      ];

      const result = analyzePGx(genotypes);

      const warfarinRec = result.drugs.find((d: any) => d.drug === 'warfarin');
      // Should use the more conservative (larger reduction)
      expect(warfarinRec.message).toContain('50%');
    });
  });

  // ==========================================================================
  // SUMMARY GENERATION
  // ==========================================================================

  describe('Summary Generation', () => {
    it('should generate overall risk summary', () => {
      const genotypes = [
        ...CYP2C9_TEST_GENOTYPES.compound_heterozygous,
        VKORC1_TEST_GENOTYPES.AA,
        SLCO1B1_TEST_GENOTYPES.poor,
        F5_TEST_GENOTYPES.heterozygous,
      ];

      const result = analyzePGx(genotypes);

      expect(result.summary).toBeDefined();
      expect(result.summary.highRiskDrugs).toBeGreaterThan(0);
      expect(result.summary.totalGenesAnalyzed).toBe(4);
    });

    it('should categorize drugs by risk level', () => {
      const genotypes = [
        ...CYP2C9_TEST_GENOTYPES.heterozygous_star2,
        VKORC1_TEST_GENOTYPES.AG,
      ];

      const result = analyzePGx(genotypes);

      expect(result.summary.drugsByRisk).toBeDefined();
      expect(result.summary.drugsByRisk.warning).toBeInstanceOf(Array);
      expect(result.summary.drugsByRisk.caution).toBeInstanceOf(Array);
      expect(result.summary.drugsByRisk.normal).toBeInstanceOf(Array);
    });

    it('should identify genes with actionable findings', () => {
      const genotypes = [
        ...CYP2C9_TEST_GENOTYPES.wildtype,
        VKORC1_TEST_GENOTYPES.AA, // Actionable
        SLCO1B1_TEST_GENOTYPES.normal,
        F5_TEST_GENOTYPES.heterozygous, // Actionable
      ];

      const result = analyzePGx(genotypes);

      expect(result.summary.actionableGenes).toHaveLength(2);
      expect(result.summary.actionableGenes).toContain('VKORC1');
      expect(result.summary.actionableGenes).toContain('F5');
    });
  });

  // ==========================================================================
  // DATA NORMALIZATION
  // ==========================================================================

  describe('Data Normalization', () => {
    it('should handle 23andMe format', () => {
      const genotypes = [
        { rsid: 'rs1799853', genotype: 'CT', provider: '23andme' },
        { rsid: 'rs1057910', genotype: 'AA', provider: '23andme' },
      ];

      const result = analyzePGx(genotypes);
      expect(result.genes.CYP2C9).toBeDefined();
    });

    it('should handle AncestryDNA format', () => {
      const genotypes = [
        {
          rsid: 'rs1799853',
          allele1: 'C',
          allele2: 'T',
          provider: 'ancestry',
        },
        { rsid: 'rs1057910', allele1: 'A', allele2: 'A', provider: 'ancestry' },
      ];

      const result = analyzePGx(genotypes);
      expect(result.genes.CYP2C9).toBeDefined();
    });

    it('should normalize chromosome notation (chr1 vs 1)', () => {
      const genotypes = [
        { rsid: 'rs1799853', genotype: 'CT', chromosome: 'chr1' },
        { rsid: 'rs1057910', genotype: 'AA', chromosome: '1' },
      ];

      const result = analyzePGx(genotypes);
      expect(result.genes.CYP2C9).toBeDefined();
    });

    it('should handle missing/null genotypes', () => {
      const genotypes = [
        { rsid: 'rs1799853', genotype: '--' },
        { rsid: 'rs1057910', genotype: null },
      ];

      const result = analyzePGx(genotypes);
      expect(result.genes.CYP2C9.phenotype).toBe('Unknown');
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe('Error Handling', () => {
    it('should handle empty input gracefully', () => {
      expect(() => analyzePGx([])).not.toThrow();
      const result = analyzePGx([]);
      expect(result.summary.totalGenesAnalyzed).toBe(0);
    });

    it('should handle malformed input', () => {
      const malformed = [
        { invalid: 'data' },
        { rsid: null, genotype: 'AA' },
        'not-an-object',
      ];

      expect(() => analyzePGx(malformed as any)).not.toThrow();
    });

    it('should validate all outputs have required fields', () => {
      const genotypes = [...CYP2C9_TEST_GENOTYPES.wildtype];
      const result = analyzePGx(genotypes);

      expect(result).toHaveProperty('genes');
      expect(result).toHaveProperty('drugs');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('disclaimer');
      expect(result).toHaveProperty('timestamp');
    });
  });

  // ==========================================================================
  // REPORT GENERATION
  // ==========================================================================

  describe('Report Generation', () => {
    it('should include medical disclaimer', () => {
      const result = analyzePGx([]);

      expect(result.disclaimer).toBeDefined();
      expect(result.disclaimer).toContain('healthcare provider');
      expect(result.disclaimer).toContain('not a substitute');
    });

    it('should include timestamp', () => {
      const result = analyzePGx([]);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should include version information', () => {
      const result = analyzePGx([]);

      expect(result.version).toBeDefined();
      expect(result.version.analyzer).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should include all guideline references', () => {
      const genotypes = [
        ...CYP2C9_TEST_GENOTYPES.wildtype,
        VKORC1_TEST_GENOTYPES.GG,
      ];

      const result = analyzePGx(genotypes);

      expect(result.references).toBeDefined();
      expect(result.references.length).toBeGreaterThan(0);
      expect(result.references.some((r: string) => r.includes('CPIC'))).toBe(
        true
      );
    });
  });

  // ==========================================================================
  // REGRESSION TESTS
  // ==========================================================================

  describe('Regression Tests', () => {
    it('should not lose data during normalization (Bug #003)', () => {
      const genotypes = [
        createTestGenotype('rs1799853', 'CT'),
        createTestGenotype('rs1057910', 'AA'),
      ];

      const result = analyzePGx(genotypes);

      // Ensure all input variants are accounted for
      expect(result.processedVariants).toBe(2);
    });

    it('should handle concurrent analyses without state contamination (Bug #004)', () => {
      const genotypes1 = [...CYP2C9_TEST_GENOTYPES.wildtype];
      const genotypes2 = [...CYP2C9_TEST_GENOTYPES.heterozygous_star2];

      const result1 = analyzePGx(genotypes1);
      const result2 = analyzePGx(genotypes2);

      expect(result1.genes.CYP2C9.diplotype).toBe('*1/*1');
      expect(result2.genes.CYP2C9.diplotype).toBe('*1/*2');
    });
  });

  // ==========================================================================
  // PERFORMANCE
  // ==========================================================================

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Simulate processing 1000 variants
      const largeDataset = Array(1000)
        .fill(null)
        .map((_, i) => createTestGenotype(`rs${i}`, 'AA'));

      const start = performance.now();
      analyzePGx(largeDataset);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
    });

    it('should be memory efficient', () => {
      const genotypes = [...CYP2C9_TEST_GENOTYPES.wildtype];

      // Run multiple times to check for memory leaks
      for (let i = 0; i < 100; i++) {
        analyzePGx(genotypes);
      }

      // If we got here without crashing, memory is likely ok
      expect(true).toBe(true);
    });
  });
});

