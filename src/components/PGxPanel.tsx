// PGxPanel.tsx - Panel to display pharmacogenomics results (v2 - Uses Comprehensive Analysis)
// Uses external CSS for styling to maintain medical-grade code quality
import React from 'react';
import { analyzeComprehensivePGx, type ComprehensivePGxResult } from '../analysis/core/comprehensive-pgx-analysis';
import './PGxPanel.css';

interface PGxPanelProps {
  genotypes: Map<string, { rsid: string; genotype: string }>;
}

/**
 * Convert Map<rsid, {rsid, genotype}> to Array<{rsid, genotype}>
 */
function mapToArray(genotypes: Map<string, { rsid: string; genotype: string }>): Array<{ rsid: string; genotype: string }> {
  const result: Array<{ rsid: string; genotype: string }> = [];
  genotypes.forEach((value, key) => {
    result.push({ rsid: key, genotype: value.genotype });
  });
  return result;
}

interface GeneCardData {
  gene: string;
  diplotype: string;
  phenotype: string;
  activityScore?: number;
  drugs: Array<{ drug: string; recommendation: string; isHighRisk: boolean }>;
  warnings: string[];
  confidence: string;
}

/**
 * Extract gene results from ComprehensivePGxResult into a flat array for rendering.
 * Clinical references from CPIC (https://cpicpgx.org/) and PharmGKB (https://www.pharmgkb.org/).
 */
