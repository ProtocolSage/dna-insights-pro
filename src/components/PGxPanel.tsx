// PGxPanel.tsx - Simple panel to display your pharmacogenomics results
import React from 'react';
import { analyzePGx, type PGxResult } from './pgx-integration';

interface PGxPanelProps {
  genotypes: Map<string, { rsid: string; genotype: string }>;
}

export function PGxPanel({ genotypes }: PGxPanelProps) {
  const results = React.useMemo(() => analyzePGx(genotypes), [genotypes]);
  
  const critical = results.filter(r => r.warnings.length > 0);
  const normal = results.filter(r => r.warnings.length === 0);

  return (
    <div className="pgx-panel" style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>💊 Pharmacogenomics Results</h1>
      
      {/* Critical Warnings */}
      {critical.length > 0 && (
        <div style={{ 
          background: '#fee', 
          border: '2px solid #c00', 
          borderRadius: '8px', 
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: '0 0 12px 0', color: '#c00' }}>⚠️ Critical Findings</h2>
          {critical.map(result => (
            <div key={result.gene} style={{ marginBottom: '12px' }}>
              <strong>{result.gene}</strong>: {result.phenotype.phenotype}
              {result.warnings.map((warning, i) => (
                <div key={i} style={{ marginTop: '4px', fontSize: '14px' }}>
                  {warning}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Gene Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
        {results.map(result => (
          <div key={result.gene} style={{
            border: result.warnings.length > 0 ? '2px solid #c00' : '1px solid #ccc',
            borderRadius: '8px',
            padding: '16px',
            background: '#fff'
          }}>
            <h3 style={{ margin: '0 0 8px 0' }}>{result.gene}</h3>
            
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              Diplotype: <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>
                {result.diplotype.diplotype}
              </code>
            </div>

            <div style={{ 
              display: 'inline-block',
              background: result.phenotype.phenotype.includes('Poor') || result.phenotype.phenotype.includes('Ultrarapid') ? '#fee' : '#efe',
              color: result.phenotype.phenotype.includes('Poor') || result.phenotype.phenotype.includes('Ultrarapid') ? '#c00' : '#060',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}>
              {result.phenotype.phenotype}
              {result.phenotype.activityScore !== undefined && ` (${result.phenotype.activityScore})`}
            </div>

            {result.affectedDrugs.length > 0 && (
              <div>
                <strong style={{ fontSize: '14px' }}>Affected Drugs:</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '13px' }}>
                  {result.affectedDrugs.map((drug, i) => (
                    <li key={i}>{drug}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <details style={{ marginTop: '12px', fontSize: '13px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0066cc' }}>
                  View Recommendations ({result.recommendations.length})
                </summary>
                {result.recommendations.map((rec, i) => (
                  <div key={i} style={{ 
                    marginTop: '8px', 
                    padding: '8px', 
                    background: '#f9f9f9',
                    borderLeft: '3px solid #0066cc'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>{rec.drug}</div>
                    <div style={{ marginTop: '4px' }}>{rec.recommendation}</div>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                      {rec.implication}
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#999' }}>
                      Source: {rec.source} | Strength: {rec.strength}
                    </div>
                  </div>
                ))}
              </details>
            )}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{ 
        marginTop: '32px', 
        padding: '16px', 
        background: '#f5f5f5',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#666'
      }}>
        <p><strong>⚠️ Important:</strong> This is for educational purposes only. Consult your healthcare provider before making any medication decisions. Pharmacogenomic testing should be interpreted by qualified professionals in context of your complete medical history.</p>
        <p style={{ marginTop: '8px' }}><strong>Limitations:</strong> SNP array data cannot detect copy number variations (especially CYP2D6 gene duplications/deletions), rare alleles, or structural variants. Clinical-grade PGx testing may provide more comprehensive results.</p>
      </div>
    </div>
  );
}
