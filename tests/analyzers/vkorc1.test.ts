import { describe, it, expect } from 'vitest';
import {
  VKORC1_TEST_GENOTYPES,
  assertAnalyzerResult,
  assertDrugRecommendation,
} from '../test-utils';

/**
 * VKORC1 Analyzer Tests
 * 
 * Clinical Context:
 * - VKORC1 is the target enzyme for warfarin
 * - rs9923231 (-1639G>A) is the key variant
 * - Genotype strongly predicts warfarin sensitivity
 * 
 * References:
 * - CPIC Guideline: CYP2C9 and VKORC1 genotypes and warfarin dosing
 * - PMID: 21716271
 */

// Mock analyzer - replace with actual import
import { analyzeVKORC1 } from '@/analysis/analyzers/vkorc1-analyzer';
const analyzeVKORC1 = (genotype: any) => {
  return {
    gene: 'VKORC1',
    genotype: 'GG',
    phenotype: 'Normal Sensitivity',
    warfarinDoseGroup: 'High',
  };
};

describe('VKORC1 Analyzer', () => {
  describe('Basic Functionality', () => {
    it('should analyze GG genotype (high dose) correctly', () => {
      const result = analyzeVKORC1(VKORC1_TEST_GENOTYPES.GG);

      expect(result.gene).toBe('VKORC1');
      expect(result.genotype).toBe('GG');
      expect(result.phenotype).toBe('Normal Sensitivity');
      expect(result.warfarinDoseGroup).toBe('High');
    });

    it('should analyze AG genotype (medium dose) correctly', () => {
      const result = analyzeVKORC1(VKORC1_TEST_GENOTYPES.AG);

      expect(result.genotype).toBe('AG');
      expect(result.phenotype).toBe('Intermediate Sensitivity');
      expect(result.warfarinDoseGroup).toBe('Medium');
    });

    it('should analyze AA genotype (low dose) correctly', () => {
      const result = analyzeVKORC1(VKORC1_TEST_GENOTYPES.AA);

      expect(result.genotype).toBe('AA');
      expect(result.phenotype).toBe('High Sensitivity');
      expect(result.warfarinDoseGroup).toBe('Low');
    });
  });

  describe('Warfarin Dosing Guidance', () => {
    it('should provide standard dose recommendation for GG', () => {
      const result = analyzeVKORC1(VKORC1_TEST_GENOTYPES.GG);

      expect(result.recommendation).toBeDefined();
      expect(result.recommendation.message).toContain('standard');
    });

    it('should provide reduced dose recommendation for AG', () => {
      const result = analyzeVKORC1(VKORC1_TEST_GENOTYPES.AG);

      expect(result.recommendation.message).toContain('reduce');
      expect(result.recommendation.level).toBe('caution');
    });

    it('should provide significant reduction for AA', () => {
      const result = analyzeVKORC1(VKORC1_TEST_GENOTYPES.AA);

      expect(result.recommendation.message).toContain('reduce');
      expect(result.recommendation.level).toBe('warning');
    });
  });

  describe('Integration with CYP2C9', () => {
    it('should note that combined CYP2C9/VKORC1 analysis improves prediction', () => {
      const result = analyzeVKORC1(VKORC1_TEST_GENOTYPES.AA);

      expect(result.note).toContain('CYP2C9');
      expect(result.note).toContain('combined');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing data', () => {
      const result = analyzeVKORC1(null);

      expect(result.phenotype).toBe('Unknown');
      expect(result).toHaveProperty('warning');
    });

    it('should handle invalid genotypes', () => {
      const result = analyzeVKORC1({ rsid: 'rs9923231', genotype: 'XX' });

      expect(result.phenotype).toBe('Unknown');
    });
  });

  describe('Clinical Validation', () => {
    it('should include CPIC guideline reference', () => {
      const result = analyzeVKORC1(VKORC1_TEST_GENOTYPES.GG);

      expect(result.guidelines).toContain('CPIC');
    });

    it('should include evidence citations', () => {
      const result = analyzeVKORC1(VKORC1_TEST_GENOTYPES.GG);

      expect(result.references).toBeInstanceOf(Array);
      expect(result.references.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    it('should return all required fields', () => {
      const result = analyzeVKORC1(VKORC1_TEST_GENOTYPES.GG);

      const requiredFields = [
        'gene',
        'genotype',
        'phenotype',
        'warfarinDoseGroup',
        'recommendation',
        'guidelines',
        'references',
      ];

      assertAnalyzerResult(result, requiredFields);
    });
  });
});

