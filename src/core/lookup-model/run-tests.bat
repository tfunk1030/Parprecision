@echo off
echo Running Lookup Shot Model Tests
echo =================================

echo.
echo 1. Running Basic Tests
echo -------------------
call npx ts-node test.ts
if errorlevel 1 (
    echo [31m✗ Basic tests failed[0m
) else (
    echo [32m✓ Basic tests passed[0m
)

echo.
echo 2. Running Model Comparison
echo -------------------------
call npx ts-node compare-models.ts
if errorlevel 1 (
    echo [31m✗ Model comparison failed[0m
) else (
    echo [32m✓ Model comparison passed[0m
)

echo.
echo 3. Running Validation Tests
echo -------------------------
call npx jest lookup-model-validation.test.ts
if errorlevel 1 (
    echo [31m✗ Validation tests failed[0m
) else (
    echo [32m✓ Validation tests passed[0m
)

echo.
echo Test Summary
echo ============
echo Check test output for:
echo 1. Distance accuracy within 2% of advanced model
echo 2. Sub-millisecond calculation times
echo 3. Memory usage under 50MB
echo 4. Environmental effects matching expected ranges

echo.
echo For detailed test documentation, see TESTING.md