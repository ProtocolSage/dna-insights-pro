/**
 * SLCO1B1 Pharmacogenomics Analyzer v2
 * 
 * FIXES FROM v1:
 * 1. ✅ REMOVED INVALID STAR ALLELES (*1a, *1b, *14, *15, *17, *20, *21)
 *    - Only *1, *5, and *15 are clinically validated by CPIC
 *    - v1 incorrectly included non-standard alleles
 * 2. ✅ Added genotype normalization (no provider format assumptions)
 * 3. ✅ Proper "Unknown" phenotype handling
 * 4. ✅ Statin-specific risk stratification (atorvastatin, simvastatin differ)
 * 5. ✅ Added confidence scoring
 * 6. ✅ Enhanced clinical recommendations with CPIC guidelines
 * 7. ✅ Drug-specific myopathy risk quantification
 * 
 * SLCO1B1 encodes OATP1B1 (Organic Anion Transporting Polypeptide 1B1),
 * a hepatic uptake transporter critical for statin disposition.
 * 
 * FUNCTION:
 * - Transports statins from blood INTO liver cells
 * - Reduced function = higher statin blood levels = increased myopathy risk
 * 
 * CRITICAL VARIANT:
 * - SLCO1B1*5 (rs4149056, T>C, p.Val174Ala): ~50% reduced transporter function
 * 
 * CLINICAL IMPACT:
 * - *5/*5 carriers: 16-17x increased simvastatin myopathy risk
 * - *1/*5 carriers: 4-5x increased simvastatin myopathy risk
 * - FDA warning for simvastatin 80mg (highest myopathy risk)
 * 
 * STAR ALLELE NOMENCLATURE (CPIC):
 * - *1 = Normal function (rs4149056 T/T)
 * - *5 = Decreased function (rs4149056 C/C or T/C)
 * - *15 = Decreased function (includes *5 + other variants)
 * 
 * NOTE: This analyzer uses simplified *1/*5 nomenclature as *15 requires
 * additional variants (rs2306283) not commonly tested.
 */

import { extractAndNormalize, type GeneticProvider } from '../utils/genotype-utils';

export interface SLCO1B1Diplotype {
  allele1: string;
  allele2: string;
  phenotype: 'Normal Function' | 'Decreased Function' | 'Poor Function' | 'Unknown';
  functionScore: number; // 0.0 to 2.0 (sum of allele functions)
  confidence: 'high' | 'medium' | 'low';
}

export interface StatinRecommendation {
  statin: string;
  myopathyRisk: 'Normal' | 'Moderately Increased' | 'High' | 'Very High';
  riskMultiplier: string; // e.g., "4-5x baseline"
  recommendation: string;
  doseAdjustment: string;
  monitoring: string;
  cpicGuideline: boolean;
}

export interface SLCO1B1AnalysisResult {
  gene: 'SLCO1B1';
  diplotype: SLCO1B1Diplotype;
  drugs: StatinRecommendation[]; // v2 standard: "drugs" not "statinRecommendations"
  clinicalSummary: string;
  safetyAlerts: string[];
  confidence: 'high' | 'medium' | 'low';
  limitations: string[];
  guidelines: {
    cpic: string;
    fda: string[];
  };
}

/**
 * SLCO1B1 star allele function scores
 * Based on CPIC guidelines (Updated October 2025)
 * 
 * CPIC ALLELE ASSIGNMENTS:
 * - *1: Normal Function (Score: 1.0)
 * - *5 (rs4149056 C): No Function (Score: 0.0) 
 * - *15: No Function (Score: 0.0) - includes *5
 * 
 * PHENOTYPE MAPPING:
 * - Score >= 1.5: Normal Function (*1/*1 = 2.0)
 * - Score 0.5-1.0: Decreased Function (*1/*5 = 1.0)
 * - Score < 0.5: Poor Function (*5/*5 = 0.0)
 * 
 * Clinical Reference: PMID: 24918167
 */
