/**
 * CYP2D6 Pharmacogenomics Analyzer v2
 *
 * CYP2D6 encodes cytochrome P450 2D6, responsible for ~25% of all prescription drug metabolism.
 * This is THE most polymorphic CYP gene with 150+ star alleles defined.
 *
 * CRITICAL CLINICAL CONTEXT:
 * - Poor metabolizers (PM): 5-10% Europeans, <1% East Asians, 1-2% Africans
 * - Intermediate metabolizers (IM): 10-15% Europeans, 50%+ East Asians
 * - Normal metabolizers (NM): 70-80% Europeans
 * - Ultrarapid metabolizers (UM): 1-2% Europeans, 30%+ in some populations
 *
 * KEY SUBSTRATES (PERSONAL RELEVANCE):
 * 🔥 AMPHETAMINES:
 *    - Dextroamphetamine (Adderall, Vyvanse)
 *    - CYP2D6 is a MINOR pathway (~30% metabolism)
 *    - BUT phenotype affects:
 *      • Drug levels and efficacy
 *      • Side effect profile (anxiety, insomnia, cardiovascular)
 *      • Optimal dosing requirements
 *    - Poor metabolizers: Higher drug levels → more side effects
 *    - Ultrarapid metabolizers: Lower drug levels → "medication doesn't work"
 *
 * OTHER CRITICAL SUBSTRATES:
 * - Codeine → Morphine (prodrug activation) - FATAL in ultrarapids (FDA BLACK BOX)
 * - Tramadol → O-desmethyltramadol (prodrug activation)
 * - Antidepressants: Fluoxetine, paroxetine, venlafaxine, amitriptyline, nortriptyline
 * - Antipsychotics: Haloperidol, risperidone, aripiprazole
 * - Tamoxifen → Endoxifen (prodrug activation) - breast cancer treatment
 * - Beta blockers: Metoprolol, carvedilol, propranolol
 *
 * CRITICAL VARIANTS:
 * - CYP2D6*4 (rs3892097): Most common no-function allele in Europeans (~20% carrier frequency)
 * - CYP2D6*10 (rs1065852): Decreased function, extremely common in East Asians (40-50%)
 * - CYP2D6*17 (rs28371706): Decreased function, common in Africans (20-35%)
 * - CYP2D6*41 (rs28371725): Decreased function, common in Europeans (8-10%)
 * - CYP2D6*6 (rs5030655): No function frameshift deletion (~1% Europeans)
 *
 * COMPLEXITY NOTES:
 * ⚠️ CYP2D6 is THE MOST COMPLEX pharmacogenomics gene:
 * - Copy number variants (gene deletions *5, duplications *1xN, *2xN)
 * - Hybrid alleles (CYP2D6/CYP2D7 gene conversions)
 * - 150+ star alleles with various functional impacts
 * - Phase ambiguity when multiple variants present
 *
 * 🚨 LIMITATIONS OF SNP-ARRAY DATA:
 * - 23andMe/AncestryDNA SNP arrays CANNOT detect:
 *   • Gene deletions (*5 allele)
 *   • Gene duplications (*1xN, *2xN - ultrarapid metabolizers)
 *   • Structural variants
 * - This analyzer provides BEST EFFORT phenotyping from available SNPs
 * - True CYP2D6 phenotyping requires targeted genotyping or sequencing
 *
 * CLINICAL IMPACT:
 * - FDA BLACK BOX: Codeine in ultrarapid pediatrics (fatal morphine toxicity)
 * - Tamoxifen failure in poor metabolizers → breast cancer recurrence
 * - Antidepressant non-response in 60% of poor metabolizers
 * - Beta blocker toxicity in poor metabolizers
 *
 * CPIC GUIDELINES:
 * - Level A evidence for codeine, tramadol, tricyclic antidepressants
 * - Level B evidence for SSRIs, tamoxifen
 * - FDA guidance for 15+ medications
 *
 * REFERENCES:
 * - CPIC Guideline: PMID 22205192, 27997040, 28002639
 * - PharmVar Database: www.pharmvar.org/gene/CYP2D6
 * - FDA Table of Pharmacogenomic Biomarkers
 */

import { normalizeGenotype, type GeneticProvider, type GenotypeNormalizationResult } from '../utils/genotype-utils';

export interface CYP2D6Diplotype {
  allele1: string;
  allele2: string;
  phenotype: 'Normal Metabolizer' | 'Intermediate Metabolizer' | 'Poor Metabolizer' | 'Ultrarapid Metabolizer' | 'Unknown';
  activityScore: number; // 0.0 to 3.0+ (can exceed 2.0 with duplications)
  confidence: 'high' | 'medium' | 'low';
  phaseAmbiguity?: boolean; // True if multiple variants present, phasing uncertain
  possibleDiplotypes?: string[]; // If phase ambiguous, list possibilities
}

export interface CYP2D6DrugRecommendation {
  drug: string;
  category: string;
  recommendation: string;
  doseAdjustment?: string;
  riskLevel: 'critical' | 'warning' | 'caution' | 'normal' | 'informational';
  alternativeDrugs?: string[];
  monitoring?: string;
  fdaGuidance: boolean;
  cpicLevel?: 'A' | 'B' | 'C';
}

export interface CYP2D6AnalysisResult {
  gene: 'CYP2D6';
  diplotype: CYP2D6Diplotype;
  clinicalSummary: string;
  drugs: CYP2D6DrugRecommendation[];
  safetyAlerts: string[];
  confidence: 'high' | 'medium' | 'low';
  limitations: string[];
  guidelines: string[];
  references: string[];
  normalizedGenotypes: {
    rs3892097?: GenotypeNormalizationResult; // *4
    rs28371725?: GenotypeNormalizationResult; // *41
    rs1065852?: GenotypeNormalizationResult;  // *10
    rs5030655?: GenotypeNormalizationResult;  // *6
    rs28371706?: GenotypeNormalizationResult; // *17
    rs16947?: GenotypeNormalizationResult;    // *2 marker
  };
}

/**
 * CYP2D6 star allele activity scores
 * Based on CPIC guidelines (PMID 27997040)
 *
 * CPIC-compliant activity scores:
 * - 0.0: No function (*3, *4, *5, *6, *7, *8, *11, *12, *13, *14, *15, *16, *18, *19, *20, *21, *38, *40, *42, *44, *56)
 * - 0.25: Significantly decreased (*10, *36, *47)
 * - 0.5: Decreased (*9, *17, *29, *41, *49, *50, *54, *55, *57, *59, *72)
 * - 1.0: Normal (*1, *2, *33, *35)
 * - 1.5: Increased (rare)
 * - 2.0+: Gene duplications (xN) - multiply base activity by copy number
 */
const ALLELE_ACTIVITY: Record<string, number> = {
  // Normal function alleles
  '*1': 1.0,  // Wildtype reference allele
  '*2': 1.0,  // Normal function, common haplotype marker

  // No function alleles (activity = 0.0)
  '*3': 0.0,  // Frameshift deletion
  '*4': 0.0,  // Splicing defect (most common EUR no-function, ~20% carrier freq)
  '*5': 0.0,  // Gene deletion (cannot detect from SNP array)
  '*6': 0.0,  // Frameshift deletion (1 bp deletion, ~1% EUR)
  '*7': 0.0,  // Frameshift deletion
  '*8': 0.0,  // Frameshift deletion
  '*11': 0.0, // Splicing defect
  '*12': 0.0, // Frameshift insertion
  '*13': 0.0, // Frameshift deletion
  '*14': 0.0, // Frameshift/splicing
  '*15': 0.0, // Splicing defect
  '*16': 0.0, // Frameshift deletion
  '*18': 0.0, // Premature stop codon
  '*19': 0.0, // Frameshift deletion
  '*20': 0.0, // Frameshift deletion

  // Significantly decreased function (activity = 0.25)
  '*10': 0.25, // P34S + S486T, extremely common in East Asians (40-50%)
  '*36': 0.25, // V338M + other variants
  '*47': 0.25, // Reduced expression

  // Decreased function (activity = 0.5)
  '*9': 0.5,  // 3bp deletion (AAG deletion at codon 281-282)
  '*17': 0.5, // T107I + others, common in Africans (20-35%)
  '*29': 0.5, // V136I + others
  '*41': 0.5, // Splicing defect, common in Europeans (8-10%)
  '*49': 0.5, // Reduced expression
  '*50': 0.5, // Reduced function
  '*54': 0.5, // Reduced function
  '*55': 0.5, // Reduced function
};

/**
 * Map activity score to CPIC phenotype categories
 *
 * CPIC phenotype definitions (PMID 27997040):
 * - Poor Metabolizer (PM): Activity score 0.0 (two no-function alleles)
 * - Intermediate Metabolizer (IM): Activity score 0.25-1.5 (one functional + one non-functional, or two reduced-function)
 * - Normal Metabolizer (NM): Activity score > 1.5 to 2.0 (two functional alleles)
 * - Ultrarapid Metabolizer (UM): Activity score >2.0 (gene duplications)
 *
 * NOTE: Boundary is at 1.5, not 1.0. *1/*4 (score 1.0) and *1/*10 (score 1.25) are IM, not NM
 */
function activityScoreToPhenotype(activityScore: number): string {
  if (activityScore === 0.0) {
    return 'Poor Metabolizer';
  } else if (activityScore > 0.0 && activityScore <= 1.5) {
    return 'Intermediate Metabolizer';
  } else if (activityScore > 1.5 && activityScore <= 2.0) {
    return 'Normal Metabolizer';
  } else if (activityScore > 2.0) {
    return 'Ultrarapid Metabolizer';
  }
  return 'Unknown';
}

/**
 * Determine CYP2D6 diplotype from genotypes
 *
 * IMPORTANT: This is a SIMPLIFIED implementation for SNP array data
 * True CYP2D6 diplotyping requires:
 * - Copy number variant detection (deletions, duplications)
 * - Long-range phasing (which variants are on the same chromosome)
 * - Comprehensive star allele detection (150+ alleles)
 *
 * This analyzer focuses on the most clinically relevant variants detectable from consumer SNP arrays
 */
export function determineCYP2D6Diplotype(
  rs3892097: string | null,  // *4 defining SNP (G>A, splicing defect)
  rs28371725: string | null, // *41 defining SNP (C>T, splicing defect)
  rs1065852: string | null,  // *10 defining SNP (C>T, P34S)
  rs5030655: string | null,  // *6 defining SNP (G>A, 1-bp frameshift)
  rs28371706: string | null, // *17 defining SNP (C>T, T107I)
  rs16947: string | null,    // *2 haplotype marker (normal function)
  provider: GeneticProvider = 'unknown'
): CYP2D6Diplotype {

  // Normalize all genotypes
  const norm_rs3892097 = normalizeGenotype('rs3892097', rs3892097, provider);   // *4
  const norm_rs28371725 = normalizeGenotype('rs28371725', rs28371725, provider); // *41
  const norm_rs1065852 = normalizeGenotype('rs1065852', rs1065852, provider);   // *10
  const norm_rs5030655 = normalizeGenotype('rs5030655', rs5030655, provider);   // *6
  const norm_rs28371706 = normalizeGenotype('rs28371706', rs28371706, provider); // *17
  const norm_rs16947 = normalizeGenotype('rs16947', rs16947, provider);         // *2

  // Track detected alleles
  const detectedAlleles: string[] = [];

  // Check for *4 (rs3892097 A allele, no function)
  // G/G = no *4, G/A = one *4, A/A = two *4
  const rs3892097_A_count = norm_rs3892097.normalized?.split('').filter(a => a === 'A').length || 0;

  // Check for *41 (rs28371725 T allele, decreased function)
  const rs28371725_T_count = norm_rs28371725.normalized?.split('').filter(a => a === 'T').length || 0;

  // Check for *10 (rs1065852 T allele, significantly decreased function)
  const rs1065852_T_count = norm_rs1065852.normalized?.split('').filter(a => a === 'T').length || 0;

  // Check for *6 (rs5030655 A allele, no function)
  const rs5030655_A_count = norm_rs5030655.normalized?.split('').filter(a => a === 'A').length || 0;

  // Check for *17 (rs28371706 T allele, decreased function)
  const rs28371706_T_count = norm_rs28371706.normalized?.split('').filter(a => a === 'T').length || 0;

  // SIMPLE DIPLOTYPE DETERMINATION
  // This is a simplified algorithm that handles the most common cases
  // More sophisticated phasing algorithms would be needed for comprehensive analysis

  let allele1 = '*1'; // Default to wildtype
  let allele2 = '*1';
  let confidence: 'high' | 'medium' | 'low' = 'high';
  let phaseAmbiguity = false;
  let possibleDiplotypes: string[] = [];

  // Count total variant alleles
  const totalVariants = rs3892097_A_count + rs28371725_T_count + rs1065852_T_count +
                        rs5030655_A_count + rs28371706_T_count;

  // CASE 1: No variants detected → *1/*1
  if (totalVariants === 0) {
    allele1 = '*1';
    allele2 = '*1';
    confidence = 'high';
  }

  // CASE 2: Homozygous for a single variant
  else if (rs3892097_A_count === 2 && totalVariants === 2) {
    allele1 = '*4';
    allele2 = '*4';
    confidence = 'high';
  }
  else if (rs28371725_T_count === 2 && totalVariants === 2) {
    allele1 = '*41';
    allele2 = '*41';
    confidence = 'high';
  }
  else if (rs1065852_T_count === 2 && totalVariants === 2) {
    allele1 = '*10';
    allele2 = '*10';
    confidence = 'high';
  }
  else if (rs5030655_A_count === 2 && totalVariants === 2) {
    allele1 = '*6';
    allele2 = '*6';
    confidence = 'high';
  }
  else if (rs28371706_T_count === 2 && totalVariants === 2) {
    allele1 = '*17';
    allele2 = '*17';
    confidence = 'high';
  }

  // CASE 3: Heterozygous for single variant → variant/*1
  else if (totalVariants === 1) {
    if (rs3892097_A_count === 1) {
      allele1 = '*1';
      allele2 = '*4';
    } else if (rs28371725_T_count === 1) {
      allele1 = '*1';
      allele2 = '*41';
    } else if (rs1065852_T_count === 1) {
      allele1 = '*1';
      allele2 = '*10';
    } else if (rs5030655_A_count === 1) {
      allele1 = '*1';
      allele2 = '*6';
    } else if (rs28371706_T_count === 1) {
      allele1 = '*1';
      allele2 = '*17';
    }
    confidence = 'high';
  }

  // CASE 4: Multiple heterozygous variants → PHASE AMBIGUITY
  // Example: rs3892097 G/A + rs28371725 C/T could be:
  //   - *1/*4 + *41 on same chromosome → impossible (can't have two alleles on one chromosome)
  //   - *4 and *41 on different chromosomes → *4/*41 compound heterozygote
  //   - OR other combinations depending on phasing
  else if (totalVariants === 2) {
    phaseAmbiguity = true;
    confidence = 'medium';

    // Identify which two variants are present
    const variantList: string[] = [];
    if (rs3892097_A_count === 1) variantList.push('*4');
    if (rs28371725_T_count === 1) variantList.push('*41');
    if (rs1065852_T_count === 1) variantList.push('*10');
    if (rs5030655_A_count === 1) variantList.push('*6');
    if (rs28371706_T_count === 1) variantList.push('*17');

    if (variantList.length === 2) {
      // Most likely: compound heterozygote (variants on different chromosomes)
      allele1 = variantList[0];
      allele2 = variantList[1];
      possibleDiplotypes = [
        `${variantList[0]}/${variantList[1]}`,
        `${variantList[0]}/*1`, // Or one could be on *1 background (less likely)
        `${variantList[1]}/*1`
      ];
    }
  }

  // CASE 5: Complex genotypes (3+ variants)
  else {
    phaseAmbiguity = true;
    confidence = 'low';
    allele1 = '*1'; // Default to conservative estimate
    allele2 = '*1';

    // List all detected variants for clinical review
    if (rs3892097_A_count > 0) detectedAlleles.push('*4');
    if (rs28371725_T_count > 0) detectedAlleles.push('*41');
    if (rs1065852_T_count > 0) detectedAlleles.push('*10');
    if (rs5030655_A_count > 0) detectedAlleles.push('*6');
    if (rs28371706_T_count > 0) detectedAlleles.push('*17');
  }

  // Calculate activity score
  const activity1 = ALLELE_ACTIVITY[allele1] ?? 1.0;
  const activity2 = ALLELE_ACTIVITY[allele2] ?? 1.0;
  const activityScore = activity1 + activity2;

  // Determine phenotype
  const phenotype = activityScoreToPhenotype(activityScore) as CYP2D6Diplotype['phenotype'];

  return {
    allele1,
    allele2,
    phenotype,
    activityScore,
    confidence,
    phaseAmbiguity: phaseAmbiguity || undefined,
    possibleDiplotypes: possibleDiplotypes.length > 0 ? possibleDiplotypes : undefined
  };
}

/**
 * Generate amphetamine-specific recommendations
 * 🔥 PERSONAL RELEVANCE: User takes daily amphetamines for ADHD
 */
function generateAmphetamineRecommendations(phenotype: string, activityScore: number): CYP2D6DrugRecommendation[] {
  const recommendations: CYP2D6DrugRecommendation[] = [];

  if (phenotype === 'Poor Metabolizer') {
    recommendations.push({
      drug: 'Amphetamines (Adderall, Vyvanse)',
      category: 'ADHD Stimulant',
      recommendation: '⚠️ POOR METABOLIZER: May experience HIGHER drug levels and MORE SIDE EFFECTS. CYP2D6 handles ~30% of amphetamine metabolism.',
      doseAdjustment: 'Consider LOWER starting dose (25-50% reduction). Titrate slowly. Monitor for cardiovascular side effects (increased heart rate, blood pressure), anxiety, insomnia, appetite suppression.',
      riskLevel: 'warning',
      monitoring: 'Close monitoring of blood pressure, heart rate, anxiety levels. More frequent follow-ups during dose titration.',
      fdaGuidance: false, // No formal FDA guidance for amphetamine + CYP2D6
      cpicLevel: undefined // No CPIC guideline for amphetamines
    });
  } else if (phenotype === 'Intermediate Metabolizer') {
    recommendations.push({
      drug: 'Amphetamines (Adderall, Vyvanse)',
      category: 'ADHD Stimulant',
      recommendation: '💡 INTERMEDIATE METABOLIZER: Moderate impact on amphetamine levels. CYP2D6 is a minor metabolic pathway (~30%).',
      doseAdjustment: 'Standard dosing likely appropriate. Monitor response and side effects. May need slight dose adjustments.',
      riskLevel: 'caution',
      monitoring: 'Standard monitoring of efficacy and side effects (cardiovascular, sleep, appetite).',
      fdaGuidance: false,
      cpicLevel: undefined
    });
  } else if (phenotype === 'Ultrarapid Metabolizer') {
    recommendations.push({
      drug: 'Amphetamines (Adderall, Vyvanse)',
      category: 'ADHD Stimulant',
      recommendation: '⚡ ULTRARAPID METABOLIZER: May experience LOWER drug levels and REDUCED EFFICACY. Drug cleared faster than normal.',
      doseAdjustment: 'May require HIGHER doses for therapeutic effect. If "medication doesn\'t seem to work" at standard doses, ultrarapid CYP2D6 metabolism could be a factor.',
      riskLevel: 'caution',
      monitoring: 'Monitor for inadequate symptom control. May need higher-than-average doses.',
      fdaGuidance: false,
      cpicLevel: undefined
    });
  } else if (phenotype === 'Normal Metabolizer') {
    recommendations.push({
      drug: 'Amphetamines (Adderall, Vyvanse)',
      category: 'ADHD Stimulant',
      recommendation: '✅ NORMAL METABOLIZER: Standard amphetamine metabolism. Expected typical response to medication.',
      doseAdjustment: 'Standard dosing recommended. Adjust based on clinical response.',
      riskLevel: 'normal',
      monitoring: 'Routine monitoring of efficacy and side effects.',
      fdaGuidance: false,
      cpicLevel: undefined
    });
  }

  return recommendations;
}

/**
 * Generate comprehensive drug recommendations based on phenotype
 */
function generateDrugRecommendations(diplotype: CYP2D6Diplotype): CYP2D6DrugRecommendation[] {
  const recommendations: CYP2D6DrugRecommendation[] = [];
  const { phenotype, activityScore } = diplotype;

  // 🔥 AMPHETAMINES (Personal priority #1)
  recommendations.push(...generateAmphetamineRecommendations(phenotype, activityScore));

  // CODEINE (CPIC Level A, FDA BLACK BOX)
  if (phenotype === 'Poor Metabolizer') {
    recommendations.push({
      drug: 'Codeine',
      category: 'Opioid Analgesic',
      recommendation: '🚨 AVOID CODEINE - Poor metabolizers cannot convert codeine to morphine (active form). NO analgesic effect.',
      alternativeDrugs: ['Morphine', 'Oxycodone', 'Hydromorphone', 'Tramadol (with caution)'],
      riskLevel: 'critical',
      fdaGuidance: true,
      cpicLevel: 'A'
    });
  } else if (phenotype === 'Ultrarapid Metabolizer') {
    recommendations.push({
      drug: 'Codeine',
      category: 'Opioid Analgesic',
      recommendation: '🚨 AVOID CODEINE - Ultrarapid metabolizers convert too much codeine to morphine. FATAL OVERDOSE RISK, especially in children (FDA BLACK BOX WARNING).',
      alternativeDrugs: ['Morphine', 'Oxycodone', 'Hydromorphone'],
      riskLevel: 'critical',
      fdaGuidance: true,
      cpicLevel: 'A'
    });
  } else if (phenotype === 'Intermediate Metabolizer') {
    recommendations.push({
      drug: 'Codeine',
      category: 'Opioid Analgesic',
      recommendation: '⚠️ REDUCED EFFICACY - Intermediate metabolizers have reduced codeine → morphine conversion. May need higher doses or alternative.',
      alternativeDrugs: ['Morphine', 'Oxycodone', 'Hydromorphone'],
      riskLevel: 'warning',
      fdaGuidance: true,
      cpicLevel: 'A'
    });
  }

  // TRAMADOL (CPIC Level A)
  if (phenotype === 'Poor Metabolizer') {
    recommendations.push({
      drug: 'Tramadol',
      category: 'Opioid Analgesic',
      recommendation: '⚠️ AVOID TRAMADOL - Poor metabolizers cannot convert tramadol to active metabolite. Reduced analgesic effect.',
      alternativeDrugs: ['Morphine', 'Oxycodone', 'Hydromorphone'],
      riskLevel: 'warning',
      fdaGuidance: true,
      cpicLevel: 'A'
    });
  } else if (phenotype === 'Ultrarapid Metabolizer') {
    recommendations.push({
      drug: 'Tramadol',
      category: 'Opioid Analgesic',
      recommendation: '🚨 AVOID TRAMADOL - Ultrarapid metabolism → toxicity risk.',
      alternativeDrugs: ['Morphine', 'Oxycodone'],
      riskLevel: 'critical',
      fdaGuidance: true,
      cpicLevel: 'A'
    });
  }

  // ANTIDEPRESSANTS (TCAs - CPIC Level A, SSRIs - CPIC Level B)
  if (phenotype === 'Poor Metabolizer') {
    recommendations.push({
      drug: 'Tricyclic Antidepressants (Amitriptyline, Nortriptyline)',
      category: 'Antidepressant',
      recommendation: '⚠️ REDUCE DOSE by 50-75% - Poor metabolizers have 2-10x higher drug levels. Risk of side effects (sedation, anticholinergic effects, cardiac arrhythmias).',
      doseAdjustment: 'Start at 50% of standard dose or less. Consider alternative antidepressant.',
      alternativeDrugs: ['Sertraline', 'Citalopram', 'Escitalopram', 'Mirtazapine', 'Bupropion'],
      riskLevel: 'warning',
      monitoring: 'TDM (therapeutic drug monitoring) recommended. ECG monitoring.',
      fdaGuidance: true,
      cpicLevel: 'A'
    });

    recommendations.push({
      drug: 'SSRIs (Fluoxetine, Paroxetine, Fluvoxamine)',
      category: 'Antidepressant',
      recommendation: '⚠️ REDUCE DOSE by 25-50% or use alternative - Higher risk of side effects in poor metabolizers.',
      doseAdjustment: 'Start low, titrate slowly. Monitor for serotonin syndrome, GI side effects.',
      alternativeDrugs: ['Sertraline', 'Citalopram', 'Escitalopram (less CYP2D6-dependent)'],
      riskLevel: 'warning',
      fdaGuidance: false,
      cpicLevel: 'B'
    });
  } else if (phenotype === 'Ultrarapid Metabolizer') {
    recommendations.push({
      drug: 'Tricyclic Antidepressants',
      category: 'Antidepressant',
      recommendation: '⚠️ May need HIGHER doses due to rapid metabolism. Risk of treatment failure at standard doses.',
      doseAdjustment: 'Monitor response. May need dose increases. TDM recommended.',
      riskLevel: 'caution',
      fdaGuidance: false,
      cpicLevel: 'A'
    });
  }

  // TAMOXIFEN (Breast cancer treatment - CPIC Level A)
  if (phenotype === 'Poor Metabolizer') {
    recommendations.push({
      drug: 'Tamoxifen',
      category: 'Breast Cancer Treatment',
      recommendation: '🚨 CRITICAL - Poor metabolizers have REDUCED EFFICACY. Tamoxifen is a prodrug requiring CYP2D6 conversion to endoxifen (active form). INCREASED RISK OF CANCER RECURRENCE.',
      alternativeDrugs: ['Aromatase inhibitors (letrozole, anastrozole, exemestane) for postmenopausal women'],
      doseAdjustment: 'Consider higher tamoxifen dose OR switch to aromatase inhibitor if postmenopausal.',
      riskLevel: 'critical',
      monitoring: 'Endoxifen level monitoring if available. Close oncology follow-up.',
      fdaGuidance: true,
      cpicLevel: 'A'
    });
  }

  // BETA BLOCKERS
  if (phenotype === 'Poor Metabolizer') {
    recommendations.push({
      drug: 'Beta Blockers (Metoprolol, Carvedilol, Propranolol)',
      category: 'Cardiovascular',
      recommendation: '⚠️ REDUCE DOSE - Poor metabolizers have 2-5x higher drug levels. Risk of bradycardia, hypotension.',
      doseAdjustment: 'Start at 25-50% of standard dose. Titrate based on heart rate and blood pressure.',
      alternativeDrugs: ['Atenolol', 'Bisoprolol (less CYP2D6-dependent)', 'Calcium channel blockers'],
      riskLevel: 'warning',
      monitoring: 'Monitor heart rate and blood pressure closely.',
      fdaGuidance: false
    });
  }

  // ANTIPSYCHOTICS
  if (phenotype === 'Poor Metabolizer') {
    recommendations.push({
      drug: 'Antipsychotics (Risperidone, Aripiprazole, Haloperidol)',
      category: 'Antipsychotic',
      recommendation: '⚠️ REDUCE DOSE by 30-50% - Poor metabolizers at risk of side effects (extrapyramidal symptoms, sedation, metabolic effects).',
      doseAdjustment: 'Start low, go slow. Monitor for extrapyramidal symptoms.',
      riskLevel: 'warning',
      fdaGuidance: false
    });
  }

  return recommendations;
}

/**
 * Generate clinical summary
 */
function generateClinicalSummary(diplotype: CYP2D6Diplotype): string {
  const { allele1, allele2, phenotype, activityScore, confidence, phaseAmbiguity } = diplotype;

  let summary = `CYP2D6 Diplotype: ${allele1}/${allele2}\n`;
  summary += `Phenotype: ${phenotype}\n`;
  summary += `Activity Score: ${activityScore.toFixed(2)}\n`;
  summary += `Confidence: ${confidence.toUpperCase()}\n\n`;

  if (phaseAmbiguity) {
    summary += `⚠️ PHASE AMBIGUITY: Multiple variants detected. True diplotype may differ without long-range phasing data.\n\n`;
  }

  summary += `CLINICAL INTERPRETATION:\n`;

  if (phenotype === 'Poor Metabolizer') {
    summary += `You are a CYP2D6 POOR METABOLIZER (PM). This means you have little to no CYP2D6 enzyme activity. CYP2D6 metabolizes approximately 25% of all prescription drugs, including:\n\n`;
    summary += `• AMPHETAMINES: May experience HIGHER drug levels → more side effects (cardiovascular, anxiety, insomnia)\n`;
    summary += `• CODEINE/TRAMADOL: These prodrugs will NOT work for you - no analgesic effect\n`;
    summary += `• ANTIDEPRESSANTS: May need 50-75% dose reduction to avoid side effects\n`;
    summary += `• TAMOXIFEN: CRITICAL - Reduced cancer treatment efficacy, consider alternatives\n`;
    summary += `• BETA BLOCKERS: May need dose reduction\n\n`;
    summary += `IMPORTANT: Always inform healthcare providers of your Poor Metabolizer status before starting new medications.\n`;
  } else if (phenotype === 'Intermediate Metabolizer') {
    summary += `You are a CYP2D6 INTERMEDIATE METABOLIZER (IM). You have reduced but not absent enzyme activity. This affects ~10-15% of Europeans and >50% of East Asians.\n\n`;
    summary += `• AMPHETAMINES: Moderate impact, may need dose adjustments\n`;
    summary += `• CODEINE/TRAMADOL: Reduced analgesic efficacy\n`;
    summary += `• ANTIDEPRESSANTS: May need dose adjustments\n`;
    summary += `• Most drugs: Close monitoring recommended during dose titration\n`;
  } else if (phenotype === 'Ultrarapid Metabolizer') {
    summary += `You are a CYP2D6 ULTRARAPID METABOLIZER (UM). You have increased enzyme activity, typically due to gene duplications. This affects 1-2% of Europeans and up to 30% in some Middle Eastern/North African populations.\n\n`;
    summary += `• AMPHETAMINES: May experience LOWER drug levels → "medication doesn't work" at standard doses\n`;
    summary += `• CODEINE: 🚨 LIFE-THREATENING RISK - Do not use codeine (especially in children) - FDA BLACK BOX WARNING\n`;
    summary += `• TRAMADOL: Avoid - toxicity risk\n`;
    summary += `• ANTIDEPRESSANTS: May need higher doses for efficacy\n`;
    summary += `• TAMOXIFEN: May have enhanced efficacy (good for breast cancer treatment)\n\n`;
    summary += `⚠️ CRITICAL: Ultrarapid metabolizers should NEVER use codeine or tramadol due to fatal overdose risk.\n`;
  } else if (phenotype === 'Normal Metabolizer') {
    summary += `You are a CYP2D6 NORMAL METABOLIZER (NM). You have typical enzyme activity. Standard drug dosing is appropriate for most CYP2D6 substrates.\n\n`;
    summary += `• AMPHETAMINES: Expected typical response\n`;
    summary += `• CODEINE/TRAMADOL: Normal analgesic effect\n`;
    summary += `• ANTIDEPRESSANTS: Standard dosing\n`;
    summary += `• TAMOXIFEN: Normal efficacy\n`;
  }

  return summary;
}

/**
 * Main CYP2D6 analysis function
 */
export function analyzeCYP2D6(
  genotypes: Array<{ rsid: string; genotype: string }>,
  provider: GeneticProvider = 'unknown'
): CYP2D6AnalysisResult {

  // Extract relevant genotypes
  const rs3892097 = genotypes.find(g => g.rsid === 'rs3892097')?.genotype || null;   // *4
  const rs28371725 = genotypes.find(g => g.rsid === 'rs28371725')?.genotype || null; // *41
  const rs1065852 = genotypes.find(g => g.rsid === 'rs1065852')?.genotype || null;   // *10
  const rs5030655 = genotypes.find(g => g.rsid === 'rs5030655')?.genotype || null;   // *6
  const rs28371706 = genotypes.find(g => g.rsid === 'rs28371706')?.genotype || null; // *17
  const rs16947 = genotypes.find(g => g.rsid === 'rs16947')?.genotype || null;       // *2

  // Determine diplotype
  const diplotype = determineCYP2D6Diplotype(
    rs3892097,
    rs28371725,
    rs1065852,
    rs5030655,
    rs28371706,
    rs16947,
    provider
  );

  // Generate drug recommendations
  const drugs = generateDrugRecommendations(diplotype);

  // Generate clinical summary
  const clinicalSummary = generateClinicalSummary(diplotype);

  // Safety alerts
  const safetyAlerts: string[] = [];
  if (diplotype.phenotype === 'Poor Metabolizer') {
    safetyAlerts.push('🚨 AVOID: Codeine, Tramadol (no analgesic effect)');
    safetyAlerts.push('⚠️ REDUCE DOSE: Tricyclic antidepressants (50-75% reduction)');
    safetyAlerts.push('⚠️ AMPHETAMINES: May experience higher drug levels and more side effects');
    safetyAlerts.push('🚨 TAMOXIFEN: Reduced efficacy - consider aromatase inhibitor');
  } else if (diplotype.phenotype === 'Ultrarapid Metabolizer') {
    safetyAlerts.push('🚨 NEVER USE CODEINE - Fatal overdose risk (FDA BLACK BOX)');
    safetyAlerts.push('🚨 AVOID TRAMADOL - Toxicity risk');
    safetyAlerts.push('⚡ AMPHETAMINES: May need higher doses for efficacy');
  }

  // Limitations
  const limitations: string[] = [
    'SNP array data cannot detect gene deletions (CYP2D6*5) or duplications (*1xN, *2xN)',
    'True CYP2D6 phenotyping requires copy number variant analysis',
    'Phase ambiguity possible with multiple heterozygous variants',
    'This analysis covers major star alleles but not all 150+ known variants',
    'Clinical decisions should incorporate full medication history and patient factors'
  ];

  // Guidelines
  const guidelines = [
    'CPIC Guideline for CYP2D6 and Codeine Therapy (PMID: 22205192)',
    'CPIC Guideline for CYP2D6 and SSRIs (PMID: 27997040)',
    'CPIC Guideline for CYP2D6 and Tricyclic Antidepressants (PMID: 28002639)',
    'PharmVar CYP2D6 Allele Nomenclature: www.pharmvar.org/gene/CYP2D6',
    'FDA Table of Pharmacogenomic Biomarkers in Drug Labeling'
  ];

  // References
  const references = [
    'PMID: 22205192 - CPIC CYP2D6-Codeine Guideline',
    'PMID: 27997040 - CPIC CYP2D6-SSRI Guideline',
    'PMID: 28002639 - CPIC CYP2D6-TCA Guideline',
    'PMID: 23486447 - CYP2D6 Star Allele Nomenclature',
    'PharmVar Database: www.pharmvar.org'
  ];

  // Normalized genotypes for output
  const normalizedGenotypes = {
    rs3892097: normalizeGenotype('rs3892097', rs3892097, provider),
    rs28371725: normalizeGenotype('rs28371725', rs28371725, provider),
    rs1065852: normalizeGenotype('rs1065852', rs1065852, provider),
    rs5030655: normalizeGenotype('rs5030655', rs5030655, provider),
    rs28371706: normalizeGenotype('rs28371706', rs28371706, provider),
    rs16947: normalizeGenotype('rs16947', rs16947, provider)
  };

  return {
    gene: 'CYP2D6',
    diplotype,
    clinicalSummary,
    drugs,
    safetyAlerts,
    confidence: diplotype.confidence,
    limitations,
    guidelines,
    references,
    normalizedGenotypes
  };
}
