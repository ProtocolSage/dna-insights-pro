/**
 * COMPREHENSIVE NUTRIGENOMICS ANALYSIS ENGINE
 * Professional-grade analysis of vitamin, mineral, macronutrient metabolism,
 * food intolerances, and personalized dietary recommendations
 * 
 * Version: 2.0.0-ultimate
 */

export interface NutrigenomicsResult {
  categories: {
    vitamins: VitaminAnalysis;
    minerals: MineralAnalysis;
    macronutrients: MacronutrientAnalysis;
    foodIntolerances: FoodIntoleranceAnalysis;
    detoxification: DetoxAnalysis;
    omega: OmegaAnalysis;
    taste: TasteAnalysis;
  };
  criticalFindings: CriticalFinding[];
  recommendations: DietaryRecommendation[];
  supplements: SupplementRecommendation[];
}

export interface VitaminAnalysis {
  vitaminD: {
    status: 'high_risk' | 'moderate_risk' | 'low_risk' | 'optimal';
    variants: VariantResult[];
    interpretation: string;
    recommendedDose: string;
  };
  vitaminB12: {
    status: 'high_risk' | 'moderate_risk' | 'low_risk' | 'optimal';
    secretorStatus: 'non-secretor' | 'secretor' | 'unknown';
    variants: VariantResult[];
    interpretation: string;
    recommendedForm: string;
  };
  folate: {
    status: 'high_risk' | 'moderate_risk' | 'low_risk' | 'optimal';
    mthfrC677T: 'TT' | 'CT' | 'CC' | 'unknown';
    mthfrA1298C: 'CC' | 'AC' | 'AA' | 'unknown';
    variants: VariantResult[];
    interpretation: string;
    recommendedForm: string;
  };
  vitaminA: {
    status: 'poor_converter' | 'moderate_converter' | 'good_converter' | 'unknown';
    variants: VariantResult[];
    interpretation: string;
    recommendations: string[];
  };
}

export interface MineralAnalysis {
  iron: {
    status: 'overload_risk' | 'normal' | 'deficiency_risk';
    hemochromatosisRisk: 'high' | 'moderate' | 'low';
    h63d: string;
    c282y: string;
    variants: VariantResult[];
    interpretation: string;
    recommendations: string[];
  };
  calcium: {
    status: 'adequate' | 'monitor';
    variants: VariantResult[];
    recommendations: string[];
  };
}

export interface MacronutrientAnalysis {
  weight: {
    ftoGenotype: string;
    obesityRisk: 'high' | 'moderate' | 'low';
    exerciseBenefit: 'high' | 'moderate' | 'low';
    proteinBenefit: 'high' | 'moderate' | 'low';
    variants: VariantResult[];
    recommendations: string[];
  };
  carbohydrate: {
    diabetesRisk: 'high' | 'moderate' | 'low';
    tcf7l2: string;
    variants: VariantResult[];
    recommendations: string[];
  };
  fat: {
    saturatedFatSensitive: boolean;
    variants: VariantResult[];
    recommendations: string[];
  };
}

export interface FoodIntoleranceAnalysis {
  lactose: {
    status: 'intolerant' | 'partial' | 'tolerant' | 'unknown';
    genotype: string;
    confidence: 'definitive' | 'likely' | 'uncertain';
    recommendations: string[];
  };
  caffeine: {
    metabolizer: 'slow' | 'intermediate' | 'fast' | 'unknown';
    cardiovascularRisk: 'high_with_intake' | 'neutral' | 'protective';
    genotype: string;
    recommendations: string[];
  };
  alcohol: {
    aldh2Status: 'deficient' | 'partial' | 'normal' | 'unknown';
    adh1bStatus: 'fast' | 'normal' | 'unknown';
    flushRisk: 'severe' | 'moderate' | 'none';
    cancerRisk: 'very_high_if_drink' | 'moderate' | 'standard';
    recommendations: string[];
  };
}

export interface DetoxAnalysis {
  methylation: {
    status: 'impaired' | 'moderate' | 'normal';
    mthfr: string;
    variants: VariantResult[];
    recommendations: string[];
  };
  glutathione: {
    status: 'impaired' | 'moderate' | 'normal';
    variants: VariantResult[];
    recommendations: string[];
  };
  phase2: {
    nat2Status: 'slow' | 'intermediate' | 'fast' | 'unknown';
    variants: VariantResult[];
    recommendations: string[];
  };
}

export interface OmegaAnalysis {
  conversion: {
    status: 'poor_converter' | 'moderate_converter' | 'good_converter' | 'unknown';
    fads1: string;
    fads2: string;
    variants: VariantResult[];
    interpretation: string;
    recommendations: string[];
  };
}

export interface TasteAnalysis {
  bitter: {
    status: 'supertaster' | 'medium_taster' | 'non_taster' | 'unknown';
    genotype: string;
    implications: string[];
  };
  cilantro: {
    aversion: 'strong' | 'moderate' | 'none' | 'unknown';
    genotype: string;
  };
}

export interface CriticalFinding {
  priority: 'critical' | 'high' | 'moderate';
  category: string;
  finding: string;
  action: string;
  variants: string[];
}

export interface DietaryRecommendation {
  category: string;
  recommendation: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SupplementRecommendation {
  supplement: string;
  dose: string;
  form: string;
  rationale: string;
  priority: 'critical' | 'high' | 'moderate' | 'low';
}

interface VariantResult {
  rsid: string;
  genotype: string;
  interpretation: string;
}

interface Genotype {
  rsid: string;
  genotype: string;
}

/**
 * Main analysis function
 */
export function analyzeNutrigenomics(genotypes: Record<string, string>): NutrigenomicsResult {
  const genotypeList: Genotype[] = Object.entries(genotypes).map(([rsid, genotype]) => ({
    rsid,
    genotype: genotype.replace(/\s/g, '').toUpperCase()
  }));

  return {
    categories: {
      vitamins: analyzeVitamins(genotypeList),
      minerals: analyzeMinerals(genotypeList),
      macronutrients: analyzeMacronutrients(genotypeList),
      foodIntolerances: analyzeFoodIntolerances(genotypeList),
      detoxification: analyzeDetoxification(genotypeList),
      omega: analyzeOmega(genotypeList),
      taste: analyzeTaste(genotypeList)
    },
    criticalFindings: getCriticalFindings(genotypeList),
    recommendations: getDietaryRecommendations(genotypeList),
    supplements: getSupplementRecommendations(genotypeList)
  };
}

function getGenotype(genotypes: Genotype[], rsid: string): string | null {
  const variant = genotypes.find(g => g.rsid === rsid);
  return variant ? variant.genotype : null;
}

/**
 * Vitamin Analysis
 */
function analyzeVitamins(genotypes: Genotype[]): VitaminAnalysis {
  // Vitamin D
  const cyp2r1 = getGenotype(genotypes, 'rs10741657'); // CYP2R1
  const gc1 = getGenotype(genotypes, 'rs2282679'); // GC
  const vdr = getGenotype(genotypes, 'rs731236'); // VDR TaqI
  
  let vitaminDStatus: 'high_risk' | 'moderate_risk' | 'low_risk' | 'optimal' = 'low_risk';
  let vitaminDDose = '1000-2000 IU daily';
  let vitaminDInterpretation = 'Standard vitamin D supplementation recommended.';
  
  if (cyp2r1 === 'GG') {
    vitaminDStatus = 'high_risk';
    vitaminDDose = '2000-4000 IU daily';
    vitaminDInterpretation = '⚠️ HIGH RISK: CYP2R1 GG genotype - significantly reduced vitamin D activation. Very likely deficient. Get tested immediately.';
  } else if (cyp2r1 === 'AG' || gc1 === 'TT') {
    vitaminDStatus = 'moderate_risk';
    vitaminDDose = '2000-3000 IU daily';
    vitaminDInterpretation = 'Moderate risk for vitamin D deficiency. Testing recommended.';
  }

  // Vitamin B12
  const fut2 = getGenotype(genotypes, 'rs602662'); // FUT2 secretor status
  let b12Status: 'high_risk' | 'moderate_risk' | 'low_risk' | 'optimal' = 'low_risk';
  let secretorStatus: 'non-secretor' | 'secretor' | 'unknown' = 'unknown';
  let b12Interpretation = 'Standard B12 intake adequate.';
  let b12Form = 'Any form of B12';
  
  if (fut2 === 'AA') {
    b12Status = 'high_risk';
    secretorStatus = 'non-secretor';
    b12Form = 'Methylcobalamin (sublingual preferred)';
    b12Interpretation = '⚠️ HIGH RISK: Non-secretor (FUT2 AA) - 15-25% reduced B12 absorption. Very likely deficient. MUST supplement.';
  } else if (fut2 === 'AG') {
    b12Status = 'moderate_risk';
    secretorStatus = 'secretor';
    b12Interpretation = 'Heterozygous for FUT2 - slightly reduced B12 absorption. Monitor levels.';
  } else if (fut2 === 'GG') {
    secretorStatus = 'secretor';
  }

  // Folate (MTHFR)
  const mthfr677 = getGenotype(genotypes, 'rs1801133'); // C677T
  const mthfr1298 = getGenotype(genotypes, 'rs1801131'); // A1298C
  
  let folateStatus: 'high_risk' | 'moderate_risk' | 'low_risk' | 'optimal' = 'low_risk';
  let mthfrC677TStatus: 'TT' | 'CT' | 'CC' | 'unknown' = 'unknown';
  let mthfrA1298CStatus: 'CC' | 'AC' | 'AA' | 'unknown' = 'unknown';
  let folateInterpretation = 'Standard folate intake adequate.';
  let folateForm = 'Folic acid or methylfolate';
  
  // C677T: G=C allele, A=T allele
  if (mthfr677 === 'AA') {
    folateStatus = 'high_risk';
    mthfrC677TStatus = 'TT';
    folateForm = 'Methylfolate (5-MTHF) ONLY';
    folateInterpretation = '⚠️ CRITICAL: MTHFR C677T TT - 65-70% reduced enzyme activity. MUST use methylfolate, NOT folic acid. Check homocysteine.';
  } else if (mthfr677 === 'AG') {
    folateStatus = 'moderate_risk';
    mthfrC677TStatus = 'CT';
    folateForm = 'Methylfolate preferred';
    folateInterpretation = 'MTHFR C677T heterozygous - 35% reduced activity. Methylfolate recommended.';
  } else if (mthfr677 === 'GG') {
    mthfrC677TStatus = 'CC';
  }
  
  // A1298C: T=A allele, G=C allele
  if (mthfr1298 === 'GG') {
    mthfrA1298CStatus = 'CC';
    if (folateStatus === 'low_risk') {
      folateStatus = 'moderate_risk';
      folateInterpretation = 'MTHFR A1298C CC - moderate reduction. Consider methylfolate.';
    }
  } else if (mthfr1298 === 'TG') {
    mthfrA1298CStatus = 'AC';
  } else if (mthfr1298 === 'TT') {
    mthfrA1298CStatus = 'AA';
  }
  
  // Compound heterozygote
  if (mthfrC677TStatus === 'CT' && mthfrA1298CStatus === 'AC') {
    folateStatus = 'high_risk';
    folateInterpretation = '⚠️ Compound heterozygote (C677T + A1298C) - significantly impaired folate metabolism. Methylfolate essential.';
  }

  // Vitamin A
  const bcmo1_1 = getGenotype(genotypes, 'rs6013897'); // BCMO1
  const bcmo1_2 = getGenotype(genotypes, 'rs11645428'); // BCMO1
  
  let vitaminAStatus: 'poor_converter' | 'moderate_converter' | 'good_converter' | 'unknown' = 'unknown';
  let vitaminAInterpretation = '';
  let vitaminARecommendations: string[] = [];
  
  if (bcmo1_1 === 'AA' || bcmo1_2 === 'AA') {
    vitaminAStatus = 'poor_converter';
    vitaminAInterpretation = '⚠️ IMPORTANT: Poor beta-carotene converter. CANNOT efficiently make vitamin A from carrots/sweet potatoes. MUST get preformed vitamin A from animal sources or supplements.';
    vitaminARecommendations = [
      'MUST eat preformed vitamin A: liver, fish, eggs, dairy',
      'Vegans: SUPPLEMENT with retinyl palmitate 3000-5000 IU',
      'Do NOT rely on plant sources for vitamin A',
      'Monitor for deficiency: night blindness, dry skin'
    ];
  } else if (bcmo1_1 === 'AG' || bcmo1_2 === 'AG') {
    vitaminAStatus = 'moderate_converter';
    vitaminAInterpretation = 'Moderate beta-carotene conversion. Mix of plant and animal sources recommended.';
    vitaminARecommendations = [
      'Include some animal sources of vitamin A',
      'Plant sources partially effective'
    ];
  } else if (bcmo1_1 === 'GG' && bcmo1_2 === 'GG') {
    vitaminAStatus = 'good_converter';
    vitaminAInterpretation = 'Good beta-carotene conversion. Plant sources (carrots, sweet potatoes) work well.';
    vitaminARecommendations = ['Can rely on plant sources for vitamin A'];
  }

  return {
    vitaminD: {
      status: vitaminDStatus,
      variants: [
        { rsid: 'rs10741657', genotype: cyp2r1 || 'unknown', interpretation: 'CYP2R1 - vitamin D activation' },
        { rsid: 'rs2282679', genotype: gc1 || 'unknown', interpretation: 'GC - vitamin D binding' }
      ],
      interpretation: vitaminDInterpretation,
      recommendedDose: vitaminDDose
    },
    vitaminB12: {
      status: b12Status,
      secretorStatus,
      variants: [
        { rsid: 'rs602662', genotype: fut2 || 'unknown', interpretation: 'FUT2 - secretor status' }
      ],
      interpretation: b12Interpretation,
      recommendedForm: b12Form
    },
    folate: {
      status: folateStatus,
      mthfrC677T: mthfrC677TStatus,
      mthfrA1298C: mthfrA1298CStatus,
      variants: [
        { rsid: 'rs1801133', genotype: mthfr677 || 'unknown', interpretation: 'MTHFR C677T' },
        { rsid: 'rs1801131', genotype: mthfr1298 || 'unknown', interpretation: 'MTHFR A1298C' }
      ],
      interpretation: folateInterpretation,
      recommendedForm: folateForm
    },
    vitaminA: {
      status: vitaminAStatus,
      variants: [
        { rsid: 'rs6013897', genotype: bcmo1_1 || 'unknown', interpretation: 'BCMO1' },
        { rsid: 'rs11645428', genotype: bcmo1_2 || 'unknown', interpretation: 'BCMO1 additional' }
      ],
      interpretation: vitaminAInterpretation,
      recommendations: vitaminARecommendations
    }
  };
}

/**
 * Mineral Analysis
 */
function analyzeMinerals(genotypes: Genotype[]): MineralAnalysis {
  const hfeH63D = getGenotype(genotypes, 'rs1799945'); // H63D
  const hfeC282Y = getGenotype(genotypes, 'rs1800562'); // C282Y
  
  let ironStatus: 'overload_risk' | 'normal' | 'deficiency_risk' = 'normal';
  let hemochromatosisRisk: 'high' | 'moderate' | 'low' = 'low';
  let ironInterpretation = 'Normal iron metabolism expected.';
  let ironRecommendations: string[] = [];
  
  // C282Y is most critical
  if (hfeC282Y === 'AA') {
    ironStatus = 'overload_risk';
    hemochromatosisRisk = 'high';
    ironInterpretation = '⛔ CRITICAL: HFE C282Y AA (homozygous) - HEREDITARY HEMOCHROMATOSIS. GET TESTED IMMEDIATELY. This is LIFE-THREATENING if untreated.';
    ironRecommendations = [
      '⛔ GET TESTED NOW: Ferritin + Transferrin Saturation',
      'If ferritin >1000: URGENT - liver damage risk',
      'Treatment: Therapeutic phlebotomy (bloodletting)',
      'NEVER take iron supplements',
      'AVOID cast iron cookware',
      'Limit red meat, avoid vitamin C with meals',
      'Drink tea/coffee with meals (reduces absorption)',
      'Family screening recommended'
    ];
  } else if (hfeC282Y === 'GA') {
    ironStatus = 'overload_risk';
    hemochromatosisRisk = 'moderate';
    ironInterpretation = '⚠️ HFE C282Y carrier (heterozygous) - increased iron absorption. Monitor ferritin annually.';
    ironRecommendations = [
      'Annual ferritin check',
      'Avoid iron supplements unless deficient',
      'Monitor for elevation'
    ];
  }
  
  // H63D
  if (hfeH63D === 'GG') {
    if (hemochromatosisRisk === 'low') {
      hemochromatosisRisk = 'moderate';
      ironStatus = 'overload_risk';
      ironInterpretation = 'HFE H63D GG - moderately increased iron absorption. Monitor ferritin.';
      ironRecommendations = [
        'Get ferritin + transferrin saturation tested',
        'Target ferritin: <200 ng/mL (men), <150 (women)',
        'Avoid iron supplements unless deficient',
        'Limit red meat if ferritin elevated'
      ];
    }
  }
  
  // Compound heterozygote (C282Y + H63D)
  if (hfeC282Y === 'GA' && hfeH63D === 'CG') {
    hemochromatosisRisk = 'high';
    ironInterpretation = '⚠️ Compound heterozygote (C282Y + H63D) - moderate hemochromatosis. Significant iron overload risk.';
  }

  return {
    iron: {
      status: ironStatus,
      hemochromatosisRisk,
      h63d: hfeH63D || 'unknown',
      c282y: hfeC282Y || 'unknown',
      variants: [
        { rsid: 'rs1799945', genotype: hfeH63D || 'unknown', interpretation: 'HFE H63D' },
        { rsid: 'rs1800562', genotype: hfeC282Y || 'unknown', interpretation: 'HFE C282Y' }
      ],
      interpretation: ironInterpretation,
      recommendations: ironRecommendations
    },
    calcium: {
      status: 'adequate',
      variants: [],
      recommendations: ['Ensure 1000-1200mg calcium daily', 'Vitamin D for absorption']
    }
  };
}

/**
 * Macronutrient Analysis
 */
function analyzeMacronutrients(genotypes: Genotype[]): MacronutrientAnalysis {
  // FTO - obesity/weight
  const fto = getGenotype(genotypes, 'rs9939609');
  let obesityRisk: 'high' | 'moderate' | 'low' = 'low';
  let exerciseBenefit: 'high' | 'moderate' | 'low' = 'moderate';
  let proteinBenefit: 'high' | 'moderate' | 'low' = 'moderate';
  let weightRecommendations: string[] = [];
  
  if (fto === 'AA') {
    obesityRisk = 'high';
    exerciseBenefit = 'high';
    proteinBenefit = 'high';
    weightRecommendations = [
      '⚠️ HIGH genetic obesity risk BUT completely modifiable',
      'Physical activity CRITICAL: 30+ min daily',
      'Exercise benefits you MORE than others (cancels genetic risk)',
      'High-protein diet: 25-30% calories',
      'Portion control essential',
      'Sleep 7-9 hours',
      'GOOD NEWS: Lifestyle overcomes genes'
    ];
  } else if (fto === 'AT') {
    obesityRisk = 'moderate';
    weightRecommendations = [
      'Moderate obesity risk',
      'Regular exercise important',
      'Watch portion sizes'
    ];
  }

  // TCF7L2 - diabetes/carbs
  const tcf7l2 = getGenotype(genotypes, 'rs7903146');
  let diabetesRisk: 'high' | 'moderate' | 'low' = 'low';
  let carbRecommendations: string[] = [];
  
  if (tcf7l2 === 'TT') {
    diabetesRisk = 'high';
    carbRecommendations = [
      '⚠️ HIGH Type 2 Diabetes risk (nearly doubled)',
      'Low-carb (100-150g/day) or low-GI diet CRITICAL',
      'Avoid: white bread, white rice, sugary drinks',
      'Exercise 150min/week minimum',
      'Weight loss if overweight',
      'Get fasting glucose + HbA1c tested annually',
      'Consider CGM to see glucose response'
    ];
  } else if (tcf7l2 === 'CT') {
    diabetesRisk = 'moderate';
    carbRecommendations = [
      'Moderate diabetes risk',
      'Low-GI diet beneficial',
      'Monitor glucose periodically'
    ];
  }

  // APOA2 - saturated fat sensitivity
  const apoa2 = getGenotype(genotypes, 'rs5082');
  let satFatSensitive = false;
  let fatRecommendations: string[] = [];
  
  if (apoa2 === 'GG') {
    satFatSensitive = true;
    fatRecommendations = [
      'SATURATED FAT SENSITIVE',
      'LIMIT saturated fat: <20g daily',
      'Avoid: butter, cream, fatty meat, coconut oil',
      'Choose: olive oil, avocado, lean meats',
      'Mediterranean diet ideal'
    ];
  }

  return {
    weight: {
      ftoGenotype: fto || 'unknown',
      obesityRisk,
      exerciseBenefit,
      proteinBenefit,
      variants: [{ rsid: 'rs9939609', genotype: fto || 'unknown', interpretation: 'FTO - obesity risk' }],
      recommendations: weightRecommendations
    },
    carbohydrate: {
      diabetesRisk,
      tcf7l2: tcf7l2 || 'unknown',
      variants: [{ rsid: 'rs7903146', genotype: tcf7l2 || 'unknown', interpretation: 'TCF7L2 - diabetes risk' }],
      recommendations: carbRecommendations
    },
    fat: {
      saturatedFatSensitive: satFatSensitive,
      variants: [{ rsid: 'rs5082', genotype: apoa2 || 'unknown', interpretation: 'APOA2 - sat fat response' }],
      recommendations: fatRecommendations
    }
  };
}

/**
 * Food Intolerance Analysis
 */
function analyzeFoodIntolerances(genotypes: Genotype[]): FoodIntoleranceAnalysis {
  // Lactose
  const lct = getGenotype(genotypes, 'rs4988235');
  let lactoseStatus: 'intolerant' | 'partial' | 'tolerant' | 'unknown' = 'unknown';
  let lactoseConfidence: 'definitive' | 'likely' | 'uncertain' = 'uncertain';
  let lactoseRecommendations: string[] = [];
  
  if (lct === 'TT') {
    lactoseStatus = 'intolerant';
    lactoseConfidence = 'definitive';
    lactoseRecommendations = [
      '⚠️ GENETICALLY LACTOSE INTOLERANT (definitive)',
      'Avoid: milk, ice cream, soft cheeses',
      'Lactose-free dairy is fine (Lactaid)',
      'Lactase enzyme supplements available',
      'Aged cheeses OK (low lactose)',
      'Yogurt may be tolerated',
      'Alternative milks: almond, oat, coconut',
      'Ensure calcium from non-dairy sources'
    ];
  } else if (lct === 'GT') {
    lactoseStatus = 'partial';
    lactoseConfidence = 'likely';
    lactoseRecommendations = [
      'PARTIAL lactase - small amounts may be OK',
      'Hard cheeses, yogurt usually fine',
      'Large amounts (glass of milk) may cause issues'
    ];
  } else if (lct === 'GG') {
    lactoseStatus = 'tolerant';
    lactoseConfidence = 'definitive';
    lactoseRecommendations = ['No genetic lactose intolerance', 'Dairy digestion is fine'];
  }

  // Caffeine
  const cyp1a2 = getGenotype(genotypes, 'rs762551');
  let caffeineMetabolizer: 'slow' | 'intermediate' | 'fast' | 'unknown' = 'unknown';
  let cardioRisk: 'high_with_intake' | 'neutral' | 'protective' = 'neutral';
  let caffeineRecommendations: string[] = [];
  
  if (cyp1a2 === 'CC') {
    caffeineMetabolizer = 'slow';
    cardioRisk = 'high_with_intake';
    caffeineRecommendations = [
      '⚠️ SLOW CAFFEINE METABOLIZER',
      'LIMIT to 1-2 cups coffee daily max',
      'More than 2 cups = increased heart attack risk',
      'Avoid energy drinks',
      'No caffeine after 12pm',
      'May experience jitters, anxiety, insomnia',
      'Consider decaf or tea'
    ];
  } else if (cyp1a2 === 'AC') {
    caffeineMetabolizer = 'intermediate';
    caffeineRecommendations = ['Moderate intake: 2-3 cups daily OK', 'Monitor for symptoms'];
  } else if (cyp1a2 === 'AA') {
    caffeineMetabolizer = 'fast';
    cardioRisk = 'protective';
    caffeineRecommendations = [
      'FAST CAFFEINE METABOLIZER',
      'Coffee is CARDIOPROTECTIVE for you',
      '4+ cups daily = 36% lower heart attack risk',
      'Caffeine cleared quickly'
    ];
  }

  // Alcohol
  const aldh2 = getGenotype(genotypes, 'rs671');
  const adh1b = getGenotype(genotypes, 'rs1229984');
  let aldh2Status: 'deficient' | 'partial' | 'normal' | 'unknown' = 'unknown';
  let adh1bStatus: 'fast' | 'normal' | 'unknown' = 'unknown';
  let flushRisk: 'severe' | 'moderate' | 'none' = 'none';
  let cancerRisk: 'very_high_if_drink' | 'moderate' | 'standard' = 'standard';
  let alcoholRecommendations: string[] = [];
  
  if (aldh2 === 'AA') {
    aldh2Status = 'deficient';
    flushRisk = 'severe';
    cancerRisk = 'very_high_if_drink';
    alcoholRecommendations = [
      '⛔ ALDH2 DEFICIENCY - NO ENZYME',
      'AVOID ALCOHOL COMPLETELY',
      'Severe flush reaction',
      'Drinking despite flush = 10-20x esophageal/stomach cancer risk',
      'Acetaldehyde is CARCINOGENIC',
      'Tell doctor: nitroglycerin may not work for angina'
    ];
  } else if (aldh2 === 'GA') {
    aldh2Status = 'partial';
    flushRisk = 'moderate';
    cancerRisk = 'very_high_if_drink';
    alcoholRecommendations = [
      '⚠️ PARTIAL ALDH2 DEFICIENCY',
      'STRONGLY limit alcohol',
      'Moderate flush reaction',
      'Still increased cancer risk if drink regularly',
      'Maximum 1-2 drinks/month if any'
    ];
  }
  
  if (adh1b === 'TT') {
    adh1bStatus = 'fast';
    if (aldh2Status === 'deficient' || aldh2Status === 'partial') {
      alcoholRecommendations.push('Fast alcohol metabolism + ALDH2 deficiency = SEVERE FLUSH');
    }
  }

  return {
    lactose: {
      status: lactoseStatus,
      genotype: lct || 'unknown',
      confidence: lactoseConfidence,
      recommendations: lactoseRecommendations
    },
    caffeine: {
      metabolizer: caffeineMetabolizer,
      cardiovascularRisk: cardioRisk,
      genotype: cyp1a2 || 'unknown',
      recommendations: caffeineRecommendations
    },
    alcohol: {
      aldh2Status,
      adh1bStatus,
      flushRisk,
      cancerRisk,
      recommendations: alcoholRecommendations
    }
  };
}

/**
 * Detoxification Analysis
 */
function analyzeDetoxification(genotypes: Genotype[]): DetoxAnalysis {
  const mthfr = getGenotype(genotypes, 'rs1801133');
  let methylationStatus: 'impaired' | 'moderate' | 'normal' = 'normal';
  let methylationRecommendations: string[] = [];
  
  if (mthfr === 'AA') {
    methylationStatus = 'impaired';
    methylationRecommendations = [
      'Methylfolate 800mcg + methylB12 1000mcg + P5P (B6) 50mg',
      'Support Phase II detox: cruciferous vegetables',
      'Limit alcohol',
      'Adequate choline: eggs, liver',
      'Important for estrogen detox (women)'
    ];
  } else if (mthfr === 'AG') {
    methylationStatus = 'moderate';
    methylationRecommendations = ['Consider methylfolate 400mcg', 'B-vitamin support'];
  }

  return {
    methylation: {
      status: methylationStatus,
      mthfr: mthfr || 'unknown',
      variants: [{ rsid: 'rs1801133', genotype: mthfr || 'unknown', interpretation: 'MTHFR C677T' }],
      recommendations: methylationRecommendations
    },
    glutathione: {
      status: 'normal',
      variants: [],
      recommendations: ['NAC 600-1200mg for glutathione support', 'Cruciferous vegetables']
    },
    phase2: {
      nat2Status: 'unknown',
      variants: [],
      recommendations: ['Limit charred/well-done meat', 'Support Phase II enzymes']
    }
  };
}

/**
 * Omega Fatty Acid Analysis
 */
function analyzeOmega(genotypes: Genotype[]): OmegaAnalysis {
  const fads1 = getGenotype(genotypes, 'rs174537');
  let conversionStatus: 'poor_converter' | 'moderate_converter' | 'good_converter' | 'unknown' = 'unknown';
  let omegaInterpretation = '';
  let omegaRecommendations: string[] = [];
  
  if (fads1 === 'TT') {
    conversionStatus = 'poor_converter';
    omegaInterpretation = '⚠️ POOR omega-3 converter (ancestral genotype). CANNOT efficiently make EPA/DHA from plant sources.';
    omegaRecommendations = [
      'MUST eat fatty fish 2-3x/week (salmon, mackerel, sardines)',
      'OR fish oil: 1000-2000mg EPA+DHA daily',
      'Vegans: Algal DHA 200-300mg daily',
      'Do NOT rely on flax/chia/walnuts',
      'May need less omega-6 (vegetable oils)'
    ];
  } else if (fads1 === 'GT') {
    conversionStatus = 'moderate_converter';
    omegaInterpretation = 'Moderate omega-3 conversion. Mix of fish + plant sources recommended.';
    omegaRecommendations = ['Fish 1-2x/week sufficient', 'Plant sources partially effective'];
  } else if (fads1 === 'GG') {
    conversionStatus = 'good_converter';
    omegaInterpretation = 'Good omega-3 conversion (derived genotype). Can use plant sources effectively.';
    omegaRecommendations = ['Plant omega-3 (flax, chia, walnuts) work well', 'Still beneficial to eat fish'];
  }

  return {
    conversion: {
      status: conversionStatus,
      fads1: fads1 || 'unknown',
      fads2: 'unknown',
      variants: [{ rsid: 'rs174537', genotype: fads1 || 'unknown', interpretation: 'FADS1/FADS2 cluster' }],
      interpretation: omegaInterpretation,
      recommendations: omegaRecommendations
    }
  };
}

/**
 * Taste Analysis
 */
function analyzeTaste(genotypes: Genotype[]): TasteAnalysis {
  const tas2r38 = getGenotype(genotypes, 'rs713598');
  let bitterStatus: 'supertaster' | 'medium_taster' | 'non_taster' | 'unknown' = 'unknown';
  let bitterImplications: string[] = [];
  
  if (tas2r38 === 'CC') {
    bitterStatus = 'supertaster';
    bitterImplications = [
      'Very sensitive to bitter taste',
      'Likely dislike: broccoli, Brussels sprouts, kale',
      'These are cancer-protective - find palatable methods:',
      '- Roast with olive oil + salt',
      '- Pair with fat (butter, cheese)',
      '- Try different cooking methods'
    ];
  } else if (tas2r38 === 'CG') {
    bitterStatus = 'medium_taster';
    bitterImplications = ['Moderate bitter sensitivity'];
  } else if (tas2r38 === 'GG') {
    bitterStatus = 'non_taster';
    bitterImplications = ['Cannot taste PTC/PROP bitterness', 'May enjoy cruciferous vegetables'];
  }

  const cilantro = getGenotype(genotypes, 'rs72921001');
  let cilantroAversion: 'strong' | 'moderate' | 'none' | 'unknown' = 'unknown';
  
  if (cilantro === 'GG') {
    cilantroAversion = 'strong';
  } else if (cilantro === 'AG') {
    cilantroAversion = 'moderate';
  } else if (cilantro === 'AA') {
    cilantroAversion = 'none';
  }

  return {
    bitter: {
      status: bitterStatus,
      genotype: tas2r38 || 'unknown',
      implications: bitterImplications
    },
    cilantro: {
      aversion: cilantroAversion,
      genotype: cilantro || 'unknown'
    }
  };
}

/**
 * Get critical findings
 */
function getCriticalFindings(genotypes: Genotype[]): CriticalFinding[] {
  const findings: CriticalFinding[] = [];
  
  // Check for critical variants
  const hfeC282Y = getGenotype(genotypes, 'rs1800562');
  if (hfeC282Y === 'AA') {
    findings.push({
      priority: 'critical',
      category: 'Iron Metabolism',
      finding: 'HEREDITARY HEMOCHROMATOSIS - HFE C282Y homozygous',
      action: 'GET TESTED IMMEDIATELY: Ferritin + Transferrin Saturation. This is LIFE-THREATENING if untreated. Therapeutic phlebotomy if confirmed.',
      variants: ['rs1800562']
    });
  }
  
  const mthfr = getGenotype(genotypes, 'rs1801133');
  if (mthfr === 'AA') {
    findings.push({
      priority: 'high',
      category: 'Folate Metabolism',
      finding: 'MTHFR C677T TT - Severely impaired folate metabolism',
      action: 'MUST use methylfolate (NOT folic acid). Check homocysteine levels. CRITICAL for pregnancy planning.',
      variants: ['rs1801133']
    });
  }
  
  const fut2 = getGenotype(genotypes, 'rs602662');
  if (fut2 === 'AA') {
    findings.push({
      priority: 'high',
      category: 'Vitamin B12',
      finding: 'Non-secretor (FUT2 AA) - Severely reduced B12 absorption',
      action: 'GET B12 TESTED. Very likely deficient. MUST supplement with methylcobalamin.',
      variants: ['rs602662']
    });
  }
  
  const aldh2 = getGenotype(genotypes, 'rs671');
  if (aldh2 === 'AA' || aldh2 === 'GA') {
    findings.push({
      priority: 'critical',
      category: 'Alcohol Metabolism',
      finding: 'ALDH2 Deficiency - Cannot metabolize alcohol safely',
      action: 'AVOID ALCOHOL. Drinking despite flush = 10-20x esophageal/stomach cancer risk. This is CARCINOGENIC.',
      variants: ['rs671']
    });
  }
  
  const bcmo1 = getGenotype(genotypes, 'rs6013897');
  if (bcmo1 === 'AA') {
    findings.push({
      priority: 'high',
      category: 'Vitamin A',
      finding: 'Poor beta-carotene converter - Cannot make vitamin A from plants',
      action: 'MUST get preformed vitamin A from animal sources or supplements. Vegans: Supplement with retinyl palmitate.',
      variants: ['rs6013897']
    });
  }

  return findings;
}

/**
 * Get dietary recommendations
 */
function getDietaryRecommendations(genotypes: Genotype[]): DietaryRecommendation[] {
  const recommendations: DietaryRecommendation[] = [];
  
  const fto = getGenotype(genotypes, 'rs9939609');
  if (fto === 'AA') {
    recommendations.push({
      category: 'Weight Management',
      recommendation: 'High-protein diet (25-30% calories) and daily exercise (30+ minutes)',
      rationale: 'FTO AA genotype - high genetic obesity risk but completely modifiable with lifestyle',
      priority: 'high'
    });
  }
  
  const tcf7l2 = getGenotype(genotypes, 'rs7903146');
  if (tcf7l2 === 'TT') {
    recommendations.push({
      category: 'Carbohydrate Intake',
      recommendation: 'Low-carb (100-150g/day) or low-glycemic index diet',
      rationale: 'TCF7L2 TT genotype - 80-100% increased type 2 diabetes risk',
      priority: 'high'
    });
  }
  
  const apoa2 = getGenotype(genotypes, 'rs5082');
  if (apoa2 === 'GG') {
    recommendations.push({
      category: 'Fat Intake',
      recommendation: 'Limit saturated fat to <20g daily. Choose olive oil, avocado, lean meats.',
      rationale: 'APOA2 GG genotype - saturated fat sensitive',
      priority: 'high'
    });
  }

  return recommendations;
}

/**
 * Get supplement recommendations
 */
function getSupplementRecommendations(genotypes: Genotype[]): SupplementRecommendation[] {
  const supplements: SupplementRecommendation[] = [];
  
  const cyp2r1 = getGenotype(genotypes, 'rs10741657');
  if (cyp2r1 === 'GG') {
    supplements.push({
      supplement: 'Vitamin D3',
      dose: '2000-4000 IU daily',
      form: 'Cholecalciferol',
      rationale: 'CYP2R1 GG - severely reduced vitamin D activation',
      priority: 'critical'
    });
  } else if (cyp2r1 === 'AG') {
    supplements.push({
      supplement: 'Vitamin D3',
      dose: '2000 IU daily',
      form: 'Cholecalciferol',
      rationale: 'CYP2R1 AG - moderately reduced vitamin D activation',
      priority: 'high'
    });
  }
  
  const mthfr = getGenotype(genotypes, 'rs1801133');
  if (mthfr === 'AA') {
    supplements.push({
      supplement: 'Methylfolate + Methylcobalamin + P5P',
      dose: '800mcg + 1000mcg + 50mg',
      form: '5-MTHF, methylB12, pyridoxal-5-phosphate',
      rationale: 'MTHFR C677T TT - severely impaired methylation',
      priority: 'critical'
    });
  }
  
  const fut2 = getGenotype(genotypes, 'rs602662');
  if (fut2 === 'AA') {
    supplements.push({
      supplement: 'Methylcobalamin B12',
      dose: '1000mcg daily',
      form: 'Sublingual methylcobalamin',
      rationale: 'FUT2 non-secretor - 15-25% reduced B12 absorption',
      priority: 'critical'
    });
  }
  
  const fads1 = getGenotype(genotypes, 'rs174537');
  if (fads1 === 'TT') {
    supplements.push({
      supplement: 'Fish Oil or Algal DHA',
      dose: '1000-2000mg EPA+DHA daily',
      form: 'Triglyceride form (better absorbed)',
      rationale: 'FADS1 poor converter - cannot make EPA/DHA from plant omega-3',
      priority: 'high'
    });
  }

  return supplements;
}
