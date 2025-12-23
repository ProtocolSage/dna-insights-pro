/**
 * CYP2C9 Pharmacogenomics Analyzer v2
 * 
 * FIXES FROM v1:
 * 1. ✅ Added genotype normalization (no provider format assumptions)
 * 2. ✅ Added *1/*1 phenotype mapping (was missing "Normal Metabolizer")
 * 3. ✅ Removed invalid star alleles (*4-*8 not clinically validated)
 * 4. ✅ Expanded drug coverage (added NSAIDs, sulfonylureas)
 * 5. ✅ Added confidence scoring for all analyses
 * 6. ✅ Fixed inconsistent risk categories (bleeding vs efficacy)
 * 7. ✅ Proper "Unknown" phenotype handling
 * 8. ✅ Enhanced clinical recommendations with dosing guidance
 * 9. ✅ Added drug-specific risk stratification
 * 10. ✅ Comprehensive test coverage
 * 
 * CYP2C9 encodes cytochrome P450 2C9, responsible for ~15% of Phase I drug metabolism.
 * 
 * KEY SUBSTRATES:
 * - Warfarin (S-warfarin, the active enantiomer) - 7x more potent than R-warfarin
 * - NSAIDs: Ibuprofen, naproxen, diclofenac, celecoxib
 * - Sulfonylureas: Glipizide, glyburide, tolbutamide
 * - Phenytoin (anti-epileptic)
 * - Losartan (prodrug activation)
 * 
 * CRITICAL VARIANTS:
 * - CYP2C9*2 (rs1799853, C>T, R144C): ~35% reduced activity
 * - CYP2C9*3 (rs1057910, A>C, I359L): ~90% reduced activity
 * 
 * CLINICAL IMPACT:
 * - Poor metabolizers: 3-5x bleeding risk with warfarin
 * - Requires 25-50% warfarin dose reduction
 * - FDA-required pharmacogenetic testing for warfarin
 */

import { normalizeGenotype, type GeneticProvider, type GenotypeNormalizationResult } from '../utils/genotype-utils';

export interface CYP2C9Diplotype {
  allele1: string;
  allele2: string;
  phenotype: 'Normal Metabolizer' | 'Intermediate Metabolizer' | 'Poor Metabolizer' | 'Unknown';
  activityScore: number; // 0.0 to 2.0
  confidence: 'high' | 'medium' | 'low';
}

export interface CYP2C9DrugRecommendation {
  drug: string;
  category: string;
  recommendation: string;
  doseAdjustment: string;
  bleedingRisk: 'Normal' | 'Increased' | 'High' | 'Very High';
  alternativeDrugs: string[];
  monitoring: string;
  fdaGuidance: boolean;
}

export interface CYP2C9AnalysisResult {
  diplotype: CYP2C9Diplotype;
  clinicalSummary: string;
  drugRecommendations: CYP2C9DrugRecommendation[];
  warfarinDosing: {
    recommendedDose: string;
    titrationGuidance: string;
    inrMonitoring: string;
    bleedingRiskCategory: string;
  };
  safetyAlerts: string[];
  confidence: 'high' | 'medium' | 'low';
  normalizedGenotypes: {
    rs1799853: GenotypeNormalizationResult;
    rs1057910: GenotypeNormalizationResult;
  };
}

/**
 * CYP2C9 star allele activity scores
 * Based on CPIC guidelines and PharmGKB annotations
 *
 * CPIC-compliant activity scores (2017 guideline):
 * - *1: 1.0 (normal function, reference allele)
 * - *2: 0.5 (reduced function, ~50% activity)
 * - *3: 0.0 (no function)
 */
const ALLELE_ACTIVITY: Record<string, number> = {
  '*1': 1.0,  // Normal function (reference)
  '*2': 0.5,  // Reduced function (CPIC standard)
  '*3': 0.0   // No function (CPIC standard)
};

/**
 * Map diplotype to phenotype
 * Activity Score = allele1_activity + allele2_activity
 */
function diplotypeToPhenotype(allele1: string, allele2: string): {
  phenotype: string;
  activityScore: number;
  confidence: 'high' | 'medium' | 'low';
} {
  const activity1 = ALLELE_ACTIVITY[allele1];
  const activity2 = ALLELE_ACTIVITY[allele2];

  // Unknown alleles
  if (activity1 === undefined || activity2 === undefined) {
    return {
      phenotype: 'Unknown',
      activityScore: 1.0,
      confidence: 'low'
    };
  }

  const totalActivity = activity1 + activity2;

  // CPIC phenotype mapping based on activity score
  // Per CPIC guidelines:
  // - > 1.5: Normal Metabolizer
  // - 1.0 to 1.5: Intermediate Metabolizer (includes *1/*2 with score of 1.5)
  // - < 1.0: Poor Metabolizer
  let phenotype: string;
  if (totalActivity > 1.5) {
    phenotype = 'Normal Metabolizer';
  } else if (totalActivity >= 1.0) {
    phenotype = 'Intermediate Metabolizer';
  } else {
    phenotype = 'Poor Metabolizer';
  }

  return {
    phenotype,
    activityScore: totalActivity,
    confidence: 'high'
  };
}

/**
 * Determine CYP2C9 diplotype from genotypes
 */
export function determineCYP2C9Diplotype(
  rs1799853: string | null, // CYP2C9*2
  rs1057910: string | null, // CYP2C9*3
  provider: GeneticProvider = 'unknown'
): CYP2C9Diplotype {
  // Normalize genotypes
  const norm6025 = normalizeGenotype('rs1799853', rs1799853, provider);
  const norm1057910 = normalizeGenotype('rs1057910', rs1057910, provider);

  let allele1 = '*1';
  let allele2 = '*1';
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  // If EITHER variant is missing, return unknown (medical-grade safety standard)
  // We cannot reliably determine phenotype without complete genetic data for both variants
  if (norm6025.normalized === 'Unknown' || norm1057910.normalized === 'Unknown') {
    return {
      allele1: 'Unknown',
      allele2: 'Unknown',
      phenotype: 'Unknown',
      activityScore: 1.0,
      confidence: 'low'
    };
  }

  // Determine star alleles from genotypes
  // rs1799853: C=*1, T=*2
  // rs1057910: A=*1, C=*3

  const has2Variant = norm6025.normalized.includes('T');
  const has3Variant = norm1057910.normalized.includes('C');

  // Build diplotype
  if (!has2Variant && !has3Variant) {
    // *1/*1
    allele1 = '*1';
    allele2 = '*1';
    confidence = 'high';
  } else if (has2Variant && !has3Variant) {
    // Contains *2
    if (norm6025.normalized === 'C/T') {
      allele1 = '*1';
      allele2 = '*2';
    } else if (norm6025.normalized === 'T/T') {
      allele1 = '*2';
      allele2 = '*2';
    }
    confidence = 'high';
  } else if (!has2Variant && has3Variant) {
    // Contains *3
    if (norm1057910.normalized === 'A/C') {
      allele1 = '*1';
      allele2 = '*3';
    } else if (norm1057910.normalized === 'C/C') {
      allele1 = '*3';
      allele2 = '*3';
    }
    confidence = 'high';
  } else {
    // Compound heterozygote *2/*3
    allele1 = '*2';
    allele2 = '*3';
    confidence = 'high';
  }

  // Get phenotype
  const phenotypeResult = diplotypeToPhenotype(allele1, allele2);

  return {
    allele1,
    allele2,
    phenotype: phenotypeResult.phenotype as any,
    activityScore: phenotypeResult.activityScore,
    confidence
  };
}

/**
 * Generate warfarin-specific dosing guidance
 */
function generateWarfarinDosing(diplotype: CYP2C9Diplotype) {
  const { phenotype, activityScore } = diplotype;

  if (phenotype === 'Unknown') {
    return {
      recommendedDose: 'Standard dosing (5mg/day) with close monitoring',
      titrationGuidance: 'Use standard INR-guided dose adjustment',
      inrMonitoring: 'Weekly INR checks for first month',
      bleedingRiskCategory: 'Unknown - assume increased risk'
    };
  }

  if (phenotype === 'Poor Metabolizer') {
    return {
      recommendedDose: '0.5-2mg/day (50-75% reduction from standard 5mg)',
      titrationGuidance: 'Increase by 0.5-1mg every 5-7 days based on INR. Therapeutic dose typically 2-3mg/day.',
      inrMonitoring: 'Check INR every 2-3 days for first 2 weeks, then weekly until stable',
      bleedingRiskCategory: 'VERY HIGH (3-5x baseline risk) - Major bleeding risk elevated'
    };
  }

  if (phenotype === 'Intermediate Metabolizer') {
    return {
      recommendedDose: '2.5-4mg/day (25-40% reduction from standard 5mg)',
      titrationGuidance: 'Increase by 1-2mg weekly based on INR. Therapeutic dose typically 3-4mg/day.',
      inrMonitoring: 'Check INR every 3-4 days for first 2 weeks, then weekly',
      bleedingRiskCategory: 'INCREASED (2-3x baseline risk) - Moderate bleeding risk'
    };
  }

  // Normal Metabolizer
  return {
    recommendedDose: '5mg/day (standard starting dose)',
    titrationGuidance: 'Use standard warfarin titration protocol based on INR',
    inrMonitoring: 'Weekly INR checks for first month, then monthly when stable',
    bleedingRiskCategory: 'NORMAL (baseline risk ~1-2% per year)'
  };
}

/**
 * Generate drug-specific recommendations
 */
function generateDrugRecommendations(diplotype: CYP2C9Diplotype): CYP2C9DrugRecommendation[] {
  const { phenotype } = diplotype;
  const recommendations: CYP2C9DrugRecommendation[] = [];

  // Warfarin
  if (phenotype === 'Poor Metabolizer' || phenotype === 'Intermediate Metabolizer') {
    recommendations.push({
      drug: 'Warfarin',
      category: 'Anticoagulant',
      recommendation: phenotype === 'Poor Metabolizer'
        ? 'REDUCE starting dose by 50-75%. Start at 0.5-2mg/day.'
        : 'REDUCE starting dose by 25-40%. Start at 2.5-4mg/day.',
      doseAdjustment: 'See warfarinDosing section for detailed guidance',
      bleedingRisk: phenotype === 'Poor Metabolizer' ? 'Very High' : 'High',
      alternativeDrugs: [
        'Direct oral anticoagulants (DOACs): Apixaban, rivaroxaban, edoxaban',
        'Dabigatran (not affected by CYP2C9)'
      ],
      monitoring: 'Frequent INR monitoring - see warfarinDosing section',
      fdaGuidance: true
    });
  } else {
    recommendations.push({
      drug: 'Warfarin',
      category: 'Anticoagulant',
      recommendation: 'Standard dosing appropriate. Start 5mg/day.',
      doseAdjustment: 'Use standard INR-guided titration',
      bleedingRisk: 'Normal',
      alternativeDrugs: [],
      monitoring: 'Standard INR monitoring protocol',
      fdaGuidance: true
    });
  }

  // NSAIDs
  if (phenotype === 'Poor Metabolizer') {
    recommendations.push({
      drug: 'NSAIDs (Ibuprofen, Naproxen, Celecoxib)',
      category: 'Anti-inflammatory',
      recommendation: 'REDUCE dose by 30-50%. Start at lowest effective dose.',
      doseAdjustment: 'Ibuprofen: Start 200mg (vs 400mg), Celecoxib: 100mg (vs 200mg)',
      bleedingRisk: 'Increased',
      alternativeDrugs: [
        'Acetaminophen (not metabolized by CYP2C9)',
        'Topical NSAIDs (lower systemic exposure)'
      ],
      monitoring: 'Monitor for GI bleeding, renal function',
      fdaGuidance: false
    });
  } else if (phenotype === 'Intermediate Metabolizer') {
    recommendations.push({
      drug: 'NSAIDs (Ibuprofen, Naproxen, Celecoxib)',
      category: 'Anti-inflammatory',
      recommendation: 'Consider 20-30% dose reduction or use alternative',
      doseAdjustment: 'Start at low end of dosing range',
      bleedingRisk: 'Normal',
      alternativeDrugs: ['Acetaminophen for mild-moderate pain'],
      monitoring: 'Standard monitoring for GI/renal effects',
      fdaGuidance: false
    });
  }

  // Sulfonylureas
  if (phenotype === 'Poor Metabolizer' || phenotype === 'Intermediate Metabolizer') {
    recommendations.push({
      drug: 'Sulfonylureas (Glipizide, Glyburide)',
      category: 'Antidiabetic',
      recommendation: phenotype === 'Poor Metabolizer'
        ? 'AVOID or reduce dose by 50%. High hypoglycemia risk.'
        : 'Reduce dose by 25-30%. Monitor blood glucose closely.',
      doseAdjustment: 'Start at lowest available dose, titrate slowly',
      bleedingRisk: 'Normal',
      alternativeDrugs: [
        'Metformin (not metabolized by CYP2C9)',
        'DPP-4 inhibitors (sitagliptin, linagliptin)',
        'GLP-1 agonists (liraglutide, semaglutide)'
      ],
      monitoring: 'Frequent blood glucose monitoring for hypoglycemia',
      fdaGuidance: false
    });
  }

  // Phenytoin
  if (phenotype === 'Poor Metabolizer' || phenotype === 'Intermediate Metabolizer') {
    recommendations.push({
      drug: 'Phenytoin',
      category: 'Antiepileptic',
      recommendation: phenotype === 'Poor Metabolizer'
        ? 'REDUCE starting dose by 25-50%. High toxicity risk.'
        : 'Reduce starting dose by 20-25%.',
      doseAdjustment: 'Start low, titrate slowly with therapeutic drug monitoring',
      bleedingRisk: 'Normal',
      alternativeDrugs: [
        'Levetiracetam (not metabolized by CYP2C9)',
        'Lamotrigine',
        'Valproic acid'
      ],
      monitoring: 'Therapeutic drug monitoring (target 10-20 mcg/mL)',
      fdaGuidance: true
    });
  }

  return recommendations;
}

/**
 * Generate safety alerts
 */
function generateSafetyAlerts(diplotype: CYP2C9Diplotype): string[] {
  const { phenotype } = diplotype;
  const alerts: string[] = [];

  if (phenotype === 'Poor Metabolizer') {
    alerts.push('🚨 POOR METABOLIZER - HIGH BLEEDING RISK with warfarin');
    alerts.push('🚨 WARFARIN: Reduce starting dose by 50-75% (start 0.5-2mg/day)');
    alerts.push('🚨 NSAIDs: Reduce dose by 30-50%, consider alternatives');
    alerts.push('⚠️ SULFONYLUREAS: Avoid or reduce 50% - high hypoglycemia risk');
    alerts.push('⚠️ PHENYTOIN: Reduce dose 25-50% - high toxicity risk');
    alerts.push('💡 INFORM ALL PRESCRIBERS of poor metabolizer status');
    alerts.push('💡 CARRY MEDICAL ALERT card noting CYP2C9 poor metabolizer');
  } else if (phenotype === 'Intermediate Metabolizer') {
    alerts.push('⚠️ INTERMEDIATE METABOLIZER - INCREASED BLEEDING RISK with warfarin');
    alerts.push('⚠️ WARFARIN: Reduce starting dose by 25-40% (start 2.5-4mg/day)');
    alerts.push('⚠️ NSAIDs: Consider dose reduction or alternatives');
    alerts.push('💡 SULFONYLUREAS: Reduce dose 25-30%, monitor glucose closely');
    alerts.push('💡 INFORM PRESCRIBERS of intermediate metabolizer status');
  } else if (phenotype === 'Normal Metabolizer') {
    alerts.push('✅ NORMAL METABOLIZER - Standard dosing appropriate');
    alerts.push('✅ WARFARIN: Can start at standard 5mg/day with INR monitoring');
    alerts.push('💡 Still requires INR monitoring with warfarin (other factors affect dosing)');
  } else {
    alerts.push('⚠️ UNKNOWN METABOLIZER STATUS - Assume increased risk');
    alerts.push('⚠️ Use CONSERVATIVE dosing for CYP2C9 substrates');
    alerts.push('💡 Consider additional genetic testing for CYP2C9');
  }

  return alerts;
}

/**
 * Main CYP2C9 analysis function
 */
export function analyzeCYP2C9(
  rs1799853: string | null,
  rs1057910: string | null,
  provider: GeneticProvider = 'unknown'
): CYP2C9AnalysisResult {
  // Normalize genotypes
  const norm1799853 = normalizeGenotype('rs1799853', rs1799853, provider);
  const norm1057910 = normalizeGenotype('rs1057910', rs1057910, provider);

  // Determine diplotype
  const diplotype = determineCYP2C9Diplotype(rs1799853, rs1057910, provider);

  // Generate recommendations
  const warfarinDosing = generateWarfarinDosing(diplotype);
  const drugRecommendations = generateDrugRecommendations(diplotype);
  const safetyAlerts = generateSafetyAlerts(diplotype);

  // Clinical summary
  const clinicalSummary = `
CYP2C9 METABOLIZER STATUS
Diplotype: ${diplotype.allele1}/${diplotype.allele2}
Phenotype: ${diplotype.phenotype}
Activity Score: ${diplotype.activityScore.toFixed(2)} (0=none, 2=normal)
Confidence: ${diplotype.confidence}

CYP2C9 metabolizes approximately 15% of clinically used drugs, including
warfarin (the #2 most common cause of drug-related hospitalizations in the US).

${diplotype.phenotype === 'Poor Metabolizer'
  ? 'You have SIGNIFICANTLY REDUCED CYP2C9 activity (~5-10% of normal). This causes:\n- 3-5x INCREASED bleeding risk with warfarin\n- Requires 50-75% DOSE REDUCTION for warfarin, NSAIDs, sulfonylureas\n- FDA pharmacogenetic testing recommended before warfarin initiation'
  : diplotype.phenotype === 'Intermediate Metabolizer'
  ? 'You have MODERATELY REDUCED CYP2C9 activity (~50-75% of normal). This causes:\n- 2-3x increased bleeding risk with warfarin\n- Requires 25-40% dose reduction for warfarin\n- Consider dose adjustments for NSAIDs and sulfonylureas'
  : diplotype.phenotype === 'Normal Metabolizer'
  ? 'You have NORMAL CYP2C9 activity. Standard dosing is appropriate for CYP2C9 substrates.\nWarfarin dosing still requires INR monitoring (other factors affect response).'
  : 'Your CYP2C9 status could not be determined. Use conservative dosing for CYP2C9 substrates.'}

GENOTYPE DETAILS:
• rs1799853 (CYP2C9*2): ${norm1799853.normalized} (${norm1799853.confidence} confidence)
• rs1057910 (CYP2C9*3): ${norm1057910.normalized} (${norm1057910.confidence} confidence)
  `.trim();

  return {
    diplotype,
    clinicalSummary,
    drugRecommendations,
    warfarinDosing,
    safetyAlerts,
    confidence: diplotype.confidence,
    normalizedGenotypes: {
      rs1799853: norm1799853,
      rs1057910: norm1057910
    }
  };
}
