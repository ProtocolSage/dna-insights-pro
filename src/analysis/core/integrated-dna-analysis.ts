/**
 * INTEGRATED DNA ANALYSIS - PGX + NUTRIGENOMICS
 * Complete personalized medicine analysis combining pharmacogenomics and nutrigenomics
 * 
 * Version: 1.0.0-integrated
 */

import { analyzeComprehensivePGx, genotypeRecordToArray, type PGxResult } from './comprehensive-pgx-analysis';
import { analyzeNutrigenomics, NutrigenomicsResult } from './nutrigenomics-analysis';

export interface IntegratedDNAAnalysis {
  pgx: PGxResult;
  nutrigenomics: NutrigenomicsResult;
  summary: {
    totalVariantsAnalyzed: number;
    totalGenesAnalyzed: number;
    criticalFindingsCount: number;
    actionableInsights: number;
  };
  criticalFindings: CombinedCriticalFinding[];
  actionPlan: ActionPlan;
}

export interface CombinedCriticalFinding {
  source: 'pgx' | 'nutrigenomics' | 'both';
  priority: 'critical' | 'high' | 'moderate';
  category: string;
  finding: string;
  action: string;
  variants: string[];
}

export interface ActionPlan {
  immediate: ActionItem[];
  shortTerm: ActionItem[];
  longTerm: ActionItem[];
}

export interface ActionItem {
  category: string;
  action: string;
  timeframe: string;
  rationale: string;
  source: 'pgx' | 'nutrigenomics' | 'both';
}

/**
 * Main integrated analysis function
 */
export function analyzeCompleteDNA(genotypes: Record<string, string>): IntegratedDNAAnalysis {
  // Run both analyses
  const genotypeArray = genotypeRecordToArray(genotypes);
  const pgxResults = analyzeComprehensivePGx(genotypeArray);
  const nutriResults = analyzeNutrigenomics(genotypes);

  // Combine critical findings
  const criticalFindings = combineCriticalFindings(pgxResults, nutriResults);

  // Generate comprehensive action plan
  const actionPlan = generateActionPlan(pgxResults, nutriResults, criticalFindings);

  // Calculate summary stats
  const summary = {
    totalVariantsAnalyzed: Object.keys(genotypes).length,
    totalGenesAnalyzed: countUniqueGenes(pgxResults, nutriResults),
    criticalFindingsCount: criticalFindings.filter(f => f.priority === 'critical').length,
    actionableInsights: criticalFindings.length + actionPlan.immediate.length
  };

  return {
    pgx: pgxResults,
    nutrigenomics: nutriResults,
    summary,
    criticalFindings,
    actionPlan
  };
}

/**
 * Combine critical findings from both modules
 */
function combineCriticalFindings(
  pgx: PGxResult,
  nutri: NutrigenomicsResult
): CombinedCriticalFinding[] {
  const findings: CombinedCriticalFinding[] = [];

  // PGx critical findings
  if (pgx.criticalSafety) {
    pgx.criticalSafety.dpyd?.forEach(variant => {
      if (variant.activityScore < 1.0) {
        findings.push({
          source: 'pgx',
          priority: 'critical',
          category: 'Pharmacogenomics - Drug Safety',
          finding: `DPYD ${variant.allele} - 5-FU/Capecitabine FATAL TOXICITY RISK`,
          action: 'NEVER prescribe 5-FU, capecitabine without dose adjustment. FDA MANDATORY testing.',
          variants: [variant.rsid || 'DPYD']
        });
      }
    });

    pgx.criticalSafety.nudt15?.forEach(variant => {
      if (variant.activityScore < 1.0) {
        findings.push({
          source: 'pgx',
          priority: 'critical',
          category: 'Pharmacogenomics - Drug Safety',
          finding: `NUDT15 ${variant.allele} - Thiopurine SEVERE TOXICITY RISK`,
          action: 'Reduce thiopurine dose by 30-80% or avoid. Early leukopenia risk.',
          variants: [variant.rsid || 'NUDT15']
        });
      }
    });

    pgx.criticalSafety.tpmt?.forEach(variant => {
      if (variant.activityScore < 1.0) {
        findings.push({
          source: 'pgx',
          priority: 'critical',
          category: 'Pharmacogenomics - Drug Safety',
          finding: `TPMT ${variant.allele} - Thiopurine LIFE-THREATENING TOXICITY`,
          action: 'Avoid thiopurines or use 5-10% of normal dose. Myelosuppression risk.',
          variants: [variant.rsid || 'TPMT']
        });
      }
    });
  }

  // Nutrigenomics critical findings
  nutri.criticalFindings.forEach(finding => {
    findings.push({
      source: 'nutrigenomics',
      priority: finding.priority as 'critical' | 'high' | 'moderate',
      category: finding.category,
      finding: finding.finding,
      action: finding.action,
      variants: finding.variants
    });
  });

  // Check for overlapping concerns (e.g., MTHFR + methotrexate)
  const mthfrImpaired = nutri.categories.vitamins.folate.status === 'high_risk';
  const onMethotrexate = false; // Would need to check PGx results for methotrexate mentions

  if (mthfrImpaired && onMethotrexate) {
    findings.push({
      source: 'both',
      priority: 'high',
      category: 'PGx + Nutrigenomics Interaction',
      finding: 'MTHFR impairment + Methotrexate use',
      action: 'CRITICAL: MTHFR affects methotrexate response. Must use leucovorin rescue. Methylfolate supplementation essential.',
      variants: ['rs1801133']
    });
  }

  // Sort by priority
  return findings.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, moderate: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Generate comprehensive action plan
 */
function generateActionPlan(
  pgx: PGxResult,
  nutri: NutrigenomicsResult,
  criticalFindings: CombinedCriticalFinding[]
): ActionPlan {
  const immediate: ActionItem[] = [];
  const shortTerm: ActionItem[] = [];
  const longTerm: ActionItem[] = [];

  // IMMEDIATE ACTIONS (do today/this week)

  // Critical PGx
  criticalFindings
    .filter(f => f.source === 'pgx' && f.priority === 'critical')
    .forEach(f => {
      immediate.push({
        category: f.category,
        action: `Medical Alert: ${f.action}`,
        timeframe: 'URGENT - Inform all healthcare providers immediately',
        rationale: f.finding,
        source: 'pgx'
      });
    });

  // Critical nutrigenomics - immediate testing needed
  if (nutri.categories.minerals.iron.hemochromatosisRisk === 'high') {
    immediate.push({
      category: 'Iron Metabolism',
      action: 'Get iron panel tested TODAY (ferritin + transferrin saturation)',
      timeframe: 'Within 24-48 hours',
      rationale: 'HFE C282Y hemochromatosis - life-threatening if untreated',
      source: 'nutrigenomics'
    });
  }

  if (nutri.categories.vitamins.vitaminB12.status === 'high_risk') {
    immediate.push({
      category: 'Vitamin B12',
      action: 'Get B12 + MMA tested this week',
      timeframe: 'Within 1 week',
      rationale: `${nutri.categories.vitamins.vitaminB12.interpretation}`,
      source: 'nutrigenomics'
    });
  }

  if (nutri.categories.vitamins.folate.status === 'high_risk') {
    immediate.push({
      category: 'Folate & Homocysteine',
      action: 'Get homocysteine tested + start methylfolate TODAY',
      timeframe: 'Start supplementation immediately',
      rationale: nutri.categories.vitamins.folate.interpretation,
      source: 'nutrigenomics'
    });
  }

  if (nutri.categories.foodIntolerances.alcohol.aldh2Status === 'deficient') {
    immediate.push({
      category: 'Alcohol Safety',
      action: 'STOP all alcohol consumption',
      timeframe: 'Immediately',
      rationale: 'ALDH2 deficiency - 10-20x cancer risk if drink',
      source: 'nutrigenomics'
    });
  }

  // SHORT-TERM ACTIONS (next 1-3 months)

  // Start supplement protocol
  const supplements = nutri.supplements.filter(s => s.priority === 'critical' || s.priority === 'high');
  if (supplements.length > 0) {
    shortTerm.push({
      category: 'Supplement Protocol',
      action: `Start personalized supplement regimen: ${supplements.map(s => s.supplement).join(', ')}`,
      timeframe: '1-2 weeks',
      rationale: 'Based on genetic deficiencies and risks',
      source: 'nutrigenomics'
    });
  }

  // Dietary modifications
  const dietChanges = nutri.recommendations.filter(r => r.priority === 'high');
  if (dietChanges.length > 0) {
    shortTerm.push({
      category: 'Dietary Modifications',
      action: 'Implement personalized diet changes based on genetic profile',
      timeframe: '2-4 weeks',
      rationale: 'Optimize nutrition based on metabolism genetics',
      source: 'nutrigenomics'
    });
  }

  // Vitamin D testing
  if (nutri.categories.vitamins.vitaminD.status === 'high_risk' || nutri.categories.vitamins.vitaminD.status === 'moderate_risk') {
    shortTerm.push({
      category: 'Vitamin D',
      action: 'Get 25(OH)D tested',
      timeframe: '2-4 weeks',
      rationale: nutri.categories.vitamins.vitaminD.interpretation,
      source: 'nutrigenomics'
    });
  }

  // PGx: Medication review
  if (pgx.cyp2d6?.diplotype.phenotype === 'Poor Metabolizer' || pgx.cyp2d6?.diplotype.phenotype === 'Ultrarapid Metabolizer') {
    shortTerm.push({
      category: 'Medication Review',
      action: 'Schedule pharmacist consult to review all medications',
      timeframe: '1 month',
      rationale: `CYP2D6 ${pgx.cyp2d6.diplotype.phenotype} - affects 25% of prescriptions`,
      source: 'pgx'
    });
  }

  // LONG-TERM ACTIONS (3-12 months)

  // Weight management if FTO risk
  if (nutri.categories.macronutrients.weight.obesityRisk === 'high') {
    longTerm.push({
      category: 'Weight Management',
      action: 'Implement exercise protocol (30+ min daily) and high-protein diet',
      timeframe: '3-6 months',
      rationale: 'FTO genetic obesity risk - completely modifiable with lifestyle',
      source: 'nutrigenomics'
    });
  }

  // Diabetes prevention if TCF7L2 risk
  if (nutri.categories.macronutrients.carbohydrate.diabetesRisk === 'high') {
    longTerm.push({
      category: 'Diabetes Prevention',
      action: 'Low-carb/low-GI diet + annual glucose/HbA1c monitoring',
      timeframe: 'Ongoing',
      rationale: 'TCF7L2 - 80-100% increased T2D risk, preventable with diet',
      source: 'nutrigenomics'
    });
  }

  // Cardiovascular risk management
  if (nutri.categories.foodIntolerances.caffeine.cardiovascularRisk === 'high_with_intake') {
    longTerm.push({
      category: 'Cardiovascular Health',
      action: 'Limit caffeine intake to 1-2 cups daily',
      timeframe: 'Ongoing',
      rationale: 'CYP1A2 slow metabolizer - high caffeine increases heart attack risk',
      source: 'nutrigenomics'
    });
  }

  // Bone health if vitamin D receptor issues
  if (nutri.categories.vitamins.vitaminD.status === 'high_risk') {
    longTerm.push({
      category: 'Bone Health',
      action: 'DEXA scan at age 50+ (women) or 70+ (men) + weight-bearing exercise',
      timeframe: 'Age-appropriate',
      rationale: 'Vitamin D metabolism variants affect bone density',
      source: 'nutrigenomics'
    });
  }

  return { immediate, shortTerm, longTerm };
}

/**
 * Count unique genes analyzed across both modules
 */
function countUniqueGenes(pgx: PGxResult, _nutri: NutrigenomicsResult): number {
  const genes = new Set<string>();

  // PGx genes
  if (pgx.cyp2d6) genes.add('CYP2D6');
  if (pgx.cyp2c19) genes.add('CYP2C19');
  if (pgx.cyp2c9) genes.add('CYP2C9');
  if (pgx.cyp2b6) genes.add('CYP2B6');
  if (pgx.cyp3a5) genes.add('CYP3A5');

  // Add more PGx genes from critical safety
  if (pgx.criticalSafety?.dpyd) genes.add('DPYD');
  if (pgx.criticalSafety?.nudt15) genes.add('NUDT15');
  if (pgx.criticalSafety?.tpmt) genes.add('TPMT');

  // Nutrigenomics genes (estimate based on analysis)
  const nutriGenes = [
    'FUT2', 'MTHFR', 'BCMO1', 'CYP2R1', 'GC', 'VDR',
    'HFE', 'FTO', 'TCF7L2', 'APOA2', 'CYP1A2', 'ALDH2',
    'ADH1B', 'TAS2R38', 'OR6A2', 'SOD2', 'FADS1', 'FADS2',
    'APOE', 'APOA5', 'CETP', 'LPL', 'IL6', 'IL10', 'CRP',
    'GSTP1', 'NAT2', 'PON1', 'NQO1', 'MTRR', 'MTR',
    'SLCO1B1', 'ABCG2', 'CLOCK', 'MAOA', 'XPC'
  ];

  nutriGenes.forEach(g => genes.add(g));

  return genes.size;
}

/**
 * Generate executive summary for clinicians
 */
export function generateExecutiveSummary(analysis: IntegratedDNAAnalysis): string {
  const lines: string[] = [];

  lines.push('INTEGRATED DNA ANALYSIS - EXECUTIVE SUMMARY');
  lines.push('='.repeat(60));
  lines.push('');

  lines.push(`Total Variants Analyzed: ${analysis.summary.totalVariantsAnalyzed}`);
  lines.push(`Total Genes Analyzed: ${analysis.summary.totalGenesAnalyzed}`);
  lines.push(`Critical Findings: ${analysis.summary.criticalFindingsCount}`);
  lines.push(`Actionable Insights: ${analysis.summary.actionableInsights}`);
  lines.push('');

  // Critical findings
  if (analysis.criticalFindings.length > 0) {
    lines.push('CRITICAL FINDINGS:');
    lines.push('-'.repeat(60));
    analysis.criticalFindings
      .filter(f => f.priority === 'critical')
      .forEach(f => {
        lines.push(`[${f.source.toUpperCase()}] ${f.finding}`);
        lines.push(`  ACTION: ${f.action}`);
        lines.push('');
      });
  }

  // Immediate actions
  if (analysis.actionPlan.immediate.length > 0) {
    lines.push('IMMEDIATE ACTIONS:');
    lines.push('-'.repeat(60));
    analysis.actionPlan.immediate.forEach(a => {
      lines.push(`• ${a.action}`);
      lines.push(`  ${a.rationale}`);
      lines.push('');
    });
  }

  // PGx summary
  lines.push('PHARMACOGENOMICS SUMMARY:');
  lines.push('-'.repeat(60));
  if (analysis.pgx.cyp2d6) {
    lines.push(`CYP2D6: ${analysis.pgx.cyp2d6.diplotype.phenotype} (Activity Score: ${analysis.pgx.cyp2d6.diplotype.activityScore})`);
  }
  if (analysis.pgx.cyp2c9) {
    lines.push(`CYP2C9: ${analysis.pgx.cyp2c9.diplotype.phenotype} (Activity Score: ${analysis.pgx.cyp2c9.diplotype.activityScore})`);
  }
  if (analysis.pgx.cyp2c19) {
    lines.push(`CYP2C19: ${analysis.pgx.cyp2c19.phenotype}`);
  }
  lines.push('');

  // Nutrigenomics summary
  lines.push('NUTRIGENOMICS SUMMARY:');
  lines.push('-'.repeat(60));
  lines.push(`Vitamin D: ${analysis.nutrigenomics.categories.vitamins.vitaminD.status}`);
  lines.push(`Vitamin B12: ${analysis.nutrigenomics.categories.vitamins.vitaminB12.status}`);
  lines.push(`Folate (MTHFR): ${analysis.nutrigenomics.categories.vitamins.folate.status}`);
  lines.push(`Iron: ${analysis.nutrigenomics.categories.minerals.iron.status}`);
  lines.push(`Lactose: ${analysis.nutrigenomics.categories.foodIntolerances.lactose.status}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Export comprehensive report as JSON
 */
export function exportComprehensiveReport(analysis: IntegratedDNAAnalysis): string {
  return JSON.stringify(analysis, null, 2);
}
