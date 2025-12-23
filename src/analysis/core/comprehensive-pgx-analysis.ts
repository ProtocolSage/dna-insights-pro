/**
 * COMPREHENSIVE PHARMACOGENOMICS ANALYSIS
 *
 * Orchestrates all gene-specific analyzers and returns a unified PGx result.
 * Uses v2 medical-grade analyzers for maximum accuracy.
 *
 * Architecture:
 * - Each gene analyzer is called directly
 * - Results are combined into a comprehensive object
 * - Critical safety findings are extracted
 * - Drug-drug interactions are identified
 */

import { analyzeCYP2C9, type CYP2C9AnalysisResult } from '../analyzers/cyp2c9-analyzer';
import { analyzeVKORC1, type VKORC1AnalysisResult } from '../analyzers/vkorc1-analyzer';
import { analyzeSLCO1B1, type SLCO1B1AnalysisResult } from '../analyzers/slco1b1-analyzer';
import { analyzeF5, type F5AnalysisResult } from '../analyzers/f5-analyzer';
import { analyzeCYP2D6, type CYP2D6AnalysisResult } from '../analyzers/cyp2d6-analyzer';
import { analyzeUGT1A1, type UGT1A1AnalysisResult } from '../analyzers/ugt1a1-analyzer';
import { analyzeCYP3A5, type CYP3A5AnalysisResult } from '../analyzers/cyp3a5-analyzer';

export interface ComprehensivePGxResult {
  // Core CYP enzymes
  cyp2d6?: CYP2D6AnalysisResult;
  cyp2c9?: CYP2C9AnalysisResult;
  cyp2c19?: any; // TODO: Add CYP2C19 analyzer
  cyp3a4?: any;  // TODO: Add CYP3A4 analyzer
  cyp3a5?: CYP3A5AnalysisResult;
  cyp2b6?: any;  // TODO: Add CYP2B6 analyzer
  cyp1a2?: any;  // TODO: Add CYP1A2 analyzer

  // Other pharmacogenes
  vkorc1?: VKORC1AnalysisResult;
  slco1b1?: SLCO1B1AnalysisResult;
  f5?: F5AnalysisResult;
  ugt1a1?: UGT1A1AnalysisResult;

  // Critical safety genes
  criticalSafety?: {
    dpyd?: any[];    // TODO: Add DPYD analyzer
    tpmt?: any[];    // TODO: Add TPMT analyzer
    nudt15?: any[];  // TODO: Add NUDT15 analyzer
  };

  // Summary
  summary: {
    genesAnalyzed: string[];
    criticalWarnings: string[];
    totalDrugsAffected: number;
    highConfidenceResults: number;
  };
}

/**
 * Main comprehensive PGx analysis function
 *
 * Takes genotype data and runs all available analyzers
 */
