/**
 * CYP2C9 Pharmacogenomics Analyzer
 * 
 * Clinical Significance:
 * - Metabolizes ~15% of all drugs including warfarin (most critical)
 * - Warfarin is #1 cause of drug-related ER visits in US
 * - Also affects phenytoin, NSAIDs, sulfonylureas
 * 
 * Star Alleles Covered:
 * *1 (reference), *2, *3, *5, *6, *8, *11
 * 
 * Integration: Works with VKORC1 rs9923231 for complete warfarin dosing
 */

export interface CYP2C9Genotype {
  rsid: string;
  genotype: string; // e.g., "CT", "AA"
}

export interface CYP2C9StarAllele {
  allele: string;
  function: 'Normal' | 'Decreased' | 'No function';
  definingVariants: string[];
  activityScore: number; // 0 = no function, 0.5 = decreased, 1.0 = normal
}

export interface CYP2C9Diplotype {
  allele1: string;
  allele2: string;
  totalActivityScore: number;
  phenotype: 'Normal Metabolizer' | 'Intermediate Metabolizer' | 'Poor Metabolizer';
  confidence: 'High' | 'Moderate' | 'Low';
}

export interface WarfarinDosing {
  baselineRecommendation: string;
  vkorcImpact: string;
  combinedGuidance: string;
  weeklyDoseEstimate: string;
  monitoringAdvice: string;
}

export interface CYP2C9DrugRecommendation {
  drug: string;
  category: string;
  recommendation: string;
  implication: string;
  alternativeTherapies?: string[];
  evidenceLevel: 'Strong' | 'Moderate' | 'Weak';
  source: string;
}

export interface CYP2C9AnalysisResult {
  diplotype: CYP2C9Diplotype;
  drugRecommendations: CYP2C9DrugRecommendation[];
  warfarinDosing?: WarfarinDosing;
  clinicalSummary: string;
  safetyAlerts: string[];
}

// ============================================================================
// STAR ALLELE DEFINITIONS
// ============================================================================

const CYP2C9_STAR_ALLELES: CYP2C9StarAllele[] = [
  {
    allele: '*1',
    function: 'Normal',
    definingVariants: [], // Reference allele
    activityScore: 1.0
  },
  {
    allele: '*2',
    function: 'Decreased',
    definingVariants: ['rs1799853'], // 430C>T (Arg144Cys)
    activityScore: 0.5
  },
  {
    allele: '*3',
    function: 'No function',
    definingVariants: ['rs1057910'], // 1075A>C (Ile359Leu)
    activityScore: 0.0
  },
  {
    allele: '*5',
    function: 'No function',
    definingVariants: ['rs28371686'], // 1080C>G (Asp360Glu)
    activityScore: 0.0
  },
  {
    allele: '*6',
    function: 'No function',
    definingVariants: ['rs9332131'], // Deletion
    activityScore: 0.0
  },
  {
    allele: '*8',
    function: 'Decreased',
    definingVariants: ['rs7900194'], // 449G>A (Arg150His)
    activityScore: 0.5
  },
  {
    allele: '*11',
    function: 'Decreased',
    definingVariants: ['rs28371685'], // 1003C>T (Arg335Trp)
    activityScore: 0.5
  }
];

// ============================================================================
// DIPLOTYPE INFERENCE
// ============================================================================

function inferCYP2C9Allele(genotypes: CYP2C9Genotype[]): string[] {
  const detectedAlleles: Set<string> = new Set(['*1']); // Start with reference
  
  // Check each star allele for presence
  for (const starAllele of CYP2C9_STAR_ALLELES) {
    if (starAllele.allele === '*1') continue;
    
    const hasAllDefiningVariants = starAllele.definingVariants.every(rsid => {
      const genotype = genotypes.find(g => g.rsid === rsid);
      if (!genotype) return false;
      
      // Check if variant is present (heterozygous or homozygous)
      return genotype.genotype !== getWildTypeGenotype(rsid);
    });
    
    if (hasAllDefiningVariants) {
      detectedAlleles.add(starAllele.allele);
    }
  }
  
  return Array.from(detectedAlleles);
}

