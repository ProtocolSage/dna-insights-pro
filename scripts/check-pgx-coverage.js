#!/usr/bin/env node
// check-pgx-coverage.js - Check which PGx SNPs are in your 23andMe file
// Usage: node check-pgx-coverage.js your-23andme-file.txt

const fs = require('fs');

const CRITICAL_PGX_SNPS = {
  // CRITICAL SAFETY MARKERS
  "rs3918290": { gene: "DPYD", allele: "*2A", impact: "⛔ CRITICAL: 5-FU toxicity" },
  "rs55886062": { gene: "DPYD", allele: "*13", impact: "⛔ CRITICAL: 5-FU toxicity" },
  "rs67376798": { gene: "DPYD", allele: "c.2846A>T", impact: "⛔ CRITICAL: 5-FU dose reduction" },
  "rs56038477": { gene: "DPYD", allele: "HapB3", impact: "⛔ CRITICAL: 5-FU dose reduction" },
  
  "rs1800460": { gene: "TPMT", allele: "*3B", impact: "⛔ CRITICAL: Thiopurine toxicity" },
  "rs1142345": { gene: "TPMT", allele: "*3C", impact: "⛔ CRITICAL: Thiopurine toxicity" },
  "rs1800462": { gene: "TPMT", allele: "*2", impact: "⛔ CRITICAL: Thiopurine toxicity" },
  
  "rs116855232": { gene: "NUDT15", allele: "*2", impact: "⛔ CRITICAL: Thiopurine toxicity (East Asian)" },
  "rs147390019": { gene: "NUDT15", allele: "*3", impact: "⛔ CRITICAL: Thiopurine toxicity (East Asian)" },
  
  // HIGH PRIORITY
  "rs4244285": { gene: "CYP2C19", allele: "*2", impact: "🟡 Clopidogrel (heart drug) response" },
  "rs4986893": { gene: "CYP2C19", allele: "*3", impact: "🟡 Clopidogrel response" },
  "rs12248560": { gene: "CYP2C19", allele: "*17", impact: "🟡 CYP2C19 rapid metabolizer" },
  
  "rs1065852": { gene: "CYP2D6", allele: "*10", impact: "🟡 Codeine, antidepressants, tamoxifen" },
  "rs3892097": { gene: "CYP2D6", allele: "*4", impact: "🟡 CYP2D6 poor metabolizer" },
  "rs35742686": { gene: "CYP2D6", allele: "*3", impact: "🟡 CYP2D6 no function" },
  "rs5030655": { gene: "CYP2D6", allele: "*6", impact: "🟡 CYP2D6 no function" },
  "rs28371706": { gene: "CYP2D6", allele: "*17", impact: "🟡 CYP2D6 decreased (African)" },
  
  "rs4149056": { gene: "SLCO1B1", allele: "*5", impact: "🟡 Statin myopathy risk" },
  "rs2306283": { gene: "SLCO1B1", allele: "*1b", impact: "🟡 Statin transport" },
  
  "rs1799853": { gene: "CYP2C9", allele: "*2", impact: "🟡 Warfarin dosing" },
  "rs1057910": { gene: "CYP2C9", allele: "*3", impact: "🟡 Warfarin dosing" },
  "rs9923231": { gene: "VKORC1", allele: "-1639G>A", impact: "🟡 Warfarin sensitivity" },
  
  "rs776746": { gene: "CYP3A5", allele: "*3", impact: "🔵 Tacrolimus dosing" },
  "rs2231142": { gene: "ABCG2", allele: "Q141K", impact: "🔵 Rosuvastatin, gout" },
  "rs1801280": { gene: "NAT2", allele: "*5", impact: "🔵 Isoniazid metabolism" },
  "rs1799930": { gene: "NAT2", allele: "*6", impact: "🔵 Isoniazid metabolism" },
  "rs1799931": { gene: "NAT2", allele: "*7", impact: "🔵 Isoniazid metabolism" },
};

// Read file
const filename = process.argv[2];
if (!filename) {
  console.log('Usage: node check-pgx-coverage.js your-23andme-file.txt');
  process.exit(1);
}

console.log(`\n🔍 Checking PGx SNP coverage in: ${filename}\n`);

const fileContent = fs.readFileSync(filename, 'utf8');
const lines = fileContent.split('\n');

// Parse SNPs
const foundSNPs = new Set();
lines.forEach(line => {
  if (line.startsWith('#') || line.trim() === '') return;
  const parts = line.trim().split(/\s+/);
  if (parts.length >= 4) {
    foundSNPs.add(parts[0]); // rsID
  }
});

console.log(`📊 Total SNPs in file: ${foundSNPs.size.toLocaleString()}`);
console.log(`🎯 Checking ${Object.keys(CRITICAL_PGX_SNPS).length} key pharmacogenomic SNPs...\n`);

// Check coverage
const found = [];
const missing = [];

Object.entries(CRITICAL_PGX_SNPS).forEach(([rsid, info]) => {
  if (foundSNPs.has(rsid)) {
    found.push({ rsid, ...info });
  } else {
    missing.push({ rsid, ...info });
  }
});

// Display results
console.log('✅ FOUND IN YOUR FILE:\n');
found.sort((a, b) => {
  if (a.impact.startsWith('⛔') && !b.impact.startsWith('⛔')) return -1;
  if (!a.impact.startsWith('⛔') && b.impact.startsWith('⛔')) return 1;
  return a.gene.localeCompare(b.gene);
});

found.forEach(snp => {
  console.log(`  ${snp.rsid.padEnd(12)} ${snp.gene.padEnd(10)} ${snp.allele.padEnd(12)} ${snp.impact}`);
});

if (missing.length > 0) {
  console.log('\n❌ MISSING FROM YOUR FILE:\n');
  missing.sort((a, b) => {
    if (a.impact.startsWith('⛔') && !b.impact.startsWith('⛔')) return -1;
    if (!a.impact.startsWith('⛔') && b.impact.startsWith('⛔')) return 1;
    return a.gene.localeCompare(b.gene);
  });
  
  missing.forEach(snp => {
    console.log(`  ${snp.rsid.padEnd(12)} ${snp.gene.padEnd(10)} ${snp.allele.padEnd(12)} ${snp.impact}`);
  });
}

// Summary
console.log(`\n📈 COVERAGE SUMMARY:`);
console.log(`   Found: ${found.length}/${Object.keys(CRITICAL_PGX_SNPS).length} (${Math.round(found.length/Object.keys(CRITICAL_PGX_SNPS).length*100)}%)`);

const criticalFound = found.filter(s => s.impact.startsWith('⛔'));
const criticalTotal = Object.values(CRITICAL_PGX_SNPS).filter(s => s.impact.startsWith('⛔')).length;
console.log(`   Critical safety markers: ${criticalFound.length}/${criticalTotal}`);

console.log('\n💡 NOTE: 23andMe coverage varies by chip version (v3/v4/v5).');
console.log('   Missing SNPs mean you cannot determine that specific star allele.');
console.log('   The analysis will work with whatever SNPs you have.\n');

// Gene summary
const genesSummary = {};
found.forEach(snp => {
  genesSummary[snp.gene] = (genesSummary[snp.gene] || 0) + 1;
});

console.log('🧬 COVERAGE BY GENE:');
Object.entries(genesSummary).sort((a, b) => b[1] - a[1]).forEach(([gene, count]) => {
  const total = Object.values(CRITICAL_PGX_SNPS).filter(s => s.gene === gene).length;
  console.log(`   ${gene.padEnd(12)} ${count}/${total} variants`);
});

console.log('\n');