export function analyzeComprehensivePGx(
  genotypes: Array<{ rsid: string; genotype: string }>,
  provider: '23andme' | 'unknown' = '23andme'
): ComprehensivePGxResult {

  const genesAnalyzed: string[] = [];
  const criticalWarnings: string[] = [];
  let totalDrugsAffected = 0;
  let highConfidenceResults = 0;

  // ============================================================================
  // CYP2D6 - Amphetamines, Codeine, Antidepressants, Antipsychotics
  // ============================================================================

  let cyp2d6Result: CYP2D6AnalysisResult | undefined;

  try {
    cyp2d6Result = analyzeCYP2D6(genotypes, provider);
    genesAnalyzed.push('CYP2D6');
    totalDrugsAffected += cyp2d6Result.drugs.length;

    if (cyp2d6Result.confidence === 'high') {
      highConfidenceResults++;
    }

    // Extract critical warnings
    if (cyp2d6Result.safetyAlerts.length > 0) {
      criticalWarnings.push(...cyp2d6Result.safetyAlerts);
    }
  } catch (error) {
    console.error('CYP2D6 analysis failed:', error);
  }

  // ============================================================================
  // CYP2C9 - Warfarin, NSAIDs, Phenytoin
  // ============================================================================

  let cyp2c9Result: CYP2C9AnalysisResult | undefined;

  try {
    cyp2c9Result = analyzeCYP2C9(genotypes, provider);
    genesAnalyzed.push('CYP2C9');
    totalDrugsAffected += cyp2c9Result.drugs.length;

    if (cyp2c9Result.confidence === 'high') {
      highConfidenceResults++;
    }

    // Extract critical warnings
    if (cyp2c9Result.safetyAlerts.length > 0) {
      criticalWarnings.push(...cyp2c9Result.safetyAlerts);
    }
  } catch (error) {
    console.error('CYP2C9 analysis failed:', error);
  }

  // ============================================================================
  // VKORC1 - Warfarin Sensitivity
  // ============================================================================

  let vkorc1Result: VKORC1AnalysisResult | undefined;

  try {
    vkorc1Result = analyzeVKORC1(
      genotypes,
      provider,
      cyp2c9Result ? {
        allele1: cyp2c9Result.diplotype.allele1,
        allele2: cyp2c9Result.diplotype.allele2,
        phenotype: cyp2c9Result.diplotype.phenotype
      } : undefined
    );
    genesAnalyzed.push('VKORC1');

    if (vkorc1Result.confidence === 'high') {
      highConfidenceResults++;
    }

    // Extract critical warnings
    if (vkorc1Result.clinicalSummary.includes('CRITICAL') || vkorc1Result.clinicalSummary.includes('🚨')) {
      criticalWarnings.push(`VKORC1: Warfarin sensitivity detected`);
    }
  } catch (error) {
    console.error('VKORC1 analysis failed:', error);
  }

  // ============================================================================
  // SLCO1B1 - Statin Myopathy Risk
  // ============================================================================

  let slco1b1Result: SLCO1B1AnalysisResult | undefined;

  try {
    slco1b1Result = analyzeSLCO1B1(genotypes, provider);
    genesAnalyzed.push('SLCO1B1');
    totalDrugsAffected += slco1b1Result.drugs.length;

    if (slco1b1Result.confidence === 'high') {
      highConfidenceResults++;
    }

    // Extract critical warnings - check simvastatin risk
    // SLCO1B1 uses 'statin' property, not 'drug'
    const simvastatinRec = slco1b1Result.drugs.find((d: any) =>
      d?.statin?.toLowerCase().includes('simvastatin')
    );
    if (simvastatinRec && simvastatinRec.myopathyRisk === 'Very High') {
      criticalWarnings.push(`SLCO1B1: High statin myopathy risk`);
    }
  } catch (error) {
    console.error('SLCO1B1 analysis failed:', error);
  }

  // ============================================================================
  // F5 (Factor V Leiden) - Thrombophilia, OCP Safety
  // ============================================================================

  let f5Result: F5AnalysisResult | undefined;

  try {
    const rs6025 = genotypes.find(g => g.rsid === 'rs6025')?.genotype || null;
    const rs6027 = genotypes.find(g => g.rsid === 'rs6027')?.genotype || null;
    f5Result = analyzeF5(rs6025, rs6027);
    genesAnalyzed.push('F5');

    if (f5Result.genotype.confidence === 'high') {
      highConfidenceResults++;
    }

    // Extract critical warnings
    if (f5Result.genotype.thrombophiliaRisk !== 'Normal') {
      const riskLevel = f5Result.genotype.vteRiskMultiplier > 20 ? '80x' : '5-7x';
      criticalWarnings.push(`⛔ FACTOR V LEIDEN DETECTED: ${riskLevel} clotting risk - AVOID estrogen-containing contraceptives`);
    }
  } catch (error) {
    console.error('F5 analysis failed:', error);
  }

  // ============================================================================
  // UGT1A1 - Irinotecan Toxicity, Cabotegravir (Apretude), Gilbert Syndrome
  // ============================================================================

  let ugt1a1Result: UGT1A1AnalysisResult | undefined;

  try {
    ugt1a1Result = analyzeUGT1A1(genotypes, provider);
    genesAnalyzed.push('UGT1A1');
    totalDrugsAffected += ugt1a1Result.drugs.length;

    if (ugt1a1Result.confidence === 'high' || ugt1a1Result.confidence === 'medium') {
      highConfidenceResults++;
    }

    // Extract critical warnings
    if (ugt1a1Result.safetyAlerts.length > 0) {
      criticalWarnings.push(...ugt1a1Result.safetyAlerts);
    }
  } catch (error) {
    console.error('UGT1A1 analysis failed:', error);
  }

  // ============================================================================
  // CYP3A5 - Alprazolam, Sildenafil, Zolpidem, Tacrolimus
  // ============================================================================

  let cyp3a5Result: CYP3A5AnalysisResult | undefined;

  try {
    cyp3a5Result = analyzeCYP3A5(genotypes, provider);
    genesAnalyzed.push('CYP3A5');
    totalDrugsAffected += cyp3a5Result.drugs.length;

    if (cyp3a5Result.confidence === 'high') {
      highConfidenceResults++;
    }

    // CYP3A5 has informational warnings, not safety alerts
    // Most important is tacrolimus dosing for transplant patients
  } catch (error) {
    console.error('CYP3A5 analysis failed:', error);
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  const summary = {
    genesAnalyzed,
    criticalWarnings,
    totalDrugsAffected,
    highConfidenceResults
  };

  return {
    cyp2d6: cyp2d6Result,
    cyp2c9: cyp2c9Result,
    vkorc1: vkorc1Result,
    slco1b1: slco1b1Result,
    f5: f5Result,
    ugt1a1: ugt1a1Result,
    cyp3a5: cyp3a5Result,
    summary
  };
}

/**
 * Helper function to convert from Record<string, string> to Array<{rsid, genotype}>
 */
export function genotypeRecordToArray(genotypes: Record<string, string>): Array<{ rsid: string; genotype: string }> {
  return Object.entries(genotypes).map(([rsid, genotype]) => ({
    rsid,
    genotype
  }));
}

/**
 * Export type alias for backwards compatibility
 */
export type PGxResult = ComprehensivePGxResult;