function extractGeneResults(result: ComprehensivePGxResult): GeneCardData[] {
  const genes: GeneCardData[] = [];

  // CYP2D6 - Critical for antidepressants, opioids, antipsychotics
  // CPIC Level A genes - PMID: 27997040, 31006110
  if (result.cyp2d6) {
    genes.push({
      gene: 'CYP2D6',
      diplotype: `${result.cyp2d6.diplotype.allele1}/${result.cyp2d6.diplotype.allele2}`,
      phenotype: result.cyp2d6.diplotype.phenotype,
      activityScore: result.cyp2d6.diplotype.activityScore,
      drugs: result.cyp2d6.drugs.map(d => ({
        drug: d.drug,
        recommendation: d.recommendation,
        isHighRisk: d.riskLevel === 'critical' || d.riskLevel === 'warning'
      })),
      warnings: result.cyp2d6.safetyAlerts || [],
      confidence: result.cyp2d6.confidence
    });
  }

  // CYP2C9 - Critical for warfarin, NSAIDs, phenytoin
  // CPIC Level A - PMID: 21716271
  if (result.cyp2c9) {
    genes.push({
      gene: 'CYP2C9',
      diplotype: `${result.cyp2c9.diplotype.allele1}/${result.cyp2c9.diplotype.allele2}`,
      phenotype: result.cyp2c9.diplotype.phenotype,
      activityScore: result.cyp2c9.diplotype.activityScore,
      drugs: result.cyp2c9.drugs.map(d => ({
        drug: d.drug,
        recommendation: d.recommendation,
        isHighRisk: d.bleedingRisk === 'High' || d.bleedingRisk === 'Very High'
      })),
      warnings: result.cyp2c9.safetyAlerts || [],
      confidence: result.cyp2c9.confidence
    });
  }

  // CYP3A5 - Important for tacrolimus dosing
  // CPIC Level A - PMID: 25801146
  if (result.cyp3a5) {
    genes.push({
      gene: 'CYP3A5',
      diplotype: `${result.cyp3a5.diplotype.allele1}/${result.cyp3a5.diplotype.allele2}`,
      phenotype: result.cyp3a5.diplotype.phenotype,
      drugs: result.cyp3a5.drugs.map(d => ({
        drug: d.drug,
        recommendation: d.recommendation,
        isHighRisk: d.riskLevel === 'moderate'
      })),
      warnings: [],
      confidence: result.cyp3a5.confidence
    });
  }

  // VKORC1 - Critical for warfarin sensitivity
  // CPIC Level A (with CYP2C9) - PMID: 21716271
  if (result.vkorc1) {
    genes.push({
      gene: 'VKORC1',
      diplotype: result.vkorc1.genotype.rs9923231,
      phenotype: result.vkorc1.genotype.phenotype,
      drugs: result.vkorc1.drugs.map(d => ({
        drug: d.drug,
        recommendation: d.recommendation,
        isHighRisk: result.vkorc1?.genotype.phenotype === 'High Sensitivity'
      })),
      warnings: result.vkorc1.safetyAlerts || [],
      confidence: result.vkorc1.confidence
    });
  }

  // SLCO1B1 - Critical for statin myopathy risk
  // CPIC Level A - PMID: 24918167
  if (result.slco1b1) {
    genes.push({
      gene: 'SLCO1B1',
      diplotype: `${result.slco1b1.diplotype.allele1}/${result.slco1b1.diplotype.allele2}`,
      phenotype: result.slco1b1.diplotype.phenotype,
      drugs: result.slco1b1.drugs.map(d => ({
        drug: d.statin,
        recommendation: d.recommendation,
        isHighRisk: d.myopathyRisk === 'High' || d.myopathyRisk === 'Very High'
      })),
      warnings: result.slco1b1.safetyAlerts || [],
      confidence: result.slco1b1.confidence
    });
  }

  // UGT1A1 - Important for irinotecan, atazanavir
  // CPIC Level A - PMID: 30073189
  if (result.ugt1a1) {
    genes.push({
      gene: 'UGT1A1',
      diplotype: `${result.ugt1a1.diplotype.allele1}/${result.ugt1a1.diplotype.allele2}`,
      phenotype: result.ugt1a1.diplotype.phenotype,
      activityScore: result.ugt1a1.diplotype.activityScore,
      drugs: result.ugt1a1.drugs.map(d => ({
        drug: d.drug,
        recommendation: d.recommendation,
        isHighRisk: d.riskLevel === 'critical' || d.riskLevel === 'warning'
      })),
      warnings: result.ugt1a1.safetyAlerts || [],
      confidence: result.ugt1a1.confidence
    });
  }

  // F5 (Factor V Leiden) - Thrombophilia risk
  // ClinVar: VCV000015164 - rs6025
  if (result.f5) {
    const risk = result.f5.genotype.thrombophiliaRisk;
    genes.push({
      gene: 'F5 (Factor V)',
      diplotype: result.f5.genotype.rs6025,
      phenotype: risk,
      drugs: result.f5.safetyAlerts?.map(alert => ({
        drug: 'Oral Contraceptives / HRT',
        recommendation: alert,
        isHighRisk: true
      })) || [],
      warnings: risk !== 'Normal' ? [`Factor V Leiden: ${result.f5.genotype.vteRiskMultiplier}x clotting risk`] : [],
      confidence: result.f5.genotype.confidence
    });
  }

  return genes;
}

/**
 * Determine if phenotype indicates abnormal metabolism
 */
function isAbnormalPhenotype(phenotype: string): boolean {
  return phenotype.includes('Poor') ||
    phenotype.includes('Ultrarapid') ||
    phenotype.includes('Non-expressor') ||
    phenotype.includes('High') ||
    phenotype.includes('Decreased');
}

/**
 * Get confidence badge CSS class
 */
function getConfidenceClass(confidence: string): string {
  switch (confidence) {
    case 'high': return 'pgx-confidence-badge pgx-confidence-badge--high';
    case 'medium': return 'pgx-confidence-badge pgx-confidence-badge--medium';
    default: return 'pgx-confidence-badge pgx-confidence-badge--low';
  }
}

export function PGxPanel({ genotypes }: PGxPanelProps) {
  const comprehensiveResult = React.useMemo(
    () => analyzeComprehensivePGx(mapToArray(genotypes), '23andme'),
    [genotypes]
  );

  const results = React.useMemo(
    () => extractGeneResults(comprehensiveResult),
    [comprehensiveResult]
  );

  const criticalWarnings = comprehensiveResult.summary.criticalWarnings;

  return (
    <div className="pgx-panel">
      <h1>💊 Pharmacogenomics Results</h1>

      {/* Summary Bar */}
      <div className="pgx-summary-bar">
        <div className="pgx-summary-grid">
          <div>
            <div className="pgx-summary-stat-value">
              {comprehensiveResult.summary.genesAnalyzed.length}
            </div>
            <div className="pgx-summary-stat-label">Genes Analyzed</div>
          </div>
          <div>
            <div className="pgx-summary-stat-value">
              {comprehensiveResult.summary.totalDrugsAffected}
            </div>
            <div className="pgx-summary-stat-label">Drugs Affected</div>
          </div>
          <div>
            <div className="pgx-summary-stat-value">
              {comprehensiveResult.summary.highConfidenceResults}
            </div>
            <div className="pgx-summary-stat-label">High Confidence</div>
          </div>
          <div>
            <div className={`pgx-summary-stat-value ${criticalWarnings.length > 0 ? 'pgx-summary-stat-value--warning' : 'pgx-summary-stat-value--success'}`}>
              {criticalWarnings.length}
            </div>
            <div className="pgx-summary-stat-label">Critical Warnings</div>
          </div>
        </div>
      </div>

      {/* Critical Warnings */}
      {criticalWarnings.length > 0 && (
        <div className="pgx-critical-warnings">
          <h2 className="pgx-critical-warnings-title">⚠️ Critical Findings</h2>
          {criticalWarnings.map((warning, i) => (
            <div key={i} className="pgx-critical-warning-item">
              {warning}
            </div>
          ))}
        </div>
      )}

      {/* Gene Cards */}
      <div className="pgx-gene-grid">
        {results.map(result => (
          <div
            key={result.gene}
            className={`pgx-gene-card ${result.warnings.length > 0 ? 'pgx-gene-card--warning' : ''}`}
          >
            <h3 className="pgx-gene-card-title">{result.gene}</h3>

            <div className="pgx-diplotype-row">
              Diplotype: <code className="pgx-diplotype-code">{result.diplotype}</code>
              <span className={getConfidenceClass(result.confidence)}>
                {result.confidence}
              </span>
            </div>

            <div className={`pgx-phenotype ${isAbnormalPhenotype(result.phenotype) ? 'pgx-phenotype--abnormal' : 'pgx-phenotype--normal'}`}>
              {result.phenotype}
              {result.activityScore !== undefined && ` (AS: ${result.activityScore})`}
            </div>

            {result.drugs.length > 0 && (
              <details className="pgx-drug-details">
                <summary className="pgx-drug-summary">
                  View Drug Recommendations ({result.drugs.length})
                </summary>
                {result.drugs.map((drug, i) => (
                  <div
                    key={i}
                    className={`pgx-drug-item ${drug.isHighRisk ? 'pgx-drug-item--high-risk' : 'pgx-drug-item--normal'}`}
                  >
                    <div className="pgx-drug-name">{drug.drug}</div>
                    <div className="pgx-drug-recommendation">{drug.recommendation}</div>
                  </div>
                ))}
              </details>
            )}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="pgx-disclaimer">
        <p>
          <strong>⚠️ Important:</strong> This is for educational purposes only.
          Consult your healthcare provider before making any medication decisions.
          Pharmacogenomic testing should be interpreted by qualified professionals
          in context of your complete medical history.
        </p>
        <p>
          <strong>Limitations:</strong> SNP array data cannot detect copy number
          variations (especially CYP2D6 gene duplications/deletions), rare alleles,
          or structural variants. Clinical-grade PGx testing may provide more
          comprehensive results.
        </p>
        <p>
          <strong>Clinical References:</strong> Recommendations based on CPIC Guidelines
          (cpicpgx.org), PharmGKB (pharmgkb.org), and FDA Table of Pharmacogenomic
          Biomarkers in Drug Labeling.
        </p>
      </div>
    </div>
  );
}
