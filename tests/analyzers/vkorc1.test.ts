import { describe, it, expect } from 'vitest';
import { analyzeVKORC1 } from '@/analysis/analyzers/vkorc1-analyzer';
import {
  VKORC1_TEST_GENOTYPES,
  assertAnalyzerResult,
} from '../test-utils';

/**
 * VKORC1 Analyzer Tests - v2 API
 * 
 * Clinical Context:
 * - VKORC1 is the target enzyme for warfarin (vitamin K epoxide reductase)
 * - rs9923231 (-1639G>A) is the key variant affecting warfarin sensitivity
 * - Genotype strongly predicts warfarin dose requirements
 * 
 * Clinical Evidence:
 * - CPIC Guideline for CYP2C9/VKORC1 and warfarin dosing
 * - PMID: 21716271 (Johnson et al., 2011)
 * - PMID: 25614430 (2015 update)
 * 
 * ClinVar References:
 * - rs9923231: VCV000015161 (VKORC1 -1639G>A)
 */

describe('VKORC1 Analyzer', () => {
  describe('Basic Functionality', () => {
    it('should analyze GG genotype (normal sensitivity - high dose) correctly', () => {
      // GG = Low sensitivity = needs HIGH warfarin doses
      const result = analyzeVKORC1([VKORC1_TEST_GENOTYPES.GG]);

      expect(result.gene).toBe('VKORC1');
      expect(result.genotype.rs9923231).toBe('GG');
      expect(result.genotype.phenotype).toBe('Low Sensitivity');
      expect(result.confidence).toBe('high');
    });

    it('should analyze AG genotype (intermediate sensitivity) correctly', () => {
      const result = analyzeVKORC1([VKORC1_TEST_GENOTYPES.AG]);

      expect(result.genotype.rs9923231).toBe('AG');
      expect(result.genotype.phenotype).toBe('Intermediate Sensitivity');
    });

    it('should analyze AA genotype (high sensitivity - low dose) correctly', () => {
      // AA = High sensitivity = needs LOW warfarin doses to avoid bleeding
      const result = analyzeVKORC1([VKORC1_TEST_GENOTYPES.AA]);

      expect(result.genotype.rs9923231).toBe('AA');
      expect(result.genotype.phenotype).toBe('High Sensitivity');
    });
  });

  describe('Warfarin Dosing Guidance', () => {
    it('should provide warfarinDosing field for GG (low sensitivity)', () => {
      const result = analyzeVKORC1([VKORC1_TEST_GENOTYPES.GG]);

      expect(result.warfarinDosing).toBeDefined();
      expect(result.warfarinDosing.estimatedDose).toBeDefined();
    });

    it('should provide warfarinDosing for AG', () => {
      const result = analyzeVKORC1([VKORC1_TEST_GENOTYPES.AG]);

      expect(result.warfarinDosing).toBeDefined();
    });

    it('should provide warfarinDosing for AA (high sensitivity)', () => {
      const result = analyzeVKORC1([VKORC1_TEST_GENOTYPES.AA]);

      expect(result.warfarinDosing).toBeDefined();
    });
  });

  describe('Drug Recommendations', () => {
    it('should include warfarin drug recommendations', () => {
      const result = analyzeVKORC1([VKORC1_TEST_GENOTYPES.AA]);

      expect(result.drugs).toBeDefined();
      expect(result.drugs.length).toBeGreaterThan(0);

      const warfarinRec = result.drugs.find(d => d.drug.toLowerCase().includes('warfarin'));
      expect(warfarinRec).toBeDefined();
    });
  });

  describe('Integration with CYP2C9', () => {
    it('should calculate combined risk when CYP2C9 diplotype is provided', () => {
      const result = analyzeVKORC1(
        [VKORC1_TEST_GENOTYPES.AA],
        '23andme',
        { allele1: '*1', allele2: '*3', phenotype: 'Intermediate Metabolizer' }
      );

      expect(result.combinedRisk).toBeDefined();
      expect(result.combinedRisk?.cyp2c9Diplotype).toBe('*1/*3');
    });

    it('should calculate risk for poor CYP2C9 metabolizers', () => {
      const result = analyzeVKORC1(
        [VKORC1_TEST_GENOTYPES.AA],
        '23andme',
        { allele1: '*3', allele2: '*3', phenotype: 'Poor Metabolizer' }
      );

      expect(result.combinedRisk).toBeDefined();
      // Check combined risk is calculated
      expect(['Normal', 'Moderate', 'High', 'Very High']).toContain(result.combinedRisk?.combinedRisk);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty genotype array', () => {
      const result = analyzeVKORC1([]);

      expect(result.genotype.phenotype).toBe('Unknown');
      expect(result.confidence).toBe('low');
    });

    it('should handle missing rs9923231', () => {
      const result = analyzeVKORC1([{ rsid: 'rs12345', genotype: 'AA' }]);

      expect(result.genotype.phenotype).toBe('Unknown');
    });

    it('should handle invalid genotypes gracefully', () => {
      const result = analyzeVKORC1([{ rsid: 'rs9923231', genotype: 'XX' }]);

      // Should not crash, should return safe default
      expect(result).toBeDefined();
      expect(result.gene).toBe('VKORC1');
    });
  });

  describe('Clinical Validation', () => {
    it('should include CPIC guideline reference', () => {
      const result = analyzeVKORC1([VKORC1_TEST_GENOTYPES.GG]);

      expect(result.guidelines).toBeDefined();
      expect(result.guidelines.cpic).toBeDefined();
    });

    it('should include FDA labeling reference', () => {
      const result = analyzeVKORC1([VKORC1_TEST_GENOTYPES.GG]);

      expect(result.guidelines.fda).toBeDefined();
      expect(result.guidelines.fda.length).toBeGreaterThan(0);
    });
  });

  describe('Safety Alerts', () => {
    it('should generate safety alerts for high sensitivity genotype', () => {
      const result = analyzeVKORC1([VKORC1_TEST_GENOTYPES.AA]);

      expect(result.safetyAlerts).toBeDefined();
      expect(result.safetyAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    it('should return all required fields for v2 API', () => {
      const result = analyzeVKORC1([VKORC1_TEST_GENOTYPES.GG]);

      const requiredFields = [
        'gene',
        'genotype',
        'drugs',
        'warfarinDosing',
        'safetyAlerts',
        'confidence',
        'guidelines',
      ];

      assertAnalyzerResult(result, requiredFields);
    });

    it('should include genotype sub-fields', () => {
      const result = analyzeVKORC1([VKORC1_TEST_GENOTYPES.GG]);

      expect(result.genotype).toHaveProperty('rs9923231');
      expect(result.genotype).toHaveProperty('phenotype');
      expect(result.genotype).toHaveProperty('sensitivityScore');
      expect(result.genotype).toHaveProperty('confidence');
    });
  });

  describe('Genotype Normalization', () => {
    it('should normalize GA to AG', () => {
      // Genotype normalization sorts alphabetically: GA -> AG
      const result = analyzeVKORC1([{ rsid: 'rs9923231', genotype: 'GA' }]);

      expect(result.genotype.rs9923231).toBe('AG');
      expect(result.genotype.phenotype).toBe('Intermediate Sensitivity');
    });
  });
});