function getWildTypeGenotype(rsid: string): string {
  // Wild-type genotypes for each defining variant
  const wildTypes: Record<string, string> = {
    'rs1799853': 'CC', // *2
    'rs1057910': 'AA', // *3
    'rs28371686': 'CC', // *5
    'rs9332131': 'AA', // *6 (simplified)
    'rs7900194': 'GG', // *8
    'rs28371685': 'CC'  // *11
  };
  return wildTypes[rsid] || 'unknown';
}

export function inferCYP2C9Diplotype(genotypes: CYP2C9Genotype[]): CYP2C9Diplotype {
  const possibleAlleles = inferCYP2C9Allele(genotypes);
  
  // Determine diplotype based on genotypes
  let allele1 = '*1';
  let allele2 = '*1';
  let confidence: 'High' | 'Moderate' | 'Low' = 'High';
  
  // Check rs1799853 (*2)
  const rs1799853 = genotypes.find(g => g.rsid === 'rs1799853');
  const has2Allele = rs1799853 && rs1799853.genotype !== 'CC';
  
  // Check rs1057910 (*3)
  const rs1057910 = genotypes.find(g => g.rsid === 'rs1057910');
  const has3Allele = rs1057910 && rs1057910.genotype !== 'AA';
  
  // Determine diplotype
  if (has3Allele && has2Allele) {
    // Compound heterozygote or homozygote
    if (rs1057910?.genotype === 'AC' && rs1799853?.genotype === 'CT') {
      allele1 = '*2';
      allele2 = '*3';
    } else if (rs1057910?.genotype === 'CC') {
      allele1 = '*3';
      allele2 = '*3';
    } else if (rs1799853?.genotype === 'TT') {
      allele1 = '*2';
      allele2 = '*2';
    }
  } else if (has3Allele) {
    if (rs1057910?.genotype === 'AC') {
      allele1 = '*1';
      allele2 = '*3';
    } else if (rs1057910?.genotype === 'CC') {
      allele1 = '*3';
      allele2 = '*3';
    }
  } else if (has2Allele) {
    if (rs1799853?.genotype === 'CT') {
      allele1 = '*1';
      allele2 = '*2';
    } else if (rs1799853?.genotype === 'TT') {
      allele1 = '*2';
      allele2 = '*2';
    }
  }
  
  // Calculate total activity score
  const score1 = CYP2C9_STAR_ALLELES.find(a => a.allele === allele1)?.activityScore || 1.0;
  const score2 = CYP2C9_STAR_ALLELES.find(a => a.allele === allele2)?.activityScore || 1.0;
  const totalActivityScore = score1 + score2;
  
  // Determine phenotype based on activity score
  let phenotype: 'Normal Metabolizer' | 'Intermediate Metabolizer' | 'Poor Metabolizer';
  
  if (totalActivityScore >= 1.5) {
    phenotype = 'Normal Metabolizer';
  } else if (totalActivityScore >= 0.5) {
    phenotype = 'Intermediate Metabolizer';
  } else {
    phenotype = 'Poor Metabolizer';
  }
  
  // Adjust confidence based on data availability
  if (!rs1799853 || !rs1057910) {
    confidence = 'Moderate';
  }
  
  return {
    allele1,
    allele2,
    totalActivityScore,
    phenotype,
    confidence
  };
}

// ============================================================================
// WARFARIN DOSING WITH VKORC1 INTEGRATION
// ============================================================================

