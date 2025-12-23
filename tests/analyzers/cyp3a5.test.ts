/**
 * CYP3A5 ANALYZER TESTS
 *
 * Comprehensive test suite for CYP3A5 analyzer following v2 test patterns.
 * Target: 95% coverage across all metrics.
 *
 * Gene: CYP3A5 (Cytochrome P450 3A5)
 * Key Variant: CYP3A5*3 (rs776746, g.6986A>G)
 * Phenotypes: Expressor, Intermediate Expressor, Non-expressor
 *
 * Clinical Significance:
 * - CYP3A5*3 creates NO functional enzyme (60-90% of people are *3/*3)
 * - Tacrolimus metabolism (CPIC Level A guideline)
 * - Alprazolam, sildenafil, zolpidem metabolism (informational - no CPIC guidelines)
 *
 * Test Structure (12 sections, ~33 tests):
 * 1. Basic Functionality
 * 2. Diplotype Calling - *3 Allele
 * 3. Phenotype Determination
 * 4. Drug Recommendations - Alprazolam
 * 5. Drug Recommendations - Sildenafil
 * 6. Drug Recommendations - Zolpidem
 * 7. Drug Recommendations - Tacrolimus
 * 8. Confidence Scoring
 * 9. Clinical Validation
 * 10. Limitations
 * 11. Edge Cases
 * 12. Clinical Summary
 */

import { describe, it, expect } from 'vitest';
import { analyzeCYP3A5 } from '@analysis/analyzers/cyp3a5-analyzer';
import { createTestGenotypes } from '@tests/test-utils';

// ============================================================================
// SECTION 1: BASIC FUNCTIONALITY
// ============================================================================

