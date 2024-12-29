# API Integration Points

## Overview
Document outlining the specific API endpoints and routes that need to be modified to integrate our simplified physics model.

## Weather Screen Integration

### Current Weather Data Flow:
1. Environmental Service provides simulated data:
```typescript
// lib/environmental-service.ts
getCurrentConditions(): EnvironmentalConditions {
    temperature: 70,    // °F
    humidity: 60,      // %
    altitude: 100,     // feet
    windSpeed: 5,      // mph
    windDirection: 45,  // degrees
    pressure: 1013.25, // hPa
    density: 1.225     // kg/m³
}
```

### Integration Point:
- Keep environmental service for weather simulation
- Use data directly in our simplified model
- No API changes needed for weather display

## Shot Calculator Integration

### API Route:
```typescript
// app/api/shot-calculator/calculate/route.ts
// Replace internal calculations with our simplified model

import { SimplifiedShotModel } from '@/core/simplified-shot-model';

const model = new SimplifiedShotModel();

export async function POST(req: Request) {
    const { distance, conditions } = await req.json();
    
    const result = model.calculateAdjustedDistance(
        distance,
        conditions,
        defaultBallProperties
    );

    return Response.json(result);
}
```

## Wind Calculator Integration

### API Route:
```typescript
// app/api/wind-calculator/calculate/route.ts
// Use our wind effect calculations

export async function POST(req: Request) {
    const { windSpeed, windDirection, shotDirection } = await req.json();
    
    const windEffect = model.calculateWindEffect(
        windSpeed,
        windDirection,
        shotDirection
    );

    return Response.json(windEffect);
}
```

## Dashboard Integration

### Data Sources:
1. Environmental Conditions:
   - Use existing environmental service
   - Display real-time updates

2. Shot Calculations:
   - Use our simplified model
   - Update with environmental changes

3. Wind Effects:
   - Use our wind calculations
   - Show real-time adjustments

### No Additional API Routes Needed:
- Dashboard uses existing data streams
- Updates through subscription system
- Displays calculated results

## Implementation Steps

1. Replace Calculation Logic:
```typescript
// Replace in environmental-calculations.ts
export class EnvironmentalCalculator {
    static calculateAirDensity = simplifiedModel.calculateAirDensity;
    static calculateWindEffect = simplifiedModel.calculateWindEffect;
    static calculateShotAdjustments = simplifiedModel.calculateAdjustedDistance;
}
```

2. Keep Data Flow:
```typescript
// Keep existing service pattern
environmentalService.subscribe((conditions) => {
    // Data flows to UI components
    // Our model handles calculations
});
```

3. Maintain API Structure:
- Keep all route paths
- Keep request/response formats
- Replace internal calculations

## Testing Routes

1. Shot Calculator:
```bash
curl -X POST http://localhost:3000/api/shot-calculator/calculate \
  -H "Content-Type: application/json" \
  -d '{"distance":150,"conditions":{"temperature":70,"pressure":29.92}}'
```

2. Wind Calculator:
```bash
curl -X POST http://localhost:3000/api/wind-calculator/calculate \
  -H "Content-Type: application/json" \
  -d '{"windSpeed":10,"windDirection":45,"shotDirection":0}'
```

## Verification Points

1. Weather Screen:
- Temperature display
- Humidity display
- Pressure display
- Wind display

2. Shot Calculator:
- Distance adjustments
- Club recommendations
- Environmental effects

3. Wind Calculator:
- Direction indicator
- Speed effects
- Total adjustments

4. Dashboard:
- Real-time updates
- Combined effects
- Data accuracy

This integration maintains all existing API endpoints and routes while replacing the underlying calculations with our simplified model.