export function calculateWarfarinDosing(
  cyp2c9Diplotype: CYP2C9Diplotype,
  vkorcGenotype?: string // rs9923231 genotype
): WarfarinDosing {
  const { allele1, allele2, phenotype } = cyp2c9Diplotype;
  
  // Base warfarin dosing based on CYP2C9
  let baselineRecommendation = '';
  let weeklyDoseEstimate = '';
  
  if (phenotype === 'Poor Metabolizer') {
    baselineRecommendation = 'START LOW: 25-50% dose reduction recommended. Significantly reduced warfarin metabolism.';
    weeklyDoseEstimate = '10-15 mg/week (vs. 35 mg/week standard)';
  } else if (phenotype === 'Intermediate Metabolizer') {
    baselineRecommendation = 'MODERATE REDUCTION: 15-30% dose reduction recommended. Reduced warfarin metabolism.';
    weeklyDoseEstimate = '20-28 mg/week (vs. 35 mg/week standard)';
  } else {
    baselineRecommendation = 'STANDARD DOSING: Normal warfarin metabolism. Start with standard protocol.';
    weeklyDoseEstimate = '30-40 mg/week (standard range)';
  }
  
  // VKORC1 impact
  let vkorcImpact = '';
  let combinedGuidance = '';
  
  if (vkorcGenotype) {
    if (vkorcGenotype === 'AA') {
      vkorcImpact = 'VKORC1 AA: HIGH warfarin sensitivity. Requires 30-50% dose reduction.';
      weeklyDoseEstimate = adjustDoseForVKORC1(weeklyDoseEstimate, 'AA');
    } else if (vkorcGenotype === 'AG' || vkorcGenotype === 'GA') {
      vkorcImpact = 'VKORC1 AG: MODERATE warfarin sensitivity. Requires 15-25% dose reduction.';
      weeklyDoseEstimate = adjustDoseForVKORC1(weeklyDoseEstimate, 'AG');
    } else {
      vkorcImpact = 'VKORC1 GG: Normal warfarin sensitivity.';
    }
    
    // Combined guidance
    if (phenotype === 'Poor Metabolizer' && (vkorcGenotype === 'AA' || vkorcGenotype === 'AG')) {
      combinedGuidance = '⚠️ HIGH RISK: Both CYP2C9 and VKORC1 variants present. START VERY LOW (0.5-1mg daily). Close INR monitoring required.';
    } else if (phenotype === 'Intermediate Metabolizer' && vkorcGenotype === 'AA') {
      combinedGuidance = '⚠️ MODERATE-HIGH RISK: Combination requires careful dose titration. Start 1-2mg daily.';
    } else {
      combinedGuidance = `Combined CYP2C9 ${phenotype} + ${vkorcImpact}. Use pharmacogenomic dosing algorithm.`;
    }
  } else {
    vkorcImpact = 'VKORC1 status unknown. Consider genetic testing for complete warfarin dosing guidance.';
    combinedGuidance = baselineRecommendation;
  }
  
  return {
    baselineRecommendation,
    vkorcImpact,
    combinedGuidance,
    weeklyDoseEstimate,
    monitoringAdvice: 'Weekly INR monitoring for first month, then per protocol. Target INR typically 2.0-3.0.'
  };
}

function adjustDoseForVKORC1(doseRange: string, vkorcGenotype: string): string {
  if (vkorcGenotype === 'AA') {
    return doseRange.replace(/(\d+)-(\d+)/, (match, low, high) => {
      const newLow = Math.round(parseInt(low) * 0.5);
      const newHigh = Math.round(parseInt(high) * 0.6);
      return `${newLow}-${newHigh}`;
    });
  } else if (vkorcGenotype === 'AG') {
    return doseRange.replace(/(\d+)-(\d+)/, (match, low, high) => {
      const newLow = Math.round(parseInt(low) * 0.75);
      const newHigh = Math.round(parseInt(high) * 0.85);
      return `${newLow}-${newHigh}`;
    });
  }
  return doseRange;
}

// ============================================================================
// DRUG RECOMMENDATIONS DATABASE
// ============================================================================

