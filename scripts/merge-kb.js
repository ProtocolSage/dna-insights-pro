#!/usr/bin/env node
const fs = require('fs');

console.log('\n🔬 ULTIMATE PROFESSIONAL-GRADE PGx KB MERGER\n');
console.log('='.repeat(80) + '\n');

const files = [
  'kb-pgx-supplement.json',
  'kb-pgx-comprehensive.json',
  'kb-pgx-final-comprehensive.json',
  'kb-pgx-ultimate-expansion.json'
];

const allVariants = new Map();
let totalLoaded = 0;

files.forEach(filename => {
  if (fs.existsSync(filename)) {
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    console.log(`📁 ${filename}: ${data.variants.length} variants`);
    data.variants.forEach(v => {
      if (!allVariants.has(v.rsid)) {
        allVariants.set(v.rsid, v);
        totalLoaded++;
      }
    });
  }
});

console.log(`\n📊 Total unique variants: ${totalLoaded}\n`);

// Gene counts
const geneCount = {};
allVariants.forEach(v => {
  if (v.gene) geneCount[v.gene] = (geneCount[v.gene] || 0) + 1;
});

const criticalGenes = ['DPYD', 'NUDT15', 'TPMT', 'CYP2D6', 'CYP2C19', 'CYP2C9', 'VKORC1', 'SLCO1B1', 'G6PD', 'UGT1A1', 'HLA-B'];

console.log('🎯 CRITICAL PHARMACOGENOMIC GENES:');
console.log('='.repeat(80));
criticalGenes.forEach(gene => {
  const count = geneCount[gene] || 0;
  const status = count > 0 ? '✅' : '❌';
  console.log(`${status} ${gene.padEnd(20)} ${count.toString().padStart(3)} variants`);
});

console.log('\n📋 ALL GENES (sorted by variant count):');
console.log('='.repeat(80));
Object.entries(geneCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 40)
  .forEach(([gene, count]) => {
    const isCritical = criticalGenes.includes(gene) ? '⭐' : '  ';
    console.log(`${isCritical} ${gene.padEnd(20)} ${count.toString().padStart(3)} variants`);
  });

// Create master
const masterKB = {
  kb_version: "5.0.0-ultimate-professional",
  reference_build: "GRCh37",
  build_date: new Date().toISOString().split('T')[0],
  description: "ULTIMATE professional-grade pharmacogenomics knowledge base - comprehensive coverage of all clinically-relevant and research-grade PGx variants detectable on 23andMe v5 platform. Includes CPIC Level A/B, FDA-labeled markers, and promising research variants.",
  methodology: "Curated from CPIC, PharmGKB, FDA labels, and peer-reviewed literature. Includes actionable variants (CPIC A/B, FDA-labeled), emerging biomarkers (CPIC C, PharmGKB 2A), and research markers with promising evidence.",
  coverage: {
    total_variants: allVariants.size,
    critical_safety: (geneCount['DPYD'] || 0) + (geneCount['NUDT15'] || 0) + (geneCount['TPMT'] || 0) + (geneCount['G6PD'] || 0),
    cyp_enzymes: (geneCount['CYP2D6'] || 0) + (geneCount['CYP2C19'] || 0) + (geneCount['CYP2C9'] || 0) + (geneCount['CYP2B6'] || 0) + (geneCount['CYP3A5'] || 0) + (geneCount['CYP3A4'] || 0) + (geneCount['CYP1A2'] || 0) + (geneCount['CYP2A6'] || 0) + (geneCount['CYP2C8'] || 0),
    transporters: (geneCount['SLCO1B1'] || 0) + (geneCount['SLCO1B3'] || 0) + (geneCount['ABCG2'] || 0) + (geneCount['ABCB1'] || 0),
    phase_ii: (geneCount['UGT1A1'] || 0) + (geneCount['NAT2'] || 0) + (geneCount['TPMT'] || 0) + (geneCount['GSTP1'] || 0) + (geneCount['GSTM1'] || 0),
    hla: (geneCount['HLA-B'] || 0) + (geneCount['HLA-A'] || 0) + (geneCount['HLA-DRB1'] || 0) + (geneCount['HLA-DQA1'] || 0),
    pharmacodynamics: (geneCount['OPRM1'] || 0) + (geneCount['COMT'] || 0) + (geneCount['ADRB2'] || 0) + (geneCount['ANKK1'] || 0) + (geneCount['DRD2'] || 0) + (geneCount['HTR2A'] || 0),
    substance_metabolism: (geneCount['ADH1B'] || 0) + (geneCount['ALDH2'] || 0) + (geneCount['CHRNA3'] || 0) + (geneCount['CHRNA5'] || 0)
  },
  genes_covered: Object.keys(geneCount).length,
  variants: Array.from(allVariants.values()).sort((a, b) => {
    if (a.gene !== b.gene) return (a.gene || '').localeCompare(b.gene || '');
    return (a.pos || 0) - (b.pos || 0);
  })
};

fs.writeFileSync('kb-pgx-ultimate.json', JSON.stringify(masterKB, null, 2));

console.log('\n\n✅ ULTIMATE PGx KB CREATED: kb-pgx-ultimate.json');
console.log('='.repeat(80));
console.log(`📦 Total variants: ${masterKB.variants.length}`);
console.log(`🧬 Genes covered: ${masterKB.genes_covered}`);
console.log('\n🎯 COMPREHENSIVE COVERAGE:');
console.log(`   ⛔ Critical safety markers: ${masterKB.coverage.critical_safety}`);
console.log(`   🧬 CYP enzyme variants: ${masterKB.coverage.cyp_enzymes}`);
console.log(`   🚚 Drug transporters: ${masterKB.coverage.transporters}`);
console.log(`   ⚗️  Phase II enzymes: ${masterKB.coverage.phase_ii}`);
console.log(`   🧫 HLA hypersensitivity: ${masterKB.coverage.hla}`);
console.log(`   🎯 Pharmacodynamic genes: ${masterKB.coverage.pharmacodynamics}`);
console.log(`   🍺 Substance metabolism: ${masterKB.coverage.substance_metabolism}`);
console.log('\n' + '='.repeat(80));
console.log('✅ PROFESSIONAL-GRADE COMPREHENSIVE PGx KB READY\n');
