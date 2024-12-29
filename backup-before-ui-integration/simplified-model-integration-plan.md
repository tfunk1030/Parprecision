# Simplified Model Integration Plan

## Overview
Integration of simplified physics model into Perfect UI without modifying the UI components.

## Key Files

### 1. Environmental Service (lib/environmental-service.ts)
- Provides simulated weather data
- Updates conditions in real-time
- Uses subscription pattern for updates
- **Keep As Is**: Maintains UI data flow

### 2. Environmental Calculator (lib/environmental-calculations.ts)
- Target for simplified model integration
- **Replace Calculations While Keeping Interfaces**:
```typescript
interface EnvironmentalConditions {
  temperature: number;    // Fahrenheit
  humidity: number;      // percentage
  pressure: number;      // hPa
  altitude: number;      // feet
  windSpeed: number;     // mph
  windDirection: number; // degrees (0-360)
  density: number;       // kg/m³
}

interface ShotAdjustments {
  distanceAdjustment: number;  // percentage
  trajectoryShift: number;     // yards
  spinAdjustment: number;      // percentage
  launchAngleAdjustment: number; // degrees
}
```

## Methods to Replace

### 1. Air Density Calculation
```typescript
static calculateAirDensity(conditions: Partial<EnvironmentalConditions>): number
```
- Replace with our simplified model's density calculation
- Ensure output in kg/m³

### 2. Wind Effect Calculation
```typescript
static calculateWindEffect(
  windSpeed: number,
  windDirection: number,
  shotDirection: number
): { headwind: number; crosswind: number }
```
- Replace with our simplified model's wind calculations
- Maintain headwind/crosswind component output
- Units: mph

### 3. Shot Adjustments
```typescript
static calculateShotAdjustments(
  conditions: EnvironmentalConditions,
  shotDirection: number = 0
): ShotAdjustments
```
- Replace with our simplified model's adjustments
- Keep return structure:
  * distanceAdjustment (percentage)
  * trajectoryShift (yards)
  * spinAdjustment (percentage)
  * launchAngleAdjustment (degrees)

### 4. Altitude Effect
```typescript
static calculateAltitudeEffect(altitude: number): number
```
- Replace with our simplified model's altitude calculations
- Return percentage adjustment

## Integration Steps

1. Weather Screen:
- Uses environmental-service.ts for data
- No changes needed - keeps existing simulation

2. Shot Calculator Screen:
- Replace calculations in environmental-calculations.ts
- Keep all interfaces and return types
- Ensure unit compatibility

3. Wind Calculator Screen:
- Use our wind effect calculations
- Maintain existing UI interactions
- Keep circular control functionality

4. Dashboard Screen:
- Uses same environmental data
- No UI changes needed
- Updates automatically through subscription system

## Unit Compatibility

### Input Units:
- Temperature: Fahrenheit
- Pressure: hectoPascals (hPa)
- Altitude: feet
- Wind Speed: mph
- Wind Direction: degrees (0-360)
- Humidity: percentage

### Output Units:
- Air Density: kg/m³
- Distance Adjustments: percentage
- Trajectory Shifts: yards
- Wind Components: mph
- Angles: degrees

## Implementation Notes

1. Keep Existing:
- All UI components
- Data flow structure
- Update intervals
- Subscription system
- Interface definitions

2. Replace Only:
- Core calculation methods
- Physics model implementation
- Environmental adjustments
- Wind effect calculations

3. Maintain:
- Real-time updates
- Unit consistency
- Data structure compatibility
- Type safety

## Testing Strategy

1. Verify Calculations:
- Compare output units
- Check adjustment ranges
- Validate wind effects
- Test altitude impacts

2. Confirm UI Updates:
- Weather display accuracy
- Shot adjustments
- Wind calculations
- Real-time updates

3. Validate Integration:
- Data flow
- State management
- Event handling
- Performance impact

## Rollback Plan

1. Keep Original Files:
- Save environmental-calculations.ts
- Maintain interface definitions
- Document all changes

2. Version Control:
- Create integration branch
- Commit incrementally
- Enable quick rollback

3. Testing Environment:
- Verify in development
- Test all features
- Confirm UI behavior