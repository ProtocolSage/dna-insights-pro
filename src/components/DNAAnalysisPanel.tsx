/**
 * COMPREHENSIVE DNA ANALYSIS PANEL
 * React component for displaying integrated PGx + Nutrigenomics analysis
 * 
 * Version: 1.0.0-complete-ui
 */

import React, { useState } from 'react';
import { analyzeCompleteDNA, IntegratedDNAAnalysis, generateExecutiveSummary } from '../analysis/core/integrated-dna-analysis';

interface DNAAnalysisPanelProps {
  genotypes: Record<string, string>;
  userInfo?: {
    name?: string;
    age?: number;
    medications?: string[];
  };
}

export function DNAAnalysisPanel({ genotypes, userInfo }: DNAAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'pgx' | 'nutrigenomics' | 'action-plan'>('overview');
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);
  
  // Run complete analysis
  const analysis = React.useMemo(() => analyzeCompleteDNA(genotypes), [genotypes]);
  const execSummary = React.useMemo(() => generateExecutiveSummary(analysis), [analysis]);
  
  return (
    <div className="dna-analysis-panel">
      {/* Header */}
      <div className="panel-header">
        <h1>🧬 Comprehensive DNA Analysis</h1>
        {userInfo?.name && <p className="user-name">Analysis for: {userInfo.name}</p>}
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-value">{analysis.summary.totalVariantsAnalyzed}</span>
            <span className="stat-label">Variants Analyzed</span>
          </div>
          <div className="stat">
            <span className="stat-value">{analysis.summary.totalGenesAnalyzed}</span>
            <span className="stat-label">Genes</span>
          </div>
          <div className="stat">
            <span className="stat-value critical">{analysis.summary.criticalFindingsCount}</span>
            <span className="stat-label">Critical Findings</span>
          </div>
          <div className="stat">
            <span className="stat-value">{analysis.summary.actionableInsights}</span>
            <span className="stat-label">Actionable Insights</span>
          </div>
        </div>
        
        <button onClick={() => setShowExecutiveSummary(!showExecutiveSummary)} className="btn-summary">
          {showExecutiveSummary ? 'Hide' : 'Show'} Executive Summary
        </button>
        
        {showExecutiveSummary && (
          <pre className="executive-summary">{execSummary}</pre>
        )}
      </div>
      
      {/* CRITICAL FINDINGS ALERT - Always visible if present */}
      {analysis.criticalFindings.filter(f => f.priority === 'critical').length > 0 && (
        <div className="critical-findings-alert">
          <div className="alert-header">
            <span className="icon">⛔</span>
            <h2>CRITICAL FINDINGS REQUIRE IMMEDIATE ACTION</h2>
          </div>
          {analysis.criticalFindings
            .filter(f => f.priority === 'critical')
            .map((finding, idx) => (
              <div key={idx} className="critical-finding-card">
                <div className="finding-badge">{finding.source.toUpperCase()}</div>
                <h3>{finding.finding}</h3>
                <p className="action">{finding.action}</p>
                <p className="variants">Variants: {finding.variants.join(', ')}</p>
              </div>
            ))}
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={activeTab === 'overview' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('overview')}
        >
          📋 Overview
        </button>
        <button 
          className={activeTab === 'pgx' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('pgx')}
        >
          💊 Pharmacogenomics
        </button>
        <button 
          className={activeTab === 'nutrigenomics' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('nutrigenomics')}
        >
          🥗 Nutrigenomics
        </button>
        <button 
          className={activeTab === 'action-plan' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('action-plan')}
        >
          ✅ Action Plan
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewTab analysis={analysis} />
        )}
        
        {activeTab === 'pgx' && (
          <PharmacogenomicsTab pgx={analysis.pgx} />
        )}
        
        {activeTab === 'nutrigenomics' && (
          <NutrigenomicsTab nutri={analysis.nutrigenomics} />
        )}
        
        {activeTab === 'action-plan' && (
          <ActionPlanTab actionPlan={analysis.actionPlan} />
        )}
      </div>
    </div>
  );
}

/**
 * OVERVIEW TAB
 */