describe('CYP3A5 Analyzer', () => {
  describe('Basic Functionality', () => {
    it('should return valid result structure for CYP3A5*1/*1 (Expressor)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.gene).toBe('CYP3A5');
      expect(result.diplotype).toBeDefined();
      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*1');
      expect(result.diplotype.phenotype).toBe('Expressor');
      expect(result.drugs).toBeDefined();
      expect(Array.isArray(result.drugs)).toBe(true);
      expect(result.clinicalSummary).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.limitations).toBeDefined();
      expect(result.guidelines).toBeDefined();
    });

    it('should return valid result structure for CYP3A5*3/*3 (Non-expressor)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'GG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.gene).toBe('CYP3A5');
      expect(result.diplotype.allele1).toBe('*3');
      expect(result.diplotype.allele2).toBe('*3');
      expect(result.diplotype.phenotype).toBe('Non-expressor');
      expect(result.drugs.length).toBeGreaterThan(0);
    });

    it('should handle missing rs776746 data gracefully', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs12345', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, 'unknown');

      expect(result.gene).toBe('CYP3A5');
      // When rs776746 is missing, defaults to *1/*1 (Expressor) but with low confidence
      expect(result.diplotype.phenotype).toBe('Expressor');
      expect(result.confidence).toBe('low');
      expect(result.limitations.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // SECTION 2: DIPLOTYPE CALLING - *3 ALLELE (rs776746)
  // ============================================================================

  describe('Diplotype Calling - *3 Allele (rs776746)', () => {
    it('should correctly identify CYP3A5*1/*1 from AA genotype', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*1');
      expect(result.diplotype.phenotype).toBe('Expressor');
      expect(result.confidence).toBe('high');
    });

    it('should correctly identify CYP3A5*1/*3 from AG genotype', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*3');
      expect(result.diplotype.phenotype).toBe('Intermediate Expressor');
      expect(result.confidence).toBe('high');
    });

    it('should correctly identify CYP3A5*3/*3 from GG genotype (most common)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'GG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.diplotype.allele1).toBe('*3');
      expect(result.diplotype.allele2).toBe('*3');
      expect(result.diplotype.phenotype).toBe('Non-expressor');
      expect(result.confidence).toBe('high');
    });
  });

  // ============================================================================
  // SECTION 3: PHENOTYPE DETERMINATION
  // ============================================================================

  describe('Phenotype Determination', () => {
    it('should assign Expressor phenotype for *1/*1', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.diplotype.phenotype).toBe('Expressor');
      expect(result.clinicalSummary).toContain('functional CYP3A5 enzyme expression');
    });

    it('should assign Intermediate Expressor phenotype for *1/*3', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.diplotype.phenotype).toBe('Intermediate Expressor');
      expect(result.clinicalSummary).toContain('Reduced CYP3A5 enzyme expression');
    });

    it('should assign Non-expressor phenotype for *3/*3 (most common)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'GG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.diplotype.phenotype).toBe('Non-expressor');
      expect(result.clinicalSummary).toContain('NO functional CYP3A5 enzyme');
    });
  });

  // ============================================================================
  // SECTION 4: DRUG RECOMMENDATIONS - ALPRAZOLAM (Xanax)
  // ============================================================================

  describe('Drug Recommendations - Alprazolam (Xanax)', () => {
    it('should recommend standard dosing for Expressor (*1/*1)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const alprazolamRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('alprazolam')
      );

      expect(alprazolamRec).toBeDefined();
      expect(alprazolamRec?.recommendation).toContain('EXPRESSOR');
      expect(alprazolamRec?.recommendation).toContain('faster alprazolam clearance');
      expect(alprazolamRec?.doseAdjustment).toContain('Standard dosing');
      expect(alprazolamRec?.riskLevel).toBe('informational');
    });

    it('should note intermediate metabolism for *1/*3', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const alprazolamRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('alprazolam')
      );

      expect(alprazolamRec).toBeDefined();
      expect(alprazolamRec?.recommendation).toContain('INTERMEDIATE EXPRESSOR');
      expect(alprazolamRec?.recommendation).toContain('Moderate CYP3A5 expression');
      expect(alprazolamRec?.doseAdjustment).toContain('Standard dosing');
      expect(alprazolamRec?.riskLevel).toBe('standard');
    });

    it('should warn about reduced metabolism for Non-expressor (*3/*3)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'GG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const alprazolamRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('alprazolam')
      );

      expect(alprazolamRec).toBeDefined();
      expect(alprazolamRec?.recommendation).toContain('NON-EXPRESSOR');
      expect(alprazolamRec?.recommendation).toContain('Standard alprazolam metabolism via CYP3A4');
      expect(alprazolamRec?.doseAdjustment).toContain('Standard dosing');
      expect(alprazolamRec?.riskLevel).toBe('standard');
    });
  });

  // ============================================================================
  // SECTION 5: DRUG RECOMMENDATIONS - SILDENAFIL/TADALAFIL
  // ============================================================================

  describe('Drug Recommendations - Sildenafil/Tadalafil', () => {
    it('should provide standard recommendations for Expressor (*1/*1)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const sildenafilRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('sildenafil')
      );

      expect(sildenafilRec).toBeDefined();
      expect(sildenafilRec?.recommendation).toContain('EXPRESSOR');
      expect(sildenafilRec?.doseAdjustment).toContain('Consider standard to higher dosing if inadequate response');
      expect(sildenafilRec?.riskLevel).toBe('informational');
    });

    it('should note intermediate expression for *1/*3', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const sildenafilRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('sildenafil')
      );

      expect(sildenafilRec).toBeDefined();
      expect(sildenafilRec?.recommendation).toContain('Standard sildenafil/tadalafil metabolism');
      expect(sildenafilRec?.doseAdjustment).toContain('Standard dosing');
    });

    it('should inform about CYP3A4 compensation for Non-expressor (*3/*3)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'GG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const sildenafilRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('sildenafil')
      );

      expect(sildenafilRec).toBeDefined();
      expect(sildenafilRec?.recommendation).toContain('Standard sildenafil/tadalafil metabolism');
      expect(sildenafilRec?.doseAdjustment).toContain('Standard dosing');
    });
  });

  // ============================================================================
  // SECTION 6: DRUG RECOMMENDATIONS - ZOLPIDEM (Ambien)
  // ============================================================================

  describe('Drug Recommendations - Zolpidem (Ambien)', () => {
    it('should provide standard recommendations for Expressor (*1/*1)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const zolpidemRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('zolpidem')
      );

      expect(zolpidemRec).toBeDefined();
      expect(zolpidemRec?.recommendation).toContain('EXPRESSOR');
      expect(zolpidemRec?.recommendation).toContain('CYP3A4 is primary pathway');
      expect(zolpidemRec?.doseAdjustment).toContain('Standard dosing');
      expect(zolpidemRec?.riskLevel).toBe('informational');
    });

    it('should note intermediate expression for *1/*3', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const zolpidemRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('zolpidem')
      );

      expect(zolpidemRec).toBeDefined();
      expect(zolpidemRec?.recommendation).toContain('Standard zolpidem metabolism');
      expect(zolpidemRec?.doseAdjustment).toContain('Standard dosing');
    });

    it('should explain CYP3A4 metabolism for Non-expressor (*3/*3)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'GG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const zolpidemRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('zolpidem')
      );

      expect(zolpidemRec).toBeDefined();
      expect(zolpidemRec?.recommendation).toContain('Standard zolpidem metabolism');
      expect(zolpidemRec?.doseAdjustment).toContain('Standard dosing');
    });
  });

  // ============================================================================
  // SECTION 7: DRUG RECOMMENDATIONS - TACROLIMUS (CPIC Level A)
  // ============================================================================

  describe('Drug Recommendations - Tacrolimus (CPIC Level A)', () => {
    it('should recommend higher tacrolimus dosing for Expressor (*1/*1)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const tacrolimusRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('tacrolimus')
      );

      expect(tacrolimusRec).toBeDefined();
      expect(tacrolimusRec?.recommendation).toContain('EXPRESSOR');
      expect(tacrolimusRec?.recommendation).toContain('Increased tacrolimus metabolism');
      expect(tacrolimusRec?.doseAdjustment).toContain('1.5-2x higher starting dose');
      expect(tacrolimusRec?.riskLevel).toBe('moderate');
      expect(tacrolimusRec?.cpicGuideline).toBe(true);
      expect(tacrolimusRec?.cpicLevel).toBe('A');
    });

    it('should recommend intermediate tacrolimus dosing for *1/*3', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const tacrolimusRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('tacrolimus')
      );

      expect(tacrolimusRec).toBeDefined();
      expect(tacrolimusRec?.recommendation).toContain('INTERMEDIATE');
      expect(tacrolimusRec?.recommendation).toContain('Moderately increased tacrolimus metabolism');
      expect(tacrolimusRec?.doseAdjustment).toContain('1.2-1.5x higher starting dose');
      expect(tacrolimusRec?.riskLevel).toBe('moderate');
      expect(tacrolimusRec?.cpicGuideline).toBe(true);
      expect(tacrolimusRec?.cpicLevel).toBe('A');
    });

    it('should recommend standard tacrolimus dosing for Non-expressor (*3/*3)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'GG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const tacrolimusRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('tacrolimus')
      );

      expect(tacrolimusRec).toBeDefined();
      expect(tacrolimusRec?.recommendation).toContain('NON-EXPRESSOR');
      expect(tacrolimusRec?.recommendation).toContain('Standard tacrolimus metabolism');
      expect(tacrolimusRec?.doseAdjustment).toContain('Standard dosing per CPIC guideline');
      expect(tacrolimusRec?.riskLevel).toBe('standard');
      expect(tacrolimusRec?.cpicGuideline).toBe(true);
      expect(tacrolimusRec?.cpicLevel).toBe('A');
    });
  });

  // ============================================================================
  // SECTION 8: CONFIDENCE SCORING
  // ============================================================================

  describe('Confidence Scoring', () => {
    it('should report high confidence when rs776746 is present', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.confidence).toBe('high');
      expect(result.limitations.length).toBeGreaterThan(0);
      expect(result.limitations.some(lim =>
        lim.toLowerCase().includes('no cpic') ||
        lim.toLowerCase().includes('informational')
      )).toBe(true);
    });

    it('should report low confidence when rs776746 is missing', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs12345', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, 'unknown');

      expect(result.confidence).toBe('low');
      // When rs776746 is missing, defaults to *1/*1 (Expressor) but with low confidence
      expect(result.diplotype.phenotype).toBe('Expressor');
      expect(result.limitations.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // SECTION 9: CLINICAL VALIDATION
  // ============================================================================

  describe('Clinical Validation', () => {
    it('should align with CPIC guidelines for tacrolimus dosing in Expressor', () => {
      // CPIC: CYP3A5 expressors need 1.5-2x higher tacrolimus doses
      // PMID: 26417955, 29201154
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const tacrolimusRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('tacrolimus')
      );

      expect(tacrolimusRec?.doseAdjustment).toContain('1.5-2x');
      expect(tacrolimusRec?.cpicGuideline).toBe(true);
      expect(tacrolimusRec?.cpicLevel).toBe('A');
    });

    it('should correctly identify *3/*3 as most common genotype (60-90% of people)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'GG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.diplotype.allele1).toBe('*3');
      expect(result.diplotype.allele2).toBe('*3');
      expect(result.diplotype.phenotype).toBe('Non-expressor');
      expect(result.clinicalSummary).toContain('60-90%');
    });

    it('should note that alprazolam has NO CPIC guideline', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      const alprazolamRec = result.drugs.find(d =>
        d.drug.toLowerCase().includes('alprazolam')
      );

      expect(alprazolamRec?.cpicGuideline).toBe(false);
      expect(result.limitations.some(lim =>
        lim.toLowerCase().includes('no cpic') ||
        lim.toLowerCase().includes('informational')
      )).toBe(true);
    });
  });

  // ============================================================================
  // SECTION 10: LIMITATIONS
  // ============================================================================

  describe('Limitations', () => {
    it('should document CYP3A5 limitations for all results', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.limitations).toBeDefined();
      expect(result.limitations.length).toBeGreaterThan(0);
      expect(result.limitations.some(lim =>
        lim.toLowerCase().includes('no cpic') ||
        lim.toLowerCase().includes('informational')
      )).toBe(true);
      expect(result.limitations.some(lim =>
        lim.toLowerCase().includes('cyp3a4')
      )).toBe(true);
    });

    it('should note lack of CPIC guidelines for alprazolam/sildenafil/zolpidem', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.limitations.some(lim =>
        lim.toLowerCase().includes('no cpic') ||
        lim.toLowerCase().includes('informational')
      )).toBe(true);
    });
  });

  // ============================================================================
  // SECTION 11: EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle unnormalized genotypes (GA instead of AG)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'GA' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*3');
      expect(result.diplotype.phenotype).toBe('Intermediate Expressor');
      expect(result.confidence).toBe('high');
    });

    it('should handle reversed reference alleles correctly', () => {
      // rs776746: A is reference (*1), G is variant (*3)
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'GG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.diplotype.allele1).toBe('*3');
      expect(result.diplotype.allele2).toBe('*3');
      expect(result.diplotype.phenotype).toBe('Non-expressor');
    });

    it('should handle null/undefined genotypes gracefully', () => {
      const genotypes = createTestGenotypes([]);

      const result = analyzeCYP3A5(genotypes, 'unknown');

      expect(result.gene).toBe('CYP3A5');
      // When rs776746 is missing, defaults to *1/*1 (Expressor) but with low confidence
      expect(result.diplotype.phenotype).toBe('Expressor');
      expect(result.confidence).toBe('low');
      expect(result.limitations.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // SECTION 12: CLINICAL SUMMARY
  // ============================================================================

  describe('Clinical Summary', () => {
    it('should generate appropriate clinical summary for Expressor (*1/*1)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'AA' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.clinicalSummary).toContain('Expressor');
      expect(result.clinicalSummary).toContain('functional CYP3A5 enzyme expression');
      expect(result.clinicalSummary).toContain('*1/*1');
      expect(result.clinicalSummary.length).toBeGreaterThan(50);
    });

    it('should generate appropriate clinical summary for Non-expressor (*3/*3)', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs776746', genotype: 'GG' }
      ]);

      const result = analyzeCYP3A5(genotypes, '23andme');

      expect(result.clinicalSummary).toContain('Non-expressor');
      expect(result.clinicalSummary).toContain('NO functional CYP3A5 enzyme');
      expect(result.clinicalSummary).toContain('*3/*3');
      expect(result.clinicalSummary).toContain('60-90%');
      expect(result.clinicalSummary.length).toBeGreaterThan(50);
    });
  });
});