const CYP2C9_DRUG_RECOMMENDATIONS: CYP2C9DrugRecommendation[] = [
  // WARFARIN (Most Critical)
  {
    drug: 'Warfarin',
    category: 'Anticoagulant',
    recommendation: 'Poor Metabolizers: Use pharmacogenomic dosing algorithm. Start at 0.5-2mg daily (50-75% reduction). Consider alternative anticoagulant.',
    implication: 'Significantly increased bleeding risk with standard dosing. Slow warfarin metabolism.',
    alternativeTherapies: ['Apixaban (Eliquis)', 'Rivaroxaban (Xarelto)', 'Dabigatran (Pradaxa)'],
    evidenceLevel: 'Strong',
    source: 'CPIC'
  },
  {
    drug: 'Warfarin',
    category: 'Anticoagulant',
    recommendation: 'Intermediate Metabolizers: Use pharmacogenomic dosing algorithm. Start at 2-3mg daily (25-50% reduction).',
    implication: 'Moderately increased bleeding risk with standard dosing.',
    evidenceLevel: 'Strong',
    source: 'CPIC'
  },
  {
    drug: 'Warfarin',
    category: 'Anticoagulant',
    recommendation: 'Normal Metabolizers: Standard dosing protocol. Start at 5mg daily for most patients.',
    implication: 'Normal warfarin metabolism and risk profile.',
    evidenceLevel: 'Strong',
    source: 'CPIC'
  },
  
  // PHENYTOIN
  {
    drug: 'Phenytoin (Dilantin)',
    category: 'Anticonvulsant',
    recommendation: 'Poor Metabolizers: Start at 25-50% reduced dose. Increase slowly. Monitor levels closely.',
    implication: 'Increased risk of phenytoin toxicity (ataxia, nystagmus, cognitive impairment).',
    alternativeTherapies: ['Levetiracetam (Keppra)', 'Lamotrigine'],
    evidenceLevel: 'Strong',
    source: 'CPIC'
  },
  {
    drug: 'Phenytoin (Dilantin)',
    category: 'Anticonvulsant',
    recommendation: 'Intermediate Metabolizers: Start at reduced dose (15-30% reduction). Titrate carefully.',
    implication: 'Moderately increased risk of adverse effects.',
    evidenceLevel: 'Moderate',
    source: 'CPIC'
  },
  {
    drug: 'Phenytoin (Dilantin)',
    category: 'Anticonvulsant',
    recommendation: 'Normal Metabolizers: Standard dosing. 300mg daily typical maintenance.',
    implication: 'Normal phenytoin metabolism.',
    evidenceLevel: 'Strong',
    source: 'CPIC'
  },
  
  // NSAIDs
  {
    drug: 'Celecoxib (Celebrex)',
    category: 'NSAID/COX-2 Inhibitor',
    recommendation: 'Poor Metabolizers: Start at 50% reduced dose. Maximum 100mg daily.',
    implication: 'Increased celecoxib exposure and GI/cardiovascular risk.',
    alternativeTherapies: ['Acetaminophen', 'Topical NSAIDs'],
    evidenceLevel: 'Moderate',
    source: 'FDA Label'
  },
  {
    drug: 'Celecoxib (Celebrex)',
    category: 'NSAID/COX-2 Inhibitor',
    recommendation: 'Intermediate Metabolizers: Consider dose reduction. Start at lowest effective dose.',
    implication: 'Moderately increased celecoxib exposure.',
    evidenceLevel: 'Moderate',
    source: 'FDA Label'
  },
  {
    drug: 'Celecoxib (Celebrex)',
    category: 'NSAID/COX-2 Inhibitor',
    recommendation: 'Normal Metabolizers: Standard dosing. 100-200mg twice daily.',
    implication: 'Normal celecoxib metabolism.',
    evidenceLevel: 'Moderate',
    source: 'FDA Label'
  },
  {
    drug: 'Ibuprofen',
    category: 'NSAID',
    recommendation: 'Poor/Intermediate Metabolizers: Minor CYP2C9 involvement. Standard dosing with caution.',
    implication: 'Primarily metabolized by CYP2C9 but less clinical impact than celecoxib.',
    evidenceLevel: 'Weak',
    source: 'Pharmacology'
  },
  {
    drug: 'Flurbiprofen',
    category: 'NSAID',
    recommendation: 'Poor Metabolizers: Consider dose reduction or alternative NSAID.',
    implication: 'Significant CYP2C9 metabolism. Increased exposure in poor metabolizers.',
    evidenceLevel: 'Moderate',
    source: 'FDA Label'
  },
  
  // SULFONYLUREAS
  {
    drug: 'Glipizide (Glucotrol)',
    category: 'Sulfonylurea',
    recommendation: 'Poor Metabolizers: Start at 50% reduced dose. Monitor glucose closely.',
    implication: 'Increased hypoglycemia risk due to reduced clearance.',
    alternativeTherapies: ['Metformin', 'DPP-4 inhibitors', 'GLP-1 agonists'],
    evidenceLevel: 'Moderate',
    source: 'FDA Label'
  },
  {
    drug: 'Glipizide (Glucotrol)',
    category: 'Sulfonylurea',
    recommendation: 'Intermediate Metabolizers: Consider dose reduction. Start low and titrate.',
    implication: 'Moderately increased hypoglycemia risk.',
    evidenceLevel: 'Moderate',
    source: 'FDA Label'
  },
  {
    drug: 'Tolbutamide',
    category: 'Sulfonylurea',
    recommendation: 'Poor Metabolizers: Avoid. Use alternative diabetes medication.',
    implication: 'Heavily dependent on CYP2C9. Very high hypoglycemia risk.',
    alternativeTherapies: ['Metformin', 'Insulin'],
    evidenceLevel: 'Strong',
    source: 'Pharmacology'
  },
  {
    drug: 'Glyburide (DiaBeta)',
    category: 'Sulfonylurea',
    recommendation: 'Poor/Intermediate Metabolizers: Use with caution. Consider alternative.',
    implication: 'CYP2C9 and CYP3A4 metabolism. Reduced clearance possible.',
    evidenceLevel: 'Moderate',
    source: 'FDA Label'
  },
  
  // OTHER MEDICATIONS
  {
    drug: 'Losartan (Cozaar)',
    category: 'ARB/Antihypertensive',
    recommendation: 'Poor Metabolizers: Reduced formation of active metabolite. May have decreased efficacy.',
    implication: 'Losartan requires CYP2C9 activation. Consider alternative ARB.',
    alternativeTherapies: ['Valsartan', 'Telmisartan', 'Irbesartan'],
    evidenceLevel: 'Moderate',
    source: 'Pharmacology'
  },
  {
    drug: 'Fluvastatin (Lescol)',
    category: 'Statin',
    recommendation: 'Poor Metabolizers: Start at low dose. Monitor for myopathy.',
    implication: 'Primarily metabolized by CYP2C9. Increased exposure.',
    alternativeTherapies: ['Atorvastatin', 'Rosuvastatin'],
    evidenceLevel: 'Moderate',
    source: 'FDA Label'
  }
];

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export function analyzeCYP2C9(
  genotypes: CYP2C9Genotype[],
  vkorcGenotype?: string
): CYP2C9AnalysisResult {
  // 1. Infer diplotype
  const diplotype = inferCYP2C9Diplotype(genotypes);
  
  // 2. Get relevant drug recommendations
  const drugRecommendations = CYP2C9_DRUG_RECOMMENDATIONS.filter(rec => {
    if (diplotype.phenotype === 'Poor Metabolizer') {
      return rec.recommendation.includes('Poor Metabolizer');
    } else if (diplotype.phenotype === 'Intermediate Metabolizer') {
      return rec.recommendation.includes('Intermediate Metabolizer');
    } else {
      return rec.recommendation.includes('Normal Metabolizer');
    }
  });
  
  // 3. Calculate warfarin dosing if applicable
  const warfarinDosing = calculateWarfarinDosing(diplotype, vkorcGenotype);
  
  // 4. Generate clinical summary
  const clinicalSummary = generateClinicalSummary(diplotype, warfarinDosing);
  
  // 5. Generate safety alerts
  const safetyAlerts = generateSafetyAlerts(diplotype, vkorcGenotype);
  
  return {
    diplotype,
    drugRecommendations,
    warfarinDosing,
    clinicalSummary,
    safetyAlerts
  };
}

