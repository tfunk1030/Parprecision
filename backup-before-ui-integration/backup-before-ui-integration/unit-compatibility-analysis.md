# Unit Compatibility Analysis

## Current Model Units

### SimplifiedShotModel Input:
```typescript
environment: {
    temperature: number;  // Fahrenheit
    pressure: number;    // inHg
    altitude: number;    // feet
    // ... other properties
}
```

### SimplifiedShotModel Output:
```typescript
{
    adjustedDistance: number;          // yards
    environmentalEffects: {
        density: number;               // percentage
        temperature: number;           // percentage
        altitude: number;              // percentage
        total: number;                 // percentage
    }
}
```

### Wind Calculations:
```typescript
{
    headwind: number;    // mph
    crosswind: number;   // mph
    totalEffect: number; // yards
}
```

## UI Expected Units

### Environmental Data:
```typescript
interface EnvironmentalConditions {
    temperature: number;    // Fahrenheit (MATCHES)
    pressure: number;      // hPa (NEEDS CONVERSION)
    altitude: number;      // feet (MATCHES)
    windSpeed: number;     // mph (MATCHES)
    windDirection: number; // degrees 0-360 (MATCHES)
    density: number;       // kg/m³ (MATCHES)
}
```

### Shot Adjustments:
```typescript
interface ShotAdjustments {
    distanceAdjustment: number;     // percentage (MATCHES)
    trajectoryShift: number;        // yards (MATCHES)
    spinAdjustment: number;         // percentage (NEEDS IMPLEMENTATION)
    launchAngleAdjustment: number;  // degrees (NEEDS IMPLEMENTATION)
}
```

## Required Conversions

1. Pressure Conversion:
```typescript
// From inHg to hPa
function inHgToHpa(inHg: number): number {
    return inHg * 33.8639;
}

// From hPa to inHg
function hpaToInHg(hPa: number): number {
    return hPa / 33.8639;
}
```

2. Additional Calculations Needed:
```typescript
// Spin adjustment based on density
function calculateSpinAdjustment(density: number): number {
    const densityRatio = density / STANDARD_DENSITY;
    return (densityRatio - 1) * -50; // Less spin in thinner air
}

// Launch angle adjustment for wind
function calculateLaunchAngleAdjustment(headwind: number): number {
    return headwind * 0.1; // Slight adjustment for wind
}
```

## Integration Notes

1. Unit Matches:
- Temperature (°F)
- Altitude (feet)
- Wind Speed (mph)
- Wind Direction (degrees)
- Distance Effects (yards)
- Percentages

2. Required Changes:
- Add pressure conversion (inHg ↔ hPa)
- Implement spin adjustment calculation
- Implement launch angle adjustment
- Keep all existing output formats

3. No Changes Needed For:
- Temperature handling
- Altitude calculations
- Wind effect calculations
- Distance adjustments
- Basic environmental effects

## Implementation Strategy

1. Add Conversion Layer:
```typescript
class UnitConverter {
    static pressureToHpa(inHg: number): number {
        return inHg * 33.8639;
    }
    
    static pressureFromHpa(hPa: number): number {
        return hPa / 33.8639;
    }
}
```

2. Extend SimplifiedShotModel:
```typescript
interface ExtendedShotAdjustments {
    distanceAdjustment: number;
    trajectoryShift: number;
    spinAdjustment: number;
    launchAngleAdjustment: number;
}

// Add methods for new calculations while keeping existing ones
```

3. Maintain Existing Interfaces:
- Keep all UI data structures
- Add conversions internally
- Return data in expected formats

This analysis shows we can integrate our model with minimal changes, mostly just adding unit conversions and a few additional calculations to match the UI's expected data structure.