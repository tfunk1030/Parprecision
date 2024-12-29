# PowerShell script to run all lookup model tests

# Colors for output
$Green = [System.ConsoleColor]::Green
$Blue = [System.ConsoleColor]::Cyan
$Red = [System.ConsoleColor]::Red

Write-Host "Running Lookup Shot Model Tests" -ForegroundColor $Blue
Write-Host "================================="

function Run-Test {
    param (
        [string]$TestName,
        [string]$Command
    )
    
    Write-Host "`nRunning $TestName..." -ForegroundColor $Blue
    
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $TestName completed successfully" -ForegroundColor $Green
            return $true
        }
        else {
            Write-Host "✗ $TestName failed" -ForegroundColor $Red
            return $false
        }
    }
    catch {
        Write-Host "✗ $TestName failed: $_" -ForegroundColor $Red
        return $false
    }
}

try {
    # Basic tests
    Write-Host "`n1. Running Basic Tests" -ForegroundColor $Blue
    Write-Host "-------------------"
    $basicResult = Run-Test "Basic shot calculations" "npx ts-node test.ts"

    # Model comparison
    Write-Host "`n2. Running Model Comparison" -ForegroundColor $Blue
    Write-Host "-------------------------"
    $comparisonResult = Run-Test "Model comparison tests" "npx ts-node compare-models.ts"

    # Validation tests
    Write-Host "`n3. Running Validation Tests" -ForegroundColor $Blue
    Write-Host "-------------------------"
    $validationResult = Run-Test "Validation test suite" "npx jest lookup-model-validation.test.ts"

    # Summary
    Write-Host "`nTest Summary" -ForegroundColor $Blue
    Write-Host "============"
    if ($basicResult) { Write-Host "✓ Basic shot calculations" -ForegroundColor $Green } else { Write-Host "✗ Basic shot calculations" -ForegroundColor $Red }
    if ($comparisonResult) { Write-Host "✓ Model comparison" -ForegroundColor $Green } else { Write-Host "✗ Model comparison" -ForegroundColor $Red }
    if ($validationResult) { Write-Host "✓ Validation tests" -ForegroundColor $Green } else { Write-Host "✗ Validation tests" -ForegroundColor $Red }

    Write-Host "`nNext Steps" -ForegroundColor $Blue
    Write-Host "==========="
    Write-Host "1. Check test output for accuracy within tolerances"
    Write-Host "2. Verify performance metrics meet requirements"
    Write-Host "3. Review trajectory data for realism"
    Write-Host "4. Examine environmental effects"

    # Instructions for interpreting results
    Write-Host "`nInterpreting Results" -ForegroundColor $Blue
    Write-Host "==================="
    Write-Host "1. Distance should be within 2% of advanced model"
    Write-Host "2. Calculations should complete in < 1ms"
    Write-Host "3. Memory usage should be < 50MB"
    Write-Host "4. Environmental effects should match expected ranges:"
    Write-Host "   - Altitude: ~2% per 1000ft"
    Write-Host "   - Temperature: ~1% per 10°F"
    Write-Host "   - Wind: ~1.5 yards per mph headwind"

    Write-Host "`nFor detailed test documentation, see TESTING.md"

    # Exit with overall status
    if ($basicResult -and $comparisonResult -and $validationResult) {
        exit 0
    }
    else {
        exit 1
    }
}
catch {
    Write-Host "Error running tests: $_" -ForegroundColor $Red
    exit 1
}