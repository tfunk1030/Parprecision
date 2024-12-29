# Simplified Shot Model Fix Plan

## Immediate Fixes (Critical Bugs)

1. **Altitude Calculation Fix**
   - Problem: Using linear scaling (5% per 1000ft) instead of exponential decay
   - Solution: Enable the existing exponential decay formula:
   ```typescript
   private getAltitudeRatio(alt: number): number {
       return Math.exp(-alt / 8500); // 8500ft scale height
   }
   ```
   - Expected Impact: More realistic altitude effects (~10-12% at 5000ft vs current 25%)

2. **Air Density Integration**
   - Problem: Standard density used regardless of conditions
   - Solution: Calculate actual air density based on:
   ```typescript
   const airDensity = standardDensity * (pressure / standardPressure) * (standardTemp / temp);
   ```
   - Add humidity correction factor
   - Expected Impact: More accurate distance calculations across all conditions

3. **Wind Effect Scaling**
   - Problem: Linear wind effects don't account for trajectory
   - Solution: Scale wind effects by:
   ```typescript
   const trajectoryFactor = Math.sin(launchAngle * Math.PI / 180);
   const heightAdjustedWind = windSpeed * (1 + trajectoryFactor);
   ```
   - Expected Impact: Wind effects that vary with shot height

## Secondary Improvements

1. **Ball Physics Enhancement**
   - Add temperature effect on ball compression
   - Include spin decay with altitude
   - Account for Magnus effect in crosswinds

2. **Club Selection Logic**
   - Add trajectory considerations for wind conditions
   - Include carry vs. roll calculations
   - Consider environmental effects on optimal club choice

## Implementation Steps

1. Phase 1 - Core Fixes (1-2 days)
   - Implement exponential altitude calculation
   - Add proper air density calculations
   - Update wind effect scaling

2. Phase 2 - Physics Improvements (2-3 days)
   - Add ball compression effects
   - Implement spin decay
   - Add Magnus effect calculations

3. Phase 3 - Club Selection (1-2 days)
   - Update club recommendation logic
   - Add environmental considerations
   - Implement trajectory-based selection

## Validation Plan

1. Test Cases:
   - Standard conditions (baseline)
   - High altitude (verify exponential effect)
   - Combined conditions (verify interactions)
   - Various wind scenarios (verify scaling)

2. Expected Results:
   - Altitude effect ~10-12% at 5000ft
   - Wind effects varying with trajectory
   - More accurate club selections

## Success Metrics

1. Altitude Effects:
   - Within 2% of empirical data at all tested altitudes
   - Proper exponential scaling verified

2. Wind Effects:
   - Trajectory-dependent scaling verified
   - Magnus effect properly modeled
   - Club recommendations match real-world adjustments

3. Overall Accuracy:
   - Combined effects within 5% of advanced model
   - Club selections match expert recommendations