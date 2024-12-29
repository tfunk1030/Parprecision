# Testing the Lookup-Based Shot Model

## Quick Start (Windows)

Run all tests with the PowerShell script:
```powershell
cd src/core/lookup-model
./run-tests.ps1
```

Or run individual tests:
```powershell
# Basic tests
npx ts-node test.ts

# Model comparison
npx ts-node compare-models.ts

# Validation tests
npx jest lookup-model-validation.test.ts
```

## Available Test Scripts

1. Basic Tests (`test.ts`)
- Common shot scenarios
- Environmental variations
- Performance metrics
- Trajectory visualization

2. Model Comparison (`compare-models.ts`)
- Compare against simplified model
- Accuracy analysis
- Performance benchmarks
- Memory usage stats

3. Validation Tests (`__tests__/lookup-model-validation.test.ts`)
- Unit tests
- Integration tests
- Edge cases
- Error handling

## Test Cases

### 1. Driver Shots
```typescript
// Standard conditions
{
    clubSpeed: 110,        // mph
    launchAngle: 15,       // degrees
    spinRate: 2700,        // rpm
    temperature: 70,       // °F
    altitude: 0,           // feet
    windSpeed: 0          // mph
}

// High altitude
{
    clubSpeed: 110,
    launchAngle: 15,
    spinRate: 2700,
    temperature: 70,
    altitude: 5000,       // Denver-like conditions
    windSpeed: 0
}
```

### 2. Iron Shots
```typescript
// 7-Iron standard
{
    clubSpeed: 85,
    launchAngle: 20,
    spinRate: 6500,
    temperature: 70,
    altitude: 0,
    windSpeed: 0
}

// With wind
{
    clubSpeed: 85,
    launchAngle: 20,
    spinRate: 6500,
    temperature: 70,
    altitude: 0,
    windSpeed: 10,        // 10mph wind
    windDirection: 90     // Direct crosswind
}
```

## Understanding Results

### 1. Distance Results
- Total Distance: Carry + roll
- Expected ranges:
  * Driver: 230-300 yards
  * 7-Iron: 140-180 yards

### 2. Environmental Effects
- Density Effect: Air density impact
  * Negative = thinner air = longer shots
  * Positive = denser air = shorter shots
- Wind Effect: Measured in yards
  * Headwind: Negative values
  * Tailwind: Positive values
- Temperature Effect: Percentage change
  * Higher temp = longer shots
  * Lower temp = shorter shots

### 3. Performance Metrics
- Calculation Time: Should be < 1ms
- Memory Usage: Should be < 50MB
- Cache Performance:
  * Size: Number of cached results
  * Hit Rate: Percentage of cache hits

### 4. Trajectory Data
```typescript
// Sample trajectory point
{
    position: { x, y, z },   // yards
    velocity: { x, y, z },   // mph
    spinRate: number,        // rpm
    time: number            // seconds
}
```

## Validation Criteria

1. Accuracy
- Distance: Within 2% of advanced model
- Height: Within 5%
- Landing Angle: Within 3°
- Trajectory: Within 5% RMS error

2. Performance
- Calculation Time: < 1ms average
- Memory Usage: < 50MB
- Cache Hit Rate: > 80%

3. Environmental Effects
- Altitude: ~2% per 1000ft
- Temperature: ~1% per 10°F
- Wind: ~1.5 yards per mph headwind

## Common Issues

1. Cache Misses
- Cause: Parameters too far from pre-calculated values
- Solution: Add more data points in that region

2. Memory Usage
- Issue: Cache growing too large
- Solution: Adjust maxCacheSize in LookupShotModel

3. Accuracy Outliers
- Cause: Edge case parameters
- Solution: Add specific test data for those cases

## Adding New Tests

1. Add Test Case:
```typescript
const newTest = {
    name: 'Description',
    params: {
        clubSpeed: number,
        launchAngle: number,
        // ... other parameters
    }
};
```

2. Add Expected Results:
```typescript
const expectedResults = {
    distance: number,
    height: number,
    // ... other expectations
};
```

3. Add Validation:
```typescript
expect(Math.abs(result.distance - expectedResults.distance))
    .toBeLessThan(expectedResults.distance * 0.02); // 2% tolerance
```

## Test Coverage

Current test coverage includes:
- ✓ All club types
- ✓ Common environmental conditions
- ✓ Edge cases
- ✓ Error conditions
- ✓ Performance scenarios

## Future Test Improvements

1. Automated Testing
- CI/CD integration
- Regression tests
- Performance monitoring

2. Data Validation
- Input range validation
- Output sanity checks
- Edge case handling

3. Mobile Testing
- Memory constraints
- Battery impact
- Offline operation

## Troubleshooting

1. Test Script Issues
- Make sure Node.js and npm are installed
- Run `npm install` to install dependencies
- Use `npx` to run TypeScript files directly

2. Jest Issues
- Run `npm install jest @types/jest ts-jest` if missing
- Check jest.config.js configuration
- Use `--verbose` flag for more details

3. Performance Issues
- Run tests on a clean system
- Monitor memory usage
- Check for background processes

4. Accuracy Issues
- Compare with test data
- Check environmental calculations
- Verify interpolation weights