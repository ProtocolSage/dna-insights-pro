# DNA Testing Infrastructure Setup Script
# Integrates testing files from downloads into dna-insights-pro project
# Author: Claude
# Date: 2025-12-22

# Define paths
$sourceDir = "C:\Users\Pablo\Downloads\dna-test-suite"
$projectDir = "C:\dev\dna-insights-pro"

Write-Host "🧬 DNA Testing Infrastructure Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verify source directory exists
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Error: Source directory not found: $sourceDir" -ForegroundColor Red
    Write-Host "Please verify the files are downloaded to this location." -ForegroundColor Yellow
    exit 1
}

# Verify project directory exists
if (-not (Test-Path $projectDir)) {
    Write-Host "❌ Error: Project directory not found: $projectDir" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Source directory found: $sourceDir" -ForegroundColor Green
Write-Host "✓ Project directory found: $projectDir" -ForegroundColor Green
Write-Host ""

# Create necessary directories
Write-Host "📁 Creating directory structure..." -ForegroundColor Cyan

$testsAnalyzersDir = Join-Path $projectDir "tests\analyzers"
if (-not (Test-Path $testsAnalyzersDir)) {
    New-Item -Path $testsAnalyzersDir -ItemType Directory -Force | Out-Null
    Write-Host "  ✓ Created: tests\analyzers\" -ForegroundColor Green
} else {
    Write-Host "  ✓ Already exists: tests\analyzers\" -ForegroundColor Yellow
}

Write-Host ""

# Copy files to root directory
Write-Host "📄 Copying root configuration files..." -ForegroundColor Cyan

$rootFiles = @(
    @{Source = "vitest.config"; Dest = "vitest.config.ts"; Description = "Vitest configuration"},
    @{Source = "QUICKSTART"; Dest = "QUICKSTART.md"; Description = "Quick start guide"},
    @{Source = "CHECKLIST"; Dest = "CHECKLIST.md"; Description = "Integration checklist"},
    @{Source = "PACKAGE_SUMMARY"; Dest = "PACKAGE_SUMMARY.md"; Description = "Package summary"},
    @{Source = "README-TESTING"; Dest = "README-TESTING.md"; Description = "Testing documentation"}
)

foreach ($file in $rootFiles) {
    $sourcePath = Join-Path $sourceDir $file.Source
    $destPath = Join-Path $projectDir $file.Dest
    
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $destPath -Force
        Write-Host "  ✓ Copied: $($file.Dest) ($($file.Description))" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Missing: $($file.Source)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Copy files to tests directory
Write-Host "🧪 Copying test framework files..." -ForegroundColor Cyan

$testFiles = @(
    @{Source = "setup"; Dest = "tests\setup.ts"; Description = "Test setup & custom matchers"},
    @{Source = "test-utils"; Dest = "tests\test-utils.ts"; Description = "Test utilities & factories"},
    @{Source = "pgx-integration.test"; Dest = "tests\pgx-integration.test.ts"; Description = "Integration tests"}
)

foreach ($file in $testFiles) {
    $sourcePath = Join-Path $sourceDir $file.Source
    $destPath = Join-Path $projectDir $file.Dest
    
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $destPath -Force
        Write-Host "  ✓ Copied: $($file.Dest)" -ForegroundColor Green
        Write-Host "    ($($file.Description))" -ForegroundColor Gray
    } else {
        Write-Host "  ⚠ Missing: $($file.Source)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Copy analyzer test files
Write-Host "🔬 Copying analyzer test files..." -ForegroundColor Cyan

$analyzerFiles = @(
    @{Source = "cyp2c9.test"; Dest = "tests\analyzers\cyp2c9.test.ts"; Description = "CYP2C9 analyzer tests"},
    @{Source = "cyp2d6.test"; Dest = "tests\analyzers\cyp2d6.test.ts"; Description = "CYP2D6 analyzer tests"},
    @{Source = "vkorc1.test"; Dest = "tests\analyzers\vkorc1.test.ts"; Description = "VKORC1 analyzer tests"}
)

foreach ($file in $analyzerFiles) {
    $sourcePath = Join-Path $sourceDir $file.Source
    $destPath = Join-Path $projectDir $file.Dest
    
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $destPath -Force
        Write-Host "  ✓ Copied: $($file.Dest)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Missing: $($file.Source)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Handle .gitignore (append, don't replace)
Write-Host "📝 Updating .gitignore..." -ForegroundColor Cyan

$sourceGitignore = Join-Path $sourceDir ".gitignore"
$destGitignore = Join-Path $projectDir ".gitignore"

if (Test-Path $sourceGitignore) {
    if (Test-Path $destGitignore) {
        # Append to existing .gitignore
        $newContent = Get-Content $sourceGitignore -Raw
        Add-Content -Path $destGitignore -Value "`n# Test Infrastructure`n$newContent"
        Write-Host "  ✓ Appended test patterns to existing .gitignore" -ForegroundColor Green
    } else {
        # Create new .gitignore
        Copy-Item -Path $sourceGitignore -Destination $destGitignore -Force
        Write-Host "  ✓ Created new .gitignore" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠ .gitignore not found in source" -ForegroundColor Yellow
}

Write-Host ""

# Handle package.json (backup and show instructions)
Write-Host "📦 Handling package.json..." -ForegroundColor Cyan

$sourcePackage = Join-Path $sourceDir "package"
$destPackage = Join-Path $projectDir "package.json"

if (Test-Path $sourcePackage) {
    # Create backup of existing package.json
    $backupPackage = Join-Path $projectDir "package.json.backup"
    if (Test-Path $destPackage) {
        Copy-Item -Path $destPackage -Destination $backupPackage -Force
        Write-Host "  ✓ Backed up existing package.json to package.json.backup" -ForegroundColor Green
    }
    
    # Copy new package.json as reference
    $referencePackage = Join-Path $projectDir "package-test-scripts.json"
    Copy-Item -Path $sourcePackage -Destination $referencePackage -Force
    Write-Host "  ✓ Saved test package.json as package-test-scripts.json" -ForegroundColor Green
    Write-Host "  ℹ You need to manually merge test scripts into package.json" -ForegroundColor Yellow
} else {
    Write-Host "  ⚠ package.json not found in source" -ForegroundColor Yellow
}

Write-Host ""

# Handle tsconfig.json (backup and show instructions)
Write-Host "⚙️ Handling tsconfig.json..." -ForegroundColor Cyan

$sourceTsconfig = Join-Path $sourceDir "tsconfig"
$destTsconfig = Join-Path $projectDir "tsconfig.json"

if (Test-Path $sourceTsconfig) {
    # Create backup
    $backupTsconfig = Join-Path $projectDir "tsconfig.json.backup"
    if (Test-Path $destTsconfig) {
        Copy-Item -Path $destTsconfig -Destination $backupTsconfig -Force
        Write-Host "  ✓ Backed up existing tsconfig.json to tsconfig.json.backup" -ForegroundColor Green
    }
    
    # Copy as reference
    $referenceTsconfig = Join-Path $projectDir "tsconfig-test-reference.json"
    Copy-Item -Path $sourceTsconfig -Destination $referenceTsconfig -Force
    Write-Host "  ✓ Saved test tsconfig.json as tsconfig-test-reference.json" -ForegroundColor Green
    Write-Host "  ℹ You may need to merge test types into tsconfig.json" -ForegroundColor Yellow
} else {
    Write-Host "  ⚠ tsconfig.json not found in source" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files copied to:" -ForegroundColor White
Write-Host "  • Root: vitest.config.ts, documentation files" -ForegroundColor Gray
Write-Host "  • tests\: setup.ts, test-utils.ts, pgx-integration.test.ts" -ForegroundColor Gray
Write-Host "  • tests\analyzers\: cyp2c9.test.ts, cyp2d6.test.ts, vkorc1.test.ts" -ForegroundColor Gray
Write-Host ""

# Next steps
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Merge package.json test scripts:" -ForegroundColor Yellow
Write-Host "   • Open: package-test-scripts.json" -ForegroundColor Gray
Write-Host "   • Copy the 'scripts' section to your package.json" -ForegroundColor Gray
Write-Host "   • Add: test, test:ui, test:coverage, test:watch" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Install dependencies:" -ForegroundColor Yellow
Write-Host "   npm install --save-dev vitest@^1.0.4 @vitest/coverage-v8@^1.0.4 @vitest/ui@^1.0.4" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Verify tsconfig.json:" -ForegroundColor Yellow
Write-Host "   • Check tsconfig-test-reference.json" -ForegroundColor Gray
Write-Host "   • Add 'vitest/globals' and 'node' to types array if needed" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Run your first test:" -ForegroundColor Yellow
Write-Host "   npm test" -ForegroundColor Gray
Write-Host ""

Write-Host "5. Read the documentation:" -ForegroundColor Yellow
Write-Host "   • QUICKSTART.md - for immediate next steps" -ForegroundColor Gray
Write-Host "   • README-TESTING.md - for comprehensive guide" -ForegroundColor Gray
Write-Host "   • CHECKLIST.md - to track your progress" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Ready to build medical-grade software!" -ForegroundColor Green
Write-Host ""

# Pause so user can read output
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