function OverviewTab({ analysis }: { analysis: IntegratedDNAAnalysis }) {
  return (
    <div className="overview-tab">
      <h2>Quick Summary</h2>
      
      {/* High Priority Findings */}
      <div className="section">
        <h3>⚠️ High Priority Findings</h3>
        {analysis.criticalFindings
          .filter(f => f.priority === 'high')
          .map((finding, idx) => (
            <div key={idx} className="finding-card priority-high">
              <div className="badge">{finding.source}</div>
              <h4>{finding.finding}</h4>
              <p>{finding.action}</p>
            </div>
          ))}
        
        {analysis.criticalFindings.filter(f => f.priority === 'high').length === 0 && (
          <p className="no-findings">No high-priority findings</p>
        )}
      </div>
      
      {/* Key Insights */}
      <div className="section">
        <h3>📊 Key Insights</h3>
        
        <div className="insights-grid">
          {/* PGx Insight */}
          <div className="insight-card">
            <h4>💊 Pharmacogenomics</h4>
            {analysis.pgx.cyp2d6 && (
              <p><strong>CYP2D6:</strong> {analysis.pgx.cyp2d6.diplotype.phenotype}</p>
            )}
            {analysis.pgx.cyp2c19 && (
              <p><strong>CYP2C19:</strong> {analysis.pgx.cyp2c19.diplotype?.phenotype || 'Unknown'}</p>
            )}
            {analysis.pgx.criticalSafety && (
              <p className="safety-note">
                {analysis.pgx.criticalSafety.dpyd?.length || 0} DPYD variants detected
              </p>
            )}
          </div>
          
          {/* Vitamin Insight */}
          <div className="insight-card">
            <h4>💊 Vitamins</h4>
            <p><strong>Vitamin D:</strong> {analysis.nutrigenomics.categories.vitamins.vitaminD.status}</p>
            <p><strong>B12:</strong> {analysis.nutrigenomics.categories.vitamins.vitaminB12.status}</p>
            <p><strong>Folate:</strong> {analysis.nutrigenomics.categories.vitamins.folate.status}</p>
          </div>
          
          {/* Food Intolerance Insight */}
          <div className="insight-card">
            <h4>🥛 Food Intolerances</h4>
            <p><strong>Lactose:</strong> {analysis.nutrigenomics.categories.foodIntolerances.lactose.status}</p>
            <p><strong>Caffeine:</strong> {analysis.nutrigenomics.categories.foodIntolerances.caffeine.metabolizer} metabolizer</p>
            <p><strong>Alcohol:</strong> {analysis.nutrigenomics.categories.foodIntolerances.alcohol.aldh2Status}</p>
          </div>
          
          {/* Weight/Metabolism Insight */}
          <div className="insight-card">
            <h4>🏃 Metabolism</h4>
            <p><strong>Obesity risk:</strong> {analysis.nutrigenomics.categories.macronutrients.weight.obesityRisk}</p>
            <p><strong>Diabetes risk:</strong> {analysis.nutrigenomics.categories.macronutrients.carbohydrate.diabetesRisk}</p>
            <p><strong>Exercise benefit:</strong> {analysis.nutrigenomics.categories.macronutrients.weight.exerciseBenefit}</p>
          </div>
        </div>
      </div>
      
      {/* Supplement Recommendations */}
      <div className="section">
        <h3>💊 Recommended Supplements</h3>
        {analysis.nutrigenomics.supplements
          .filter(s => s.priority === 'critical' || s.priority === 'high')
          .map((supp, idx) => (
            <div key={idx} className={`supplement-card priority-${supp.priority}`}>
              <h4>{supp.supplement}</h4>
              <p><strong>Dose:</strong> {supp.dose}</p>
              <p><strong>Form:</strong> {supp.form}</p>
              <p className="rationale">{supp.rationale}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * PHARMACOGENOMICS TAB
 */
function PharmacogenomicsTab({ pgx }: { pgx: any }) {
  return (
    <div className="pgx-tab">
      <h2>💊 Pharmacogenomics Analysis</h2>
      
      {/* Critical Safety Section */}
      {pgx.criticalSafety && (
        <div className="section critical-safety">
          <h3>⛔ Critical Drug Safety</h3>
          
          {pgx.criticalSafety.dpyd && pgx.criticalSafety.dpyd.length > 0 && (
            <div className="safety-card critical">
              <h4>DPYD - 5-FU/Capecitabine</h4>
              <p className="warning">FATAL TOXICITY RISK - FDA MANDATORY TESTING</p>
              {pgx.criticalSafety.dpyd.map((v: any, idx: number) => (
                <div key={idx} className="variant">
                  <p><strong>Allele:</strong> {v.allele}</p>
                  <p><strong>Activity Score:</strong> {v.activityScore}</p>
                  <p><strong>Action:</strong> Dose reduce or avoid 5-FU/capecitabine</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Similar for NUDT15, TPMT, etc. */}
        </div>
      )}
      
      {/* CYP2D6 Section */}
      {pgx.cyp2d6 && (
        <div className="section">
          <h3>CYP2D6 - Drug Metabolism</h3>
          <div className={`cyp-card phenotype-${pgx.cyp2d6.phenotype.toLowerCase().replace(' ', '-')}`}>
            <h4>Phenotype: {pgx.cyp2d6.phenotype}</h4>
            <p><strong>Activity Score:</strong> {pgx.cyp2d6.activityScore}</p>
            <p><strong>Diplotype:</strong> {pgx.cyp2d6.diplotype}</p>
            
            <div className="affected-drugs">
              <h5>Affected Medications:</h5>
              <ul>
                <li>Codeine, Tramadol (may not work if PM)</li>
                <li>Tamoxifen (reduced efficacy if PM)</li>
                <li>SSRIs, TCAs (dose adjustment needed)</li>
                <li>Antipsychotics (dose adjustment needed)</li>
              </ul>
            </div>
            
            <div className="recommendations">
              <h5>Recommendations:</h5>
              <ul>
                {pgx.cyp2d6.phenotype === 'Poor Metabolizer' && (
                  <>
                    <li>Avoid codeine, tramadol (no pain relief)</li>
                    <li>Tamoxifen: Consider alternative therapy</li>
                    <li>Antidepressants: Start 50% dose, titrate slowly</li>
                  </>
                )}
                {pgx.cyp2d6.phenotype === 'Ultra-Rapid Metabolizer' && (
                  <>
                    <li>Codeine: High overdose risk, avoid</li>
                    <li>SSRIs may not work well, consider higher doses</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Add similar sections for CYP2C19, CYP2C9, etc. */}
    </div>
  );
}

/**
 * NUTRIGENOMICS TAB
 */
function NutrigenomicsTab({ nutri }: { nutri: any }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  return (
    <div className="nutri-tab">
      <h2>🥗 Nutrigenomics Analysis</h2>
      
      {/* Vitamins Section */}
      <div className="section">
        <h3 onClick={() => setExpandedSection(expandedSection === 'vitamins' ? null : 'vitamins')} className="collapsible">
          💊 Vitamin Metabolism {expandedSection === 'vitamins' ? '▼' : '▶'}
        </h3>
        
        {expandedSection === 'vitamins' && (
          <div className="expanded-content">
            {/* Vitamin D */}
            <div className={`vitamin-card status-${nutri.categories.vitamins.vitaminD.status}`}>
              <h4>Vitamin D</h4>
              <div className="status-badge">{nutri.categories.vitamins.vitaminD.status}</div>
              <p>{nutri.categories.vitamins.vitaminD.interpretation}</p>
              <p><strong>Recommended Dose:</strong> {nutri.categories.vitamins.vitaminD.recommendedDose}</p>
              
              <details>
                <summary>Variants Analyzed</summary>
                {nutri.categories.vitamins.vitaminD.variants.map((v: any, idx: number) => (
                  <p key={idx}>{v.rsid} ({v.genotype}): {v.interpretation}</p>
                ))}
              </details>
            </div>
            
            {/* Vitamin B12 */}
            <div className={`vitamin-card status-${nutri.categories.vitamins.vitaminB12.status}`}>
              <h4>Vitamin B12</h4>
              <div className="status-badge">{nutri.categories.vitamins.vitaminB12.status}</div>
              <p><strong>Secretor Status:</strong> {nutri.categories.vitamins.vitaminB12.secretorStatus}</p>
              <p>{nutri.categories.vitamins.vitaminB12.interpretation}</p>
              <p><strong>Recommended Form:</strong> {nutri.categories.vitamins.vitaminB12.recommendedForm}</p>
            </div>
            
            {/* Folate */}
            <div className={`vitamin-card status-${nutri.categories.vitamins.folate.status}`}>
              <h4>Folate (MTHFR)</h4>
              <div className="status-badge">{nutri.categories.vitamins.folate.status}</div>
              <p><strong>C677T:</strong> {nutri.categories.vitamins.folate.mthfrC677T}</p>
              <p><strong>A1298C:</strong> {nutri.categories.vitamins.folate.mthfrA1298C}</p>
              <p>{nutri.categories.vitamins.folate.interpretation}</p>
              <p><strong>Recommended Form:</strong> {nutri.categories.vitamins.folate.recommendedForm}</p>
            </div>
            
            {/* Vitamin A */}
            <div className={`vitamin-card status-${nutri.categories.vitamins.vitaminA.status}`}>
              <h4>Vitamin A</h4>
              <div className="status-badge">{nutri.categories.vitamins.vitaminA.status}</div>
              <p>{nutri.categories.vitamins.vitaminA.interpretation}</p>
              <ul>
                {nutri.categories.vitamins.vitaminA.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Minerals Section */}
      <div className="section">
        <h3 onClick={() => setExpandedSection(expandedSection === 'minerals' ? null : 'minerals')} className="collapsible">
          ⚗️ Mineral Metabolism {expandedSection === 'minerals' ? '▼' : '▶'}
        </h3>
        
        {expandedSection === 'minerals' && (
          <div className="expanded-content">
            {/* Iron */}
            <div className={`mineral-card status-${nutri.categories.minerals.iron.status}`}>
              <h4>Iron</h4>
              <div className="status-badge">{nutri.categories.minerals.iron.status}</div>
              <p><strong>Hemochromatosis Risk:</strong> {nutri.categories.minerals.iron.hemochromatosisRisk}</p>
              <p><strong>H63D:</strong> {nutri.categories.minerals.iron.h63d}</p>
              <p><strong>C282Y:</strong> {nutri.categories.minerals.iron.c282y}</p>
              <p>{nutri.categories.minerals.iron.interpretation}</p>
              <ul>
                {nutri.categories.minerals.iron.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Food Intolerances Section */}
      <div className="section">
        <h3 onClick={() => setExpandedSection(expandedSection === 'intolerances' ? null : 'intolerances')} className="collapsible">
          🥛 Food Intolerances {expandedSection === 'intolerances' ? '▼' : '▶'}
        </h3>
        
        {expandedSection === 'intolerances' && (
          <div className="expanded-content">
            {/* Lactose */}
            <div className={`intolerance-card status-${nutri.categories.foodIntolerances.lactose.status}`}>
              <h4>Lactose</h4>
              <div className="status-badge">{nutri.categories.foodIntolerances.lactose.status}</div>
              <p><strong>Genotype:</strong> {nutri.categories.foodIntolerances.lactose.genotype}</p>
              <p><strong>Confidence:</strong> {nutri.categories.foodIntolerances.lactose.confidence}</p>
              <ul>
                {nutri.categories.foodIntolerances.lactose.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
            
            {/* Caffeine */}
            <div className={`intolerance-card status-${nutri.categories.foodIntolerances.caffeine.metabolizer}`}>
              <h4>Caffeine</h4>
              <div className="status-badge">{nutri.categories.foodIntolerances.caffeine.metabolizer}</div>
              <p><strong>Genotype:</strong> {nutri.categories.foodIntolerances.caffeine.genotype}</p>
              <p><strong>CVD Risk:</strong> {nutri.categories.foodIntolerances.caffeine.cardiovascularRisk}</p>
              <ul>
                {nutri.categories.foodIntolerances.caffeine.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
            
            {/* Alcohol */}
            <div className={`intolerance-card status-${nutri.categories.foodIntolerances.alcohol.flushRisk}`}>
              <h4>Alcohol</h4>
              <div className="status-badge">{nutri.categories.foodIntolerances.alcohol.aldh2Status}</div>
              <p><strong>ALDH2:</strong> {nutri.categories.foodIntolerances.alcohol.aldh2Status}</p>
              <p><strong>Flush Risk:</strong> {nutri.categories.foodIntolerances.alcohol.flushRisk}</p>
              <p><strong>Cancer Risk:</strong> {nutri.categories.foodIntolerances.alcohol.cancerRisk}</p>
              <ul>
                {nutri.categories.foodIntolerances.alcohol.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Add sections for Macronutrients, Omega, Taste, etc. */}
    </div>
  );
}

/**
 * ACTION PLAN TAB
 */
function ActionPlanTab({ actionPlan }: { actionPlan: any }) {
  return (
    <div className="action-plan-tab">
      <h2>✅ Personalized Action Plan</h2>
      
      {/* Immediate Actions */}
      <div className="section immediate-actions">
        <h3>⚠️ IMMEDIATE ACTIONS (This Week)</h3>
        {actionPlan.immediate.length > 0 ? (
          actionPlan.immediate.map((action: any, idx: number) => (
            <div key={idx} className="action-card immediate">
              <div className="action-header">
                <h4>{action.category}</h4>
                <span className="source-badge">{action.source}</span>
              </div>
              <p className="action-text"><strong>{action.action}</strong></p>
              <p className="timeframe">⏱️ {action.timeframe}</p>
              <p className="rationale">{action.rationale}</p>
            </div>
          ))
        ) : (
          <p className="no-actions">No immediate actions required</p>
        )}
      </div>
      
      {/* Short-Term Actions */}
      <div className="section short-term-actions">
        <h3>📅 SHORT-TERM ACTIONS (1-3 Months)</h3>
        {actionPlan.shortTerm.map((action: any, idx: number) => (
          <div key={idx} className="action-card short-term">
            <div className="action-header">
              <h4>{action.category}</h4>
              <span className="source-badge">{action.source}</span>
            </div>
            <p className="action-text">{action.action}</p>
            <p className="timeframe">⏱️ {action.timeframe}</p>
            <p className="rationale">{action.rationale}</p>
          </div>
        ))}
      </div>
      
      {/* Long-Term Actions */}
      <div className="section long-term-actions">
        <h3>🎯 LONG-TERM ACTIONS (3-12 Months)</h3>
        {actionPlan.longTerm.map((action: any, idx: number) => (
          <div key={idx} className="action-card long-term">
            <div className="action-header">
              <h4>{action.category}</h4>
              <span className="source-badge">{action.source}</span>
            </div>
            <p className="action-text">{action.action}</p>
            <p className="timeframe">⏱️ {action.timeframe}</p>
            <p className="rationale">{action.rationale}</p>
          </div>
        ))}
      </div>
      
      {/* Download Action Plan */}
      <div className="action-buttons">
        <button className="btn-download" onClick={() => {
          const blob = new Blob([JSON.stringify(actionPlan, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'dna-action-plan.json';
          a.click();
        }}>
          📥 Download Action Plan
        </button>
        
        <button className="btn-print" onClick={() => window.print()}>
          🖨️ Print Report
        </button>
      </div>
    </div>
  );
}

/**
 * CSS STYLES (Include in your stylesheet)
 */
export const dnaAnalysisStyles = `
.dna-analysis-panel {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.panel-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2.5em;
  font-weight: bold;
}

.stat-value.critical {
  color: #ff4444;
}

.stat-label {
  display: block;
  font-size: 0.9em;
  opacity: 0.9;
}

.critical-findings-alert {
  background: #fff3cd;
  border: 3px solid #ff4444;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.alert-header .icon {
  font-size: 2em;
}

.critical-finding-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin: 10px 0;
  border-left: 4px solid #ff4444;
}

.finding-badge {
  display: inline-block;
  background: #ff4444;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
  margin-bottom: 8px;
}

.tab-navigation {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.3s;
}

.tab:hover {
  background: #f5f5f5;
}

.tab.active {
  border-bottom-color: #667eea;
  color: #667eea;
  font-weight: bold;
}

.section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.status-high_risk, .status-critical {
  border-left: 4px solid #ff4444;
}

.status-moderate_risk, .status-moderate {
  border-left: 4px solid #ff9800;
}

.status-low_risk, .status-optimal {
  border-left: 4px solid #4caf50;
}

.vitamin-card, .mineral-card, .intolerance-card {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  margin: 10px 0;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: bold;
  margin-bottom: 10px;
}

.action-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin: 10px 0;
  border-left: 4px solid #ccc;
}

.action-card.immediate {
  border-left-color: #ff4444;
  background: #fff5f5;
}

.action-card.short-term {
  border-left-color: #ff9800;
}

.action-card.long-term {
  border-left-color: #2196f3;
}

.source-badge {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.75em;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-download, .btn-print, .btn-summary {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  transition: background 0.3s;
}

.btn-download:hover, .btn-print:hover, .btn-summary:hover {
  background: #5568d3;
}

.executive-summary {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  line-height: 1.6;
  margin-top: 15px;
}

.collapsible {
  cursor: pointer;
  user-select: none;
}

.collapsible:hover {
  color: #667eea;
}

@media print {
  .tab-navigation, .action-buttons {
    display: none;
  }
}
`;