const ALLELE_FUNCTION: Record<string, number> = {
  '*1': 1.0,  // Normal function
  '*5': 0.0,  // No function (rs4149056 C allele)
  '*15': 0.0  // No function (includes *5 + rs2306283)
};

/**
 * Map rs4149056 genotype to SLCO1B1 star alleles
 * 
 * SIMPLIFIED MAPPING (requires only rs4149056):
 * - T/T = *1/*1 (Normal function)
 * - T/C = *1/*5 (Decreased function)
 * - C/C = *5/*5 (Poor function)
 * 
 * NOTE: *15 detection requires additional variant rs2306283 (not included)
 */
function genotypeToDiplotype(rs4149056Genotype: string): {
  allele1: string;
  allele2: string;
  confidence: 'high' | 'medium' | 'low';
} {
  // Handle Unknown
  if (rs4149056Genotype === 'Unknown') {
    return { allele1: 'Unknown', allele2: 'Unknown', confidence: 'low' };
  }

  // Normalize genotype - remove slashes, uppercase
  const normalized = rs4149056Genotype.replace(/\//g, '').toUpperCase();

  // Map genotype to alleles
  // T = *1 (normal), C = *5 (decreased)
  if (normalized === 'TT') {
    return { allele1: '*1', allele2: '*1', confidence: 'high' };
  } else if (normalized === 'CT' || normalized === 'TC') {
    return { allele1: '*1', allele2: '*5', confidence: 'high' };
  } else if (normalized === 'CC') {
    return { allele1: '*5', allele2: '*5', confidence: 'high' };
  }

  // Invalid genotype format
  return { allele1: 'Unknown', allele2: 'Unknown', confidence: 'low' };
}

/**
 * Map diplotype to phenotype
 */
function diplotypeToPhenotype(allele1: string, allele2: string): {
  phenotype: string;
  functionScore: number;
} {
  const function1 = ALLELE_FUNCTION[allele1];
  const function2 = ALLELE_FUNCTION[allele2];

  if (function1 === undefined || function2 === undefined) {
    return {
      phenotype: 'Unknown',
      functionScore: 1.0 // Assume normal for safety
    };
  }

  const totalFunction = function1 + function2;

  // CPIC phenotype mapping (PMID: 24918167, Updated October 2025)
  // *1/*1 = 2.0 → Normal Function
  // *1/*5 = 1.0 → Decreased Function
  // *5/*5 = 0.0 → Poor Function
  let phenotype: string;
  if (totalFunction >= 1.5) {
    phenotype = 'Normal Function';
  } else if (totalFunction >= 0.5) {
    phenotype = 'Decreased Function'; // Catches *1/*5 (score 1.0)
  } else {
    phenotype = 'Poor Function'; // *5/*5 (score 0.0)
  }

  return { phenotype, functionScore: totalFunction };
}

/**
 * Generate statin-specific recommendations
 * 
 * STATIN RISK HIERARCHY (by myopathy risk):
 * HIGHEST: Simvastatin 80mg > Simvastatin 40mg > Atorvastatin 80mg
 * MODERATE: Atorvastatin ≤40mg, Lovastatin, Fluvastatin
 * LOWEST: Pravastatin, Rosuvastatin, Pitavastatin
 */
function generateStatinRecommendations(diplotype: SLCO1B1Diplotype): StatinRecommendation[] {
  const { phenotype, functionScore: _functionScore, allele1: _allele1, allele2: _allele2 } = diplotype;
  const recommendations: StatinRecommendation[] = [];

  // Simvastatin (HIGHEST RISK - CPIC actionable)
  if (phenotype === 'Poor Function') {
    recommendations.push({
      statin: 'Simvastatin',
      myopathyRisk: 'Very High',
      riskMultiplier: '16-17x baseline risk',
      recommendation: 'AVOID SIMVASTATIN or prescribe ≤20mg dose with close monitoring',
      doseAdjustment: 'If used, MAX 20mg/day (avoid 40-80mg doses)',
      monitoring: 'Baseline CK, monitor closely for muscle pain/weakness',
      cpicGuideline: true
    });
  } else if (phenotype === 'Decreased Function') {
    recommendations.push({
      statin: 'Simvastatin',
      myopathyRisk: 'High',
      riskMultiplier: '4-5x baseline risk',
      recommendation: 'LIMIT simvastatin to ≤40mg/day. Consider alternative statin.',
      doseAdjustment: 'MAX 40mg/day (avoid 80mg dose)',
      monitoring: 'Baseline CK, monitor for muscle symptoms',
      cpicGuideline: true
    });
  } else if (phenotype === 'Normal Function') {
    recommendations.push({
      statin: 'Simvastatin',
      myopathyRisk: 'Normal',
      riskMultiplier: 'Baseline risk (~1-5%)',
      recommendation: 'Standard dosing appropriate (up to 80mg/day)',
      doseAdjustment: 'No adjustment needed',
      monitoring: 'Standard monitoring (CK if symptomatic)',
      cpicGuideline: true
    });
  } else {
    recommendations.push({
      statin: 'Simvastatin',
      myopathyRisk: 'Moderately Increased',
      riskMultiplier: 'Unknown - assume 2-4x risk',
      recommendation: 'Use conservative dosing (≤40mg/day)',
      doseAdjustment: 'Start low, avoid 80mg dose',
      monitoring: 'Baseline CK, close symptom monitoring',
      cpicGuideline: true
    });
  }

  // Atorvastatin (MODERATE RISK)
  if (phenotype === 'Poor Function') {
    recommendations.push({
      statin: 'Atorvastatin',
      myopathyRisk: 'High',
      riskMultiplier: '2-3x baseline risk (lower than simvastatin)',
      recommendation: 'LIMIT to ≤40mg/day OR use alternative statin',
      doseAdjustment: 'MAX 40mg/day, consider starting at 20mg',
      monitoring: 'Baseline CK, monitor muscle symptoms',
      cpicGuideline: false
    });
  } else if (phenotype === 'Decreased Function') {
    recommendations.push({
      statin: 'Atorvastatin',
      myopathyRisk: 'Moderately Increased',
      riskMultiplier: '1.5-2x baseline risk',
      recommendation: 'Use standard dosing with monitoring. Consider dose limit.',
      doseAdjustment: 'Consider MAX 40-60mg/day',
      monitoring: 'Standard monitoring for muscle symptoms',
      cpicGuideline: false
    });
  } else {
    recommendations.push({
      statin: 'Atorvastatin',
      myopathyRisk: 'Normal',
      riskMultiplier: 'Baseline risk',
      recommendation: 'Standard dosing appropriate',
      doseAdjustment: 'No adjustment needed',
      monitoring: 'Standard monitoring',
      cpicGuideline: false
    });
  }

  // Pravastatin, Rosuvastatin, Pitavastatin (LOW RISK - PREFERRED ALTERNATIVES)
  if (phenotype === 'Poor Function' || phenotype === 'Decreased Function') {
    recommendations.push({
      statin: 'Pravastatin / Rosuvastatin / Pitavastatin',
      myopathyRisk: 'Normal',
      riskMultiplier: 'No increased risk (NOT substrates of OATP1B1)',
      recommendation: 'PREFERRED ALTERNATIVES - No SLCO1B1-related risk',
      doseAdjustment: 'Standard dosing appropriate',
      monitoring: 'Standard statin monitoring',
      cpicGuideline: true
    });
  }

  // Lovastatin (Similar to simvastatin, less studied)
  if (phenotype === 'Poor Function' || phenotype === 'Decreased Function') {
    recommendations.push({
      statin: 'Lovastatin',
      myopathyRisk: phenotype === 'Poor Function' ? 'High' : 'Moderately Increased',
      riskMultiplier: 'Similar to simvastatin (less data available)',
      recommendation: 'Use with caution, consider alternatives',
      doseAdjustment: phenotype === 'Poor Function' ? 'MAX 40mg/day' : 'Consider dose limit',
      monitoring: 'Close monitoring for muscle symptoms',
      cpicGuideline: false
    });
  }

  return recommendations;
}

/**
 * Generate safety alerts
 */
function generateSafetyAlerts(diplotype: SLCO1B1Diplotype): string[] {
  const { phenotype, allele1, allele2 } = diplotype;
  const alerts: string[] = [];

  if (phenotype === 'Poor Function') {
    alerts.push('🚨 POOR FUNCTION - VERY HIGH MYOPATHY RISK');
    alerts.push(`🚨 Diplotype: ${allele1}/${allele2} - 16-17x risk with simvastatin`);
    alerts.push('🚨 AVOID SIMVASTATIN or use MAX 20mg/day with close monitoring');
    alerts.push('⚠️ ATORVASTATIN: Limit to ≤40mg/day');
    alerts.push('✅ PREFERRED: Pravastatin, rosuvastatin, or pitavastatin (no SLCO1B1 effect)');
    alerts.push('💡 FDA WARNING: Simvastatin 80mg has highest myopathy risk');
    alerts.push('💡 INFORM ALL PRESCRIBERS of poor function status');
  } else if (phenotype === 'Decreased Function') {
    alerts.push('⚠️ DECREASED FUNCTION - HIGH MYOPATHY RISK');
    alerts.push(`⚠️ Diplotype: ${allele1}/${allele2} - 4-5x risk with simvastatin`);
    alerts.push('⚠️ SIMVASTATIN: MAX 40mg/day (avoid 80mg dose)');
    alerts.push('💡 ATORVASTATIN: Consider dose limit ≤40-60mg/day');
    alerts.push('✅ PREFERRED: Pravastatin, rosuvastatin, or pitavastatin');
    alerts.push('💡 INFORM PRESCRIBERS of decreased function status');
  } else if (phenotype === 'Normal Function') {
    alerts.push('✅ NORMAL FUNCTION - Standard statin dosing appropriate');
    alerts.push(`✅ Diplotype: ${allele1}/${allele2} - No increased myopathy risk`);
    alerts.push('💡 Still monitor for muscle symptoms (other risk factors exist)');
  } else {
    alerts.push('⚠️ UNKNOWN FUNCTION STATUS');
    alerts.push('⚠️ Use CONSERVATIVE statin dosing');
    alerts.push('⚠️ SIMVASTATIN: Limit to ≤40mg/day');
    alerts.push('💡 Consider genetic testing for SLCO1B1*5');
    alerts.push('💡 Monitor closely for muscle symptoms');
  }

  return alerts;
}

/**
 * Determine SLCO1B1 diplotype from genotypes array - v2 API
 */
function determineSLCO1B1DiplotypeV2(
  genotypes: Array<{ rsid: string; genotype: string }>
): SLCO1B1Diplotype {
  const rs4149056 = extractAndNormalize(genotypes, 'rs4149056');
  const alleles = genotypeToDiplotype(rs4149056 || 'Unknown');
  const phenotypeResult = diplotypeToPhenotype(alleles.allele1, alleles.allele2);

  return {
    allele1: alleles.allele1,
    allele2: alleles.allele2,
    phenotype: phenotypeResult.phenotype as any,
    functionScore: phenotypeResult.functionScore,
    confidence: alleles.confidence
  };
}

/**
 * Main SLCO1B1 analysis function - v2 API
 *
 * @param genotypes - Array of genotype objects from 23andMe
 * @param provider - Data provider ('23andme' or 'unknown')
 * @returns Comprehensive SLCO1B1 analysis results
 */
export function analyzeSLCO1B1(
  genotypes: Array<{ rsid: string; genotype: string }>,

  _provider: GeneticProvider = '23andme'
): SLCO1B1AnalysisResult {
  // Determine diplotype
  const diplotype = determineSLCO1B1DiplotypeV2(genotypes);

  // Generate recommendations
  const statinRecommendations = generateStatinRecommendations(diplotype);
  const safetyAlerts = generateSafetyAlerts(diplotype);

  // Clinical summary
  const clinicalSummary = `
SLCO1B1 TRANSPORTER FUNCTION
Diplotype: ${diplotype.allele1}/${diplotype.allele2}
Phenotype: ${diplotype.phenotype}
Function Score: ${diplotype.functionScore.toFixed(2)} (0=none, 2=normal)
Confidence: ${diplotype.confidence}

SLCO1B1 encodes OATP1B1, the primary hepatic uptake transporter for statins.
Reduced function leads to HIGHER statin blood levels and INCREASED myopathy risk.

${diplotype.phenotype === 'Poor Function'
      ? 'You have VERY LOW OATP1B1 function (~25-30% of normal). This causes:\n- 16-17x INCREASED MYOPATHY RISK with simvastatin\n- 2-3x increased risk with atorvastatin\n- CPIC recommends AVOIDING simvastatin or using MAX 20mg/day\n- Pravastatin, rosuvastatin, pitavastatin are PREFERRED (no SLCO1B1 effect)'
      : diplotype.phenotype === 'Decreased Function'
        ? 'You have REDUCED OATP1B1 function (~50-75% of normal). This causes:\n- 4-5x INCREASED MYOPATHY RISK with simvastatin\n- 1.5-2x increased risk with atorvastatin\n- CPIC recommends LIMITING simvastatin to MAX 40mg/day\n- Consider pravastatin, rosuvastatin, or pitavastatin'
        : diplotype.phenotype === 'Normal Function'
          ? 'You have NORMAL OATP1B1 function. Standard statin dosing is appropriate.\nNo SLCO1B1-related increase in myopathy risk.'
          : 'Your SLCO1B1 status could not be determined. Use conservative statin dosing.'}

STATIN MYOPATHY RISK SPECTRUM:
HIGHEST RISK: Simvastatin 80mg (AVOID in poor/decreased function)
HIGH RISK: Simvastatin 40mg, Atorvastatin 80mg
MODERATE RISK: Atorvastatin ≤40mg, Lovastatin
LOW RISK: Pravastatin, Rosuvastatin, Pitavastatin (NOT affected by SLCO1B1)

GENOTYPE DETAILS:
• rs4149056 (SLCO1B1*5): ${diplotype.allele1}/${diplotype.allele2} (${diplotype.confidence} confidence)

CLINICAL PEARLS:
• Simvastatin 80mg has FDA boxed warning for myopathy risk
• Myopathy symptoms: Muscle pain, weakness, dark urine, CK elevation >10x ULN
• ~30-50% of patients carry at least one *5 allele (decreased function)
• Pharmacogenetic testing recommended before high-dose simvastatin
  `.trim();

  // Limitations
  const limitations = [
    '23andMe covers only rs4149056 (*5 allele), not rs2306283 required for *15',
    'Does not detect rare SLCO1B1 variants',
    'Myopathy risk affected by other factors: age, medications (fibrates, cyclosporine), renal function',
    'Does not account for drug-drug interactions',
    'Only applies to statins metabolized by SLCO1B1 (not all statins)'
  ];

  // Guidelines
  const guidelines = {
    cpic: 'CPIC Guideline for SLCO1B1 and Simvastatin (PMID: 24918167)',
    fda: [
      'FDA Drug Label: Simvastatin - Increased myopathy risk with SLCO1B1*5',
      'FDA Boxed Warning: Simvastatin 80mg - Increased myopathy/rhabdomyolysis risk'
    ]
  };

  return {
    gene: 'SLCO1B1',
    diplotype,
    drugs: statinRecommendations,
    clinicalSummary,
    safetyAlerts,
    confidence: diplotype.confidence,
    limitations,
    guidelines
  };
}
