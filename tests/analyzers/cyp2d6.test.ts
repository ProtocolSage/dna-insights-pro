import { describe, it, expect } from 'vitest';
import { createTestGenotype, assertAnalyzerResult } from '../test-utils';

/**
 * CYP2D6 Analyzer Tests
 * 
 * Clinical Context:
 * - CYP2D6 is highly polymorphic with >100 star alleles
 * - Metabolizes ~25% of drugs (opioids, antidepressants, antipsychotics)
 * - Copy number variations (deletions/duplications) affect activity
 * - Activity scoring: *1=1.0, *4=0, *10=0.25, etc.
 * 
 * Key Challenges:
 * - Complex star allele definitions (multiple SNPs per allele)
 * - Gene deletions (*5) and duplications (xN)
 * - Phase ambiguity in some cases
 * 
 * References:
 * - PharmVar Database (www.pharmvar.org)
 * - CPIC Guideline for CYP2D6 and codeine therapy
 * - PMID: 22205192
 */

// Import actual analyzer
import { analyzeCYP2D6 } from '@analysis/analyzers/cyp2d6-analyzer';

describe('CYP2D6 Analyzer', () => {
  // ==========================================================================
  // COMMON STAR ALLELES
  // ==========================================================================

  describe('Common Star Alleles', () => {
    it('should analyze *1/*1 (wildtype) correctly', () => {
      const genotypes = [
        // *1 is defined by absence of known variants
        createTestGenotype('rs3892097', 'GG'), // Not *4 (G is reference)
        createTestGenotype('rs5030655', 'GG'), // Not *6
        createTestGenotype('rs28371725', 'CC'), // Not *41
        createTestGenotype('rs1065852', 'GG'), // Not *10
      ];

      const result = analyzeCYP2D6(genotypes);

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*1');
      expect(result.diplotype.phenotype).toBe('Normal Metabolizer');
      expect(result.diplotype.activityScore).toBe(2.0);
    });

    it('should analyze *1/*4 (intermediate) correctly', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'GA'), // Heterozygous for *4 (G ref, A alt)
        createTestGenotype('rs5030655', 'GG'),
        createTestGenotype('rs28371725', 'CC'),
        createTestGenotype('rs1065852', 'GG'),
      ];

      const result = analyzeCYP2D6(genotypes);

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*4');
      expect(result.diplotype.phenotype).toBe('Intermediate Metabolizer');
      expect(result.diplotype.activityScore).toBe(1.0); // 1.0 + 0
    });

    it('should analyze *4/*4 (poor metabolizer) correctly', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'AA'), // Homozygous *4 (A is alt allele)
        createTestGenotype('rs5030655', 'GG'),
        createTestGenotype('rs28371725', 'CC'),
        createTestGenotype('rs1065852', 'GG'),
      ];

      const result = analyzeCYP2D6(genotypes);

      expect(result.diplotype.allele1).toBe('*4');
      expect(result.diplotype.allele2).toBe('*4');
      expect(result.diplotype.phenotype).toBe('Poor Metabolizer');
      expect(result.diplotype.activityScore).toBe(0.0);
    });

    it('should analyze *1/*10 (decreased function) correctly', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'GG'),  // Not *4
        createTestGenotype('rs5030655', 'GG'),  // Not *6
        createTestGenotype('rs28371725', 'CC'), // Not *41
        createTestGenotype('rs1065852', 'GT'),  // Heterozygous *10 (G ref, T alt)
      ];

      const result = analyzeCYP2D6(genotypes);

      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*10');
      expect(result.diplotype.phenotype).toBe('Intermediate Metabolizer');
      expect(result.diplotype.activityScore).toBe(1.25); // 1.0 + 0.25
    });

    it('should analyze *10/*10 (decreased function) correctly', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'GG'),  // Not *4
        createTestGenotype('rs5030655', 'GG'),  // Not *6
        createTestGenotype('rs28371725', 'CC'), // Not *41
        createTestGenotype('rs1065852', 'TT'),  // Homozygous *10
      ];

      const result = analyzeCYP2D6(genotypes);

      expect(result.diplotype.allele1).toBe('*10');
      expect(result.diplotype.allele2).toBe('*10');
      expect(result.diplotype.phenotype).toBe('Intermediate Metabolizer');
      expect(result.diplotype.activityScore).toBe(0.5); // 0.25 + 0.25
    });
  });

  // ==========================================================================
  // GENE DELETIONS
  // ==========================================================================

  describe.skip('Gene Deletions (*5)', () => {
    // NOTE: SNP arrays (23andMe, AncestryDNA) CANNOT detect gene deletions or duplications
    // These tests are skipped as they require specialized CNV analysis
    // True CYP2D6 phenotyping with CNV detection requires targeted genotyping

    it('should detect *5 deletion (no function)', () => {
      const genotypes = [
        // *5 requires specific detection methods (CNV analysis)
        // This is challenging with SNP arrays - may need separate input
        { type: 'cnv', gene: 'CYP2D6', copyNumber: 1 }, // One copy deleted
      ];

      const result = analyzeCYP2D6(genotypes);

      expect(result.diplotype).toContain('*5');
      expect(result.note).toContain('deletion');
    });

    it('should analyze *1/*5 correctly', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'CC'), // One *1 allele
        { type: 'cnv', gene: 'CYP2D6', copyNumber: 1 },
      ];

      const result = analyzeCYP2D6(genotypes);

      expect(result.diplotype).toBe('*1/*5');
      expect(result.activityScore).toBe(1.0); // 1.0 + 0
    });
  });

  // ==========================================================================
  // GENE DUPLICATIONS
  // ==========================================================================

  describe.skip('Gene Duplications', () => {
    // NOTE: SNP arrays (23andMe, AncestryDNA) CANNOT detect gene duplications
    // Ultrarapid metabolizers (*1xN, *2xN) cannot be identified from consumer genetic data
    // These tests are skipped as they require specialized CNV analysis

    it('should detect gene duplication (*1x2)', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'CC'),
        { type: 'cnv', gene: 'CYP2D6', copyNumber: 3 }, // Duplication
      ];

      const result = analyzeCYP2D6(genotypes);

      expect(result.diplotype).toContain('x2');
      expect(result.phenotype).toBe('Ultrarapid Metabolizer');
      expect(result.activityScore).toBeGreaterThan(2.0);
    });

    it('should handle *1/*1x2 (one normal, one duplicated)', () => {
      const genotypes = [
        { type: 'cnv', gene: 'CYP2D6', copyNumber: 3 },
      ];

      const result = analyzeCYP2D6(genotypes);

      expect(result.activityScore).toBe(3.0); // 1.0 + 2.0 (duplicated)
    });
  });

  // ==========================================================================
  // COMPOUND HETEROZYGOTES
  // ==========================================================================

  describe('Compound Heterozygotes', () => {
    it('should analyze *4/*10 correctly', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'GA'),  // Heterozygous *4
        createTestGenotype('rs1065852', 'GT'),  // Heterozygous *10
        createTestGenotype('rs5030655', 'GG'),
        createTestGenotype('rs28371725', 'CC'),
      ];

      const result = analyzeCYP2D6(genotypes);

      expect(result.diplotype.allele1).toBe('*4');
      expect(result.diplotype.allele2).toBe('*10');
      expect(result.diplotype.activityScore).toBe(0.25); // 0 + 0.25
      expect(result.diplotype.phaseAmbiguity).toBe(true); // Two heterozygous variants
      expect(result.diplotype.confidence).toBe('medium');
    });

    it.skip('should analyze *4/*5 (poor metabolizer) correctly', () => {
      // Skipped - requires CNV detection not available in SNP arrays
      const genotypes = [
        createTestGenotype('rs3892097', 'CT'),
        { type: 'cnv', gene: 'CYP2D6', copyNumber: 1 },
      ];

      const result = analyzeCYP2D6(genotypes);

      expect(result.phenotype).toBe('Poor Metabolizer');
      expect(result.activityScore).toBe(0.0);
    });
  });

  // ==========================================================================
  // PHASE AMBIGUITY
  // ==========================================================================

  describe('Phase Ambiguity', () => {
    it('should handle ambiguous diplotypes appropriately', () => {
      // When we can't determine which variants are on the same chromosome
      const genotypes = [
        createTestGenotype('rs3892097', 'GA'),  // Heterozygous *4
        createTestGenotype('rs28371725', 'CT'), // Heterozygous *41
      ];

      const result = analyzeCYP2D6(genotypes);

      // Should acknowledge ambiguity
      expect(result.diplotype.phaseAmbiguity).toBe(true);
      expect(result.diplotype.possibleDiplotypes).toBeInstanceOf(Array);
      expect(result.diplotype.possibleDiplotypes!.length).toBeGreaterThan(1);
      expect(result.diplotype.confidence).toBe('medium');
    });

    it('should provide conservative recommendation when ambiguous', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'GA'),  // Heterozygous *4
        createTestGenotype('rs28371725', 'CT'), // Heterozygous *41
      ];

      const result = analyzeCYP2D6(genotypes);

      // Should flag phase ambiguity in limitations
      expect(result.limitations.some(l => l.includes('phase') || l.includes('ambiguity'))).toBe(true);
      expect(result.diplotype.phaseAmbiguity).toBe(true);
    });
  });

  // ==========================================================================
  // DRUG RECOMMENDATIONS
  // ==========================================================================

  describe('Drug Recommendations', () => {
    it('should provide codeine guidance for poor metabolizers', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'AA'), // *4/*4 homozygous
        createTestGenotype('rs1065852', 'GG'),
        createTestGenotype('rs5030655', 'GG'),
        createTestGenotype('rs28371725', 'CC'),
      ];

      const result = analyzeCYP2D6(genotypes);

      const codeineRec = result.drugs.find(d => d.drug.toLowerCase().includes('codeine'));
      expect(codeineRec).toBeDefined();
      expect(codeineRec!.riskLevel).toBe('critical');
      expect(codeineRec!.recommendation.toLowerCase()).toContain('avoid');
    });

    it('should provide tramadol guidance for poor metabolizers', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'AA'), // *4/*4
        createTestGenotype('rs1065852', 'GG'),
        createTestGenotype('rs5030655', 'GG'),
        createTestGenotype('rs28371725', 'CC'),
      ];

      const result = analyzeCYP2D6(genotypes);

      const tramadolRec = result.drugs.find(d => d.drug.toLowerCase().includes('tramadol'));
      expect(tramadolRec).toBeDefined();
      expect(tramadolRec!.riskLevel).toBe('warning');
    });

    it('should provide SSRI guidance for poor metabolizers', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'AA'), // *4/*4
        createTestGenotype('rs1065852', 'GG'),
        createTestGenotype('rs5030655', 'GG'),
        createTestGenotype('rs28371725', 'CC'),
      ];

      const result = analyzeCYP2D6(genotypes);

      const ssriRecs = result.drugs.filter(d =>
        ['paroxetine', 'fluoxetine', 'venlafaxine'].some(ssri =>
          d.drug.toLowerCase().includes(ssri.toLowerCase())
        )
      );

      expect(ssriRecs.length).toBeGreaterThan(0);
    });

    it('should provide tamoxifen guidance for poor metabolizers', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'AA'), // *4/*4
        createTestGenotype('rs1065852', 'GG'),
        createTestGenotype('rs5030655', 'GG'),
        createTestGenotype('rs28371725', 'CC'),
      ];

      const result = analyzeCYP2D6(genotypes);

      const tamoxifenRec = result.drugs.find(d => d.drug.toLowerCase().includes('tamoxifen'));
      expect(tamoxifenRec).toBeDefined();
      expect(tamoxifenRec!.riskLevel).toBe('critical');
    });

    it('should provide antipsychotic guidance', () => {
      const genotypes = [
        createTestGenotype('rs3892097', 'AA'), // *4/*4
        createTestGenotype('rs1065852', 'GG'),
        createTestGenotype('rs5030655', 'GG'),
        createTestGenotype('rs28371725', 'CC'),
      ];

      const result = analyzeCYP2D6(genotypes);

      const antipsychoticRecs = result.drugs.filter(d =>
        ['risperidone', 'aripiprazole', 'haloperidol'].some(drug =>
          d.drug.toLowerCase().includes(drug.toLowerCase())
        )
      );

      expect(antipsychoticRecs.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle missing data gracefully', () => {
      const result = analyzeCYP2D6([]);

      // With no genotype data, should default to *1/*1 (most common)
      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*1');
      expect(result.diplotype.phenotype).toBe('Normal Metabolizer');
      expect(result.confidence).toBe('high');
    });

    it('should handle novel/rare alleles', () => {
      // Variants not in the known star allele database
      const genotypes = [
        createTestGenotype('rs999999999', 'CT'),
      ];

      const result = analyzeCYP2D6(genotypes);

      // Should default to *1/*1 when unknown variants are provided
      expect(result.diplotype.allele1).toBe('*1');
      expect(result.diplotype.allele2).toBe('*1');
      // Should mention limitations in the limitations array
      expect(result.limitations.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // CLINICAL VALIDATION
  // ==========================================================================

  describe('Clinical Validation', () => {
    it('should reference CPIC guidelines', () => {
      const result = analyzeCYP2D6([
        createTestGenotype('rs3892097', 'AA'),
      ]);

      expect(result.guidelines.some(g => g.includes('CPIC'))).toBe(true);
    });

    it('should reference PharmVar allele definitions', () => {
      const result = analyzeCYP2D6([
        createTestGenotype('rs3892097', 'AA'),
      ]);

      expect(result.guidelines.some(g => g.includes('PharmVar'))).toBe(true);
    });

    it('should include evidence citations', () => {
      const result = analyzeCYP2D6([
        createTestGenotype('rs3892097', 'AA'),
      ]);

      expect(result.references).toBeInstanceOf(Array);
      expect(result.references.length).toBeGreaterThan(0);
      // Should include PMIDs
      expect(result.references.some(r => r.includes('PMID'))).toBe(true);
    });
  });

  // ==========================================================================
  // DATA INTEGRITY
  // ==========================================================================

  describe('Data Integrity', () => {
    it('should return all required fields', () => {
      const result = analyzeCYP2D6([
        createTestGenotype('rs3892097', 'GG'),
      ]);

      // Check top-level fields
      expect(result).toHaveProperty('gene');
      expect(result).toHaveProperty('diplotype');
      expect(result).toHaveProperty('drugs');
      expect(result).toHaveProperty('guidelines');
      expect(result).toHaveProperty('references');
      expect(result).toHaveProperty('clinicalSummary');
      expect(result).toHaveProperty('limitations');

      // Check nested diplotype fields
      expect(result.diplotype).toHaveProperty('allele1');
      expect(result.diplotype).toHaveProperty('allele2');
      expect(result.diplotype).toHaveProperty('phenotype');
      expect(result.diplotype).toHaveProperty('activityScore');
      expect(result.diplotype).toHaveProperty('confidence');
    });

    it('should validate activity scores are in valid range', () => {
      const testCases = [
        [createTestGenotype('rs3892097', 'AA'), createTestGenotype('rs1065852', 'GG')], // *4/*4 = 0
        [createTestGenotype('rs3892097', 'GA'), createTestGenotype('rs1065852', 'GG')], // *1/*4 = 1.0
        [createTestGenotype('rs3892097', 'GG'), createTestGenotype('rs1065852', 'GG')], // *1/*1 = 2.0
      ];

      testCases.forEach((genotypes) => {
        const result = analyzeCYP2D6(genotypes);
        expect(result.diplotype.activityScore).toBeGreaterThanOrEqual(0);
        expect(result.diplotype.activityScore).toBeLessThanOrEqual(3.0);
      });
    });
  });
});
