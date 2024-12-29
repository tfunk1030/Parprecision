# Simplified Model Development Tracking

## Week 1: Basic Physics

### Monday: Distance Formula
1. Create basic function:
   ```typescript
   // In src/core/flight-model.ts
   function calculateDistance(
     velocity: number,  // Initial velocity in mph
     angle: number     // Launch angle in degrees
   ): number {
     // Your formula here
     return distance;  // In yards
   }
   ```

2. Test with these cases:
   - 100 mph at 45° → ~240 yards
   - 150 mph at 30° → ~275 yards
   - Record results in metrics

### Tuesday: Height and Time
1. Add height calculation:
   ```typescript
   function calculateMaxHeight(
     velocity: number,
     angle: number
   ): number {
     // Add formula
     return height;  // In feet
   }
   ```

2. Add flight time:
   ```typescript
   function calculateFlightTime(
     velocity: number,
     angle: number
   ): number {
     // Add formula
     return time;  // In seconds
   }
   ```

### Wednesday: Environment
1. Temperature effects:
   ```typescript
   interface Environment {
     temperature: number;  // °F
     humidity: number;     // %
     altitude: number;     // feet
   }

   function adjustForEnvironment(
     shot: Shot,
     env: Environment
   ): Shot {
     // Add adjustments
     return adjustedShot;
   }
   ```

2. Test these conditions:
   - Cold day (40°F)
   - Normal day (70°F)
   - Hot day (100°F)

### Thursday: Testing
1. Run all calculations
2. Compare with expected
3. Document formulas
4. Fix any issues

### Friday: Review
1. Check all formulas
2. Update documentation
3. Plan next week
4. Note any problems

## Week 2: Advanced Features

### Monday: Wind Effects
1. Create wind types:
   ```typescript
   interface Wind {
     speed: number;    // mph
     direction: number; // degrees
   }

   function adjustForWind(
     shot: Shot,
     wind: Wind
   ): Shot {
     // Add wind effects
     return adjustedShot;
   }
   ```

2. Test these winds:
   - 10 mph headwind
   - 10 mph tailwind
   - 10 mph crosswind

### Tuesday: API Layer
1. Create endpoints:
   ```typescript
   // Calculate shot
   POST /api/shot
   {
     velocity: number,
     angle: number,
     conditions: Environment
   }

   // Get wind effect
   POST /api/wind
   {
     shot: Shot,
     wind: Wind
   }
   ```

2. Test responses:
   - Check formats
   - Verify data
   - Handle errors

### Wednesday: Testing
1. Test calculations:
   - All formulas
   - All conditions
   - Edge cases

2. Test API:
   - All endpoints
   - Error handling
   - Performance

### Thursday: Documentation
1. Write API docs
2. Add examples
3. Note limitations
4. Plan UI needs

### Friday: Review
1. Run all tests
2. Fix issues
3. Update docs
4. Plan UI phase

## Week 3: UI Integration

### Monday: Setup
1. Clone UI:
   ```bash
   git clone https://github.com/tfunk1030/parprecisionUI
   cd parprecisionUI
   npm install
   ```

2. Test it runs:
   ```bash
   npm start
   ```

### Tuesday: First Feature
1. Connect weather:
   - Add temperature
   - Add humidity
   - Add pressure
   - Test updates

### Wednesday: Shot Calc
1. Add distance:
   - Connect formula
   - Show result
   - Test accuracy

2. Add height:
   - Connect formula
   - Display result
   - Verify numbers

### Thursday: Wind Calc
1. Add wind:
   - Speed input
   - Direction input
   - Show effects

2. Test all:
   - Different conditions
   - Various shots
   - Check results

### Friday: Final Test
1. Test everything
2. Fix any issues
3. Document usage
4. Plan next steps

## Metrics to Track
```
| Feature          | Target | Current | Status |
|-----------------|--------|---------|---------|
| Distance Error  | < 5%   |         |         |
| Height Error    | < 5%   |         |         |
| Calc Time (ms)  | < 100  |         |         |
| API Time (ms)   | < 150  |         |         |
```

## Daily Checklist
- [ ] Run tests
- [ ] Update metrics
- [ ] Document changes
- [ ] Plan next day

## Remember
- One step at a time
- Test everything
- Keep it simple
- Document as you go