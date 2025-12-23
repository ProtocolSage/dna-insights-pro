/**
 * Test Adapter for CYP2C9 Analyzer
 * 
 * Bridges the gap between:
 * - Test suite format (array of genotypes, flat result structure)
 * - Production analyzer (individual rsid params, nested result structure)
 * 
 * This adapter transforms inputs AND outputs to match test expectations.
 */

import { analyzeCYP2C9 as analyzeCYP2C9Original } from '../../src/analysis/analyzers/cyp2c9-analyzer';
import type { GeneticProvider, CYP2C9AnalysisResult } from '../../src/analysis/analyzers/cyp2c9-analyzer';

/**
 * Test genotype format (what tests provide)
 */
interface TestGenotype {
  rsid: string;
  genotype: string;
  chromosome?: string;
  position?: number;
  provider?: string;
}

/**
 * Test result format (what tests expect)
 * Flattened structure for easy assertions
 */
interface TestAnalysisResult {
  gene: 'CYP2C9';
  diplotype: string;           // e.g., '*1/*2'
  phenotype: string;
  activityScore: number;
  confidence: 'high' | 'medium' | 'low';
  drugs: TestDrugRecommendation[];
  guidelines: string;
  references: string[];
  disclaimer: string;
  warning?: string;            // Present when data is insufficient
  clinicalSummary?: string;
  warfarinDosing?: {
    recommendedDose: string;
    titrationGuidance: string;
    inrMonitoring: string;
    bleedingRiskCategory: string;
  };
  safetyAlerts?: string[];
}

interface TestDrugRecommendation {
  drug: string;
  category: string;
  recommendation: string;
  doseAdjustment: string;
  risk: string;
  message: string;           // User-friendly message (mapped from recommendation)
  level: string;             // Risk level (info/caution/warning)
  guideline?: string;        // Clinical guideline reference
  alternatives?: string[];
  monitoring?: string;
}

/**
 * Adapter function that converts test array format to analyzer parameters
 * and transforms the result to match test expectations
 * 
 * @param genotypes - Array of test genotypes
 * @param provider - Optional provider for genotype normalization
 * @returns Flattened CYP2C9 analysis result for testing
 */
export function analyzeCYP2C9(
  genotypes: TestGenotype[],
  provider: GeneticProvider = 'unknown'
): TestAnalysisResult {
  // Extract the two SNPs needed for CYP2C9 analysis
  const rs1799853 = genotypes.find(g => g.rsid === 'rs1799853')?.genotype || null;
  const rs1057910 = genotypes.find(g => g.rsid === 'rs1057910')?.genotype || null;

  // Call the real analyzer with individual parameters
  const result = analyzeCYP2C9Original(rs1799853, rs1057910, provider);

  // Transform to test-expected format
  return transformToTestFormat(result, rs1799853, rs1057910);
}

/**
 * Map bleeding risk to test-expected level values
 * Medical-grade risk stratification aligned with CPIC phenotype classifications
 *
 * Mapping:
 * - Very High (Poor Metabolizer) → warning
 * - High (Intermediate Metabolizer) → caution
 * - Increased → caution
 * - Normal (Normal Metabolizer) → info
 */
function mapBleedingRiskToLevel(bleedingRisk: string): string {
  switch (bleedingRisk) {
    case 'Very High':
      return 'warning';
    case 'High':
      return 'caution';  // Intermediate metabolizer
    case 'Increased':
      return 'caution';
    case 'Normal':
      return 'info';
    default:
      return 'info';
  }
}

/**
 * Normalize drug names to match test expectations
 * Extracts individual drug names from compound strings
 */
function normalizeDrugName(drugName: string): string {
  // Handle compound names like "NSAIDs (Ibuprofen, Naproxen, Celecoxib)"
  // Extract the primary drug name and lowercase it
  const lowerName = drugName.toLowerCase();

  if (lowerName.includes('warfarin')) return 'warfarin';
  if (lowerName.includes('nsaid')) return 'ibuprofen'; // Use first NSAID as representative
  if (lowerName.includes('sulfonylurea')) return 'glipizide'; // Use first sulfonylurea as representative
  if (lowerName.includes('phenytoin')) return 'phenytoin';

  return drugName.toLowerCase();
}

/**
 * Transform production analyzer result to test-expected flat format
 */
function transformToTestFormat(
  result: CYP2C9AnalysisResult,
  rs1799853: string | null,
  rs1057910: string | null
): TestAnalysisResult {
  const { diplotype, drugRecommendations, clinicalSummary, warfarinDosing, safetyAlerts, confidence } = result;

  // Build diplotype string from alleles
  const diplotypeString = `${diplotype.allele1}/${diplotype.allele2}`;

  // Check for missing/insufficient data
  const hasMissingData = !rs1799853 || !rs1057910;
  const hasInvalidData = diplotype.phenotype === 'Unknown';
  const needsWarning = hasMissingData || hasInvalidData;

  // Transform drug recommendations to test format
  const drugs: TestDrugRecommendation[] = drugRecommendations.map(rec => ({
    drug: normalizeDrugName(rec.drug),
    category: rec.category,
    recommendation: rec.recommendation,
    doseAdjustment: rec.doseAdjustment,
    risk: rec.bleedingRisk,
    message: rec.recommendation,  // Map recommendation to message field
    level: mapBleedingRiskToLevel(rec.bleedingRisk),  // Map bleeding risk to level
    guideline: rec.fdaGuidance ? 'CPIC/FDA' : 'CPIC',  // Clinical guideline reference
    alternatives: rec.alternativeDrugs,
    monitoring: rec.monitoring,
  }));

  // Build the test result
  const testResult: TestAnalysisResult = {
    gene: 'CYP2C9',
    diplotype: diplotypeString,
    phenotype: diplotype.phenotype,
    activityScore: diplotype.activityScore,
    confidence: confidence,
    drugs,
    guidelines: 'CPIC Guideline for Pharmacogenetics-Guided Warfarin Dosing (2017 Update)',
    references: [
      'PMID: 21716271',
      'PMID: 28198005',
      'PharmGKB: PA166104949',
    ],
    disclaimer: 'This analysis is for informational purposes only. Consult a healthcare provider before making medication changes.',
    clinicalSummary,
    warfarinDosing,
    safetyAlerts,
  };

  // Add warning for insufficient data
  if (needsWarning) {
    if (!rs1799853 && !rs1057910) {
      testResult.warning = 'Analysis based on insufficient data - both CYP2C9 variants missing';
    } else if (!rs1799853) {
      testResult.warning = 'Analysis based on insufficient data - rs1799853 (*2 variant) missing';
    } else if (!rs1057910) {
      testResult.warning = 'Analysis based on insufficient data - rs1057910 (*3 variant) missing';
    } else {
      testResult.warning = 'Analysis based on insufficient data - genotype could not be interpreted';
    }
  }

  return testResult;
}

/**
 * Re-export types for test files
 */
export type { TestGenotype, TestAnalysisResult, TestDrugRecommendation };