function generateClinicalSummary(
  diplotype: CYP2C9Diplotype,
  warfarinDosing: WarfarinDosing
): string {
  const { allele1, allele2, phenotype, totalActivityScore } = diplotype;
  
  let summary = `CYP2C9 Diplotype: ${allele1}/${allele2} (Activity Score: ${totalActivityScore})\n`;
  summary += `Metabolizer Status: ${phenotype}\n\n`;
  
  if (phenotype === 'Poor Metabolizer') {
    summary += `⚠️ CRITICAL: You are a CYP2C9 Poor Metabolizer (1-3% of population).\n\n`;
    summary += `This significantly affects:\n`;
    summary += `• WARFARIN: Requires 50-75% dose reduction. High bleeding risk with standard dosing.\n`;
    summary += `• PHENYTOIN: Requires 25-50% dose reduction. Increased toxicity risk.\n`;
    summary += `• CELECOXIB: Requires 50% dose reduction. Consider alternatives.\n`;
    summary += `• SULFONYLUREAS: Increased hypoglycemia risk. Prefer metformin.\n\n`;
    summary += `${warfarinDosing.combinedGuidance}`;
  } else if (phenotype === 'Intermediate Metabolizer') {
    summary += `⚠️ MODERATE IMPACT: You are a CYP2C9 Intermediate Metabolizer (15-20% of population).\n\n`;
    summary += `This moderately affects:\n`;
    summary += `• WARFARIN: Requires 15-30% dose reduction.\n`;
    summary += `• PHENYTOIN: May require dose adjustment.\n`;
    summary += `• NSAIDs: Use lowest effective doses.\n`;
    summary += `• SULFONYLUREAS: Monitor for hypoglycemia.\n\n`;
    summary += `${warfarinDosing.combinedGuidance}`;
  } else {
    summary += `✓ NORMAL: You are a CYP2C9 Normal Metabolizer (75-80% of population).\n\n`;
    summary += `Standard dosing appropriate for most CYP2C9-metabolized medications.\n`;
    summary += `Warfarin dosing: ${warfarinDosing.baselineRecommendation}\n`;
    if (warfarinDosing.vkorcImpact) {
      summary += `${warfarinDosing.vkorcImpact}`;
    }
  }
  
  return summary;
}

function generateSafetyAlerts(
  diplotype: CYP2C9Diplotype,
  vkorcGenotype?: string
): string[] {
  const alerts: string[] = [];
  const { phenotype } = diplotype;
  
  if (phenotype === 'Poor Metabolizer') {
    alerts.push('🚨 CRITICAL: CYP2C9 Poor Metabolizer - Warfarin requires 50-75% dose reduction');
    alerts.push('⚠️ HIGH RISK: Phenytoin toxicity risk - Start at 25-50% reduced dose');
    alerts.push('⚠️ CAUTION: Celecoxib maximum dose 100mg daily (vs 200mg standard)');
    alerts.push('⚠️ CAUTION: Avoid tolbutamide - Use alternative diabetes medication');
  } else if (phenotype === 'Intermediate Metabolizer') {
    alerts.push('⚠️ MODERATE: CYP2C9 Intermediate Metabolizer - Warfarin requires 15-30% dose reduction');
    alerts.push('⚠️ CAUTION: Monitor phenytoin levels closely');
  }
  
  // VKORC1 + CYP2C9 combination alerts
  if (vkorcGenotype === 'AA' && phenotype !== 'Normal Metabolizer') {
    alerts.push('🚨 VERY HIGH RISK: CYP2C9 + VKORC1 variants - Warfarin START VERY LOW (0.5-1mg)');
  } else if (vkorcGenotype === 'AA') {
    alerts.push('⚠️ HIGH RISK: VKORC1 AA genotype - Warfarin requires 30-50% dose reduction');
  } else if ((vkorcGenotype === 'AG' || vkorcGenotype === 'GA') && phenotype === 'Poor Metabolizer') {
    alerts.push('🚨 HIGH RISK: CYP2C9 + VKORC1 combination - Warfarin requires significant dose reduction');
  }
  
  return alerts;
}

// ============================================================================
// EXPORT TYPES AND FUNCTIONS
// ============================================================================

export default {
  analyzeCYP2C9,
  inferCYP2C9Diplotype,
  calculateWarfarinDosing,
  CYP2C9_STAR_ALLELES,
  CYP2C9_DRUG_RECOMMENDATIONS
};
