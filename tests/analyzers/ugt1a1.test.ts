/**
 * UGT1A1 ANALYZER TESTS
 *
 * Tests for the UGT1A1 pharmacogenomics analyzer
 * Covers Gilbert syndrome, irinotecan toxicity, and cabotegravir metabolism
 *
 * Test structure:
 * 1. Basic diplotype calling
 * 2. Phenotype determination
 * 3. Drug recommendations (irinotecan, cabotegravir)
 * 4. Gilbert syndrome detection
 * 5. Clinical validation against CPIC guidelines
 */

import { describe, it, expect } from 'vitest';
import { analyzeUGT1A1 } from '@analysis/analyzers/ugt1a1-analyzer';
import { createTestGenotype, createTestGenotypes } from '@tests/test-utils';

describe('UGT1A1 Analyzer', () => {

  // ==========================================================================
  // BASIC FUNCTIONALITY
  // ==========================================================================

  describe('Basic Functionality', () => {
    it('should return proper structure with required fields', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GG' }
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result).toHaveProperty('gene', 'UGT1A1');
      expect(result).toHaveProperty('diplotype');
      expect(result.diplotype).toHaveProperty('allele1');
      expect(result.diplotype).toHaveProperty('allele2');
      expect(result.diplotype).toHaveProperty('phenotype');
      expect(result.diplotype).toHaveProperty('activityScore');
      expect(result).toHaveProperty('drugs');
      expect(result).toHaveProperty('gilbertSyndrome');
      expect(result).toHaveProperty('clinicalSummary');
      expect(result).toHaveProperty('safetyAlerts');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('limitations');
      expect(result).toHaveProperty('guidelines');
    });

    it('should handle empty genotype array', () => {
      const result = analyzeUGT1A1([]);

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*1');
      expect(result.diplotype.phenotype).toBe('Normal Metabolizer');
      expect(result.confidence).toBe('low');
    });

    it('should handle missing SNPs gracefully', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs1234567', genotype: 'AA' } // irrelevant SNP
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*1');
      expect(result.diplotype.phenotype).toBe('Normal Metabolizer');
    });
  });

  // ==========================================================================
  // DIPLOTYPE CALLING - *6 (rs4148323)
  // ==========================================================================

  describe('Diplotype Calling - *6 Allele', () => {
    it('should detect *1/*1 from rs4148323 GG', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GG' }
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*1');
      expect(result.diplotype.phenotype).toBe('Normal Metabolizer');
      expect(result.diplotype.activityScore).toBe(2.0);
    });

    it('should detect *1/*6 from rs4148323 GA', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GA' }
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*6');
      expect(result.diplotype.phenotype).toBe('Intermediate Metabolizer');
      expect(result.diplotype.activityScore).toBe(1.3);
    });

    it('should detect *6/*6 from rs4148323 AA', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'AA' }
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.allele1).toBe('*6');
      expect(result.diplotype.allele2).toBe('*6');
      expect(result.diplotype.phenotype).toBe('Poor Metabolizer');
      expect(result.diplotype.activityScore).toBe(0.6);
    });
  });

  // ==========================================================================
  // DIPLOTYPE CALLING - *27 (rs887829)
  // ==========================================================================

  describe('Diplotype Calling - *27 Allele', () => {
    it('should detect *1/*1 from rs887829 CC', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs887829', genotype: 'CC' }
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*1');
      expect(result.diplotype.phenotype).toBe('Normal Metabolizer');
      expect(result.diplotype.activityScore).toBe(2.0);
    });

    it('should detect *1/*27 from rs887829 CT', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs887829', genotype: 'CT' }
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*27');
      expect(result.diplotype.phenotype).toBe('Intermediate Metabolizer');
      expect(result.diplotype.activityScore).toBe(1.5);
    });

    it('should detect *27/*27 from rs887829 TT', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs887829', genotype: 'TT' }
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.allele1).toBe('*27');
      expect(result.diplotype.allele2).toBe('*27');
      expect(result.diplotype.phenotype).toBe('Intermediate Metabolizer');
      expect(result.diplotype.activityScore).toBe(1.0);
    });
  });

  // ==========================================================================
  // PHENOTYPE DETERMINATION
  // ==========================================================================

  describe('Phenotype Determination', () => {
    it('should classify activity score 0.6 as Poor Metabolizer', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'AA' } // *6/*6 = 0.6
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.activityScore).toBe(0.6);
      expect(result.diplotype.phenotype).toBe('Poor Metabolizer');
    });

    it('should classify activity score 1.3 as Intermediate Metabolizer', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GA' } // *1/*6 = 1.3
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.activityScore).toBe(1.3);
      expect(result.diplotype.phenotype).toBe('Intermediate Metabolizer');
    });

    it('should classify activity score 2.0 as Normal Metabolizer', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GG' } // *1/*1 = 2.0
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.activityScore).toBe(2.0);
      expect(result.diplotype.phenotype).toBe('Normal Metabolizer');
    });
  });

  // ==========================================================================
  // DRUG RECOMMENDATIONS - IRINOTECAN
  // ==========================================================================

  describe('Drug Recommendations - Irinotecan', () => {
    it('should recommend 30% dose reduction for poor metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'AA' } // *6/*6
      ]);

      const result = analyzeUGT1A1(genotypes);

      const irinotecan = result.drugs.find(d => d.drug.includes('Irinotecan'));
      expect(irinotecan).toBeDefined();
      expect(irinotecan?.riskLevel).toBe('critical');
      expect(irinotecan?.doseAdjustment).toContain('30%');
      expect(irinotecan?.fdaLabel).toBe(true);
      expect(irinotecan?.cpicLevel).toBe('A');
    });

    it('should recommend monitoring for intermediate metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GA' } // *1/*6
      ]);

      const result = analyzeUGT1A1(genotypes);

      const irinotecan = result.drugs.find(d => d.drug.includes('Irinotecan'));
      expect(irinotecan).toBeDefined();
      expect(irinotecan?.riskLevel).toBe('warning');
      expect(irinotecan?.recommendation).toContain('Increased risk');
    });

    it('should recommend standard dosing for normal metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GG' } // *1/*1
      ]);

      const result = analyzeUGT1A1(genotypes);

      const irinotecan = result.drugs.find(d => d.drug.includes('Irinotecan'));
      expect(irinotecan).toBeDefined();
      expect(irinotecan?.riskLevel).toBe('standard');
      expect(irinotecan?.recommendation).toContain('Standard');
    });
  });

  // ==========================================================================
  // DRUG RECOMMENDATIONS - CABOTEGRAVIR
  // ==========================================================================

  describe('Drug Recommendations - Cabotegravir (Apretude)', () => {
    it('should warn about increased levels for poor metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'AA' } // *6/*6
      ]);

      const result = analyzeUGT1A1(genotypes);

      const cabotegravir = result.drugs.find(d => d.drug.includes('Cabotegravir'));
      expect(cabotegravir).toBeDefined();
      expect(cabotegravir?.riskLevel).toBe('moderate');
      expect(cabotegravir?.recommendation).toContain('INCREASED cabotegravir levels');
      expect(cabotegravir?.doseAdjustment).toContain('Enhanced monitoring');
    });

    it('should note slightly increased exposure for intermediate metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GA' } // *1/*6
      ]);

      const result = analyzeUGT1A1(genotypes);

      const cabotegravir = result.drugs.find(d => d.drug.includes('Cabotegravir'));
      expect(cabotegravir).toBeDefined();
      expect(cabotegravir?.riskLevel).toBe('moderate');
      expect(cabotegravir?.recommendation).toContain('increased cabotegravir exposure');
    });

    it('should recommend standard dosing for normal metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GG' } // *1/*1
      ]);

      const result = analyzeUGT1A1(genotypes);

      const cabotegravir = result.drugs.find(d => d.drug.includes('Cabotegravir'));
      expect(cabotegravir).toBeDefined();
      expect(cabotegravir?.riskLevel).toBe('standard');
      expect(cabotegravir?.recommendation).toContain('Standard metabolism');
      expect(cabotegravir?.doseAdjustment).toContain('600mg IM every 2 months');
    });
  });

  // ==========================================================================
  // GILBERT SYNDROME
  // ==========================================================================

  describe('Gilbert Syndrome Detection', () => {
    it('should detect Gilbert syndrome in *6/*6 poor metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'AA' } // *6/*6
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.gilbertSyndrome.status).toBe('Positive');
      expect(result.gilbertSyndrome.clinicalSignificance).toContain('GILBERT SYNDROME');
      expect(result.gilbertSyndrome.clinicalSignificance).toContain('Benign');
    });

    it('should detect carrier status in heterozygotes', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GA' } // *1/*6
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.gilbertSyndrome.status).toBe('Carrier');
      expect(result.gilbertSyndrome.clinicalSignificance).toContain('Carrier');
    });

    it('should report negative for normal metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GG' } // *1/*1
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.gilbertSyndrome.status).toBe('Negative');
      expect(result.gilbertSyndrome.clinicalSignificance).toContain('No Gilbert syndrome');
    });
  });

  // ==========================================================================
  // SAFETY ALERTS
  // ==========================================================================

  describe('Safety Alerts', () => {
    it('should generate multiple alerts for poor metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'AA' } // *6/*6
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.safetyAlerts.length).toBeGreaterThan(0);
      expect(result.safetyAlerts.some(alert => alert.includes('IRINOTECAN'))).toBe(true);
      expect(result.safetyAlerts.some(alert => alert.includes('CABOTEGRAVIR'))).toBe(true);
      expect(result.safetyAlerts.some(alert => alert.includes('Gilbert'))).toBe(true);
    });

    it('should generate moderate alerts for intermediate metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GA' } // *1/*6
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.safetyAlerts.length).toBeGreaterThan(0);
      expect(result.safetyAlerts.some(alert => alert.includes('IRINOTECAN'))).toBe(true);
    });

    it('should generate no alerts for normal metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GG' } // *1/*1
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.safetyAlerts.length).toBe(0);
    });
  });

  // ==========================================================================
  // CONFIDENCE SCORING
  // ==========================================================================

  describe('Confidence Scoring', () => {
    it('should report medium confidence when key SNP is present', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GA' }
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.confidence).toBe('medium');
    });

    it('should report low confidence for default *1/*1 with no data', () => {
      const genotypes: Array<{ rsid: string; genotype: string }> = [];

      const result = analyzeUGT1A1(genotypes);

      expect(result.confidence).toBe('low');
      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*1');
    });
  });

  // ==========================================================================
  // CLINICAL VALIDATION (CPIC)
  // ==========================================================================

  describe('Clinical Validation', () => {
    it('should include CPIC guideline reference', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GG' }
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.guidelines.cpic).toContain('CPIC');
      expect(result.guidelines.cpic).toContain('PMID: 15883587');
    });

    it('should include FDA label information', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GG' }
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.guidelines.fda.length).toBeGreaterThan(0);
      expect(result.guidelines.fda.some(label => label.includes('Irinotecan'))).toBe(true);
    });

    it('should mark irinotecan as FDA-labeled', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'AA' } // *6/*6
      ]);

      const result = analyzeUGT1A1(genotypes);

      const irinotecan = result.drugs.find(d => d.drug.includes('Irinotecan'));
      expect(irinotecan?.fdaLabel).toBe(true);
      expect(irinotecan?.cpicLevel).toBe('A');
    });
  });

  // ==========================================================================
  // LIMITATIONS
  // ==========================================================================

  describe('Limitations', () => {
    it('should warn about *28 detection limitations', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GG' }
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.limitations.some(lim =>
        lim.includes('*28') && lim.includes('TA repeat')
      )).toBe(true);
    });

    it('should note SNP array limitations for consumer tests', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GG' }
      ]);

      const result = analyzeUGT1A1(genotypes, '23andme');

      expect(result.limitations.some(lim =>
        lim.includes('Consumer') || lim.includes('rare')
      )).toBe(true);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle unnormalized genotypes', () => {
      const genotypes = [
        { rsid: 'rs4148323', genotype: 'a g' }, // spaces, lowercase
      ];

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*6');
      expect(result.diplotype.phenotype).toBe('Intermediate Metabolizer');
    });

    it('should handle reversed genotypes', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'AG' } // should be same as GA
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*6');
    });

    it('should handle null genotypes', () => {
      const genotypes = [
        { rsid: 'rs4148323', genotype: null as any }
      ];

      const result = analyzeUGT1A1(genotypes);

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*1');
    });
  });

  // ==========================================================================
  // CLINICAL SUMMARY
  // ==========================================================================

  describe('Clinical Summary', () => {
    it('should generate comprehensive summary for poor metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'AA' } // *6/*6
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.clinicalSummary).toContain('*6/*6');
      expect(result.clinicalSummary).toContain('Poor Metabolizer');
      expect(result.clinicalSummary).toContain('Activity Score: 0.6');
      expect(result.clinicalSummary).toContain('Irinotecan');
      expect(result.clinicalSummary).toContain('Cabotegravir');
      expect(result.clinicalSummary).toContain('Gilbert Syndrome');
    });

    it('should generate appropriate summary for normal metabolizers', () => {
      const genotypes = createTestGenotypes([
        { rsid: 'rs4148323', genotype: 'GG' } // *1/*1
      ]);

      const result = analyzeUGT1A1(genotypes);

      expect(result.clinicalSummary).toContain('*1/*1');
      expect(result.clinicalSummary).toContain('Normal Metabolizer');
      expect(result.clinicalSummary).toContain('Activity Score: 2.0');
      expect(result.clinicalSummary).toContain('Standard dosing');
    });
  });
});
