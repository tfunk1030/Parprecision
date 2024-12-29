import { EnvironmentalSystem } from '../core/environmental-system';
import { Environment, BallProperties } from '../core/types';
import express from 'express';

const router = express.Router();
const environmentalSystem = new EnvironmentalSystem();

router.get('/environment', (req, res) => {
    // Create standard environment for testing
    const conditions: Environment = {
        temperature: 75.5,    // °F
        pressure: 29.92,      // inHg
        humidity: 80,         // %
        altitude: 221,        // feet
        wind: {               // m/s
            x: 0,
            y: 0,
            z: 0
        }
    };

    // Standard golf ball properties
    const ballProps: BallProperties = {
        mass: 45.93,             // Standard golf ball mass (grams)
        radius: 0.021335,        // Standard golf ball radius (meters)
        area: Math.PI * 0.021335 * 0.021335, // Cross-sectional area
        dragCoefficient: 0.24,   // Typical golf ball drag coefficient
        liftCoefficient: 0.15,   // Typical golf ball lift coefficient
        magnusCoefficient: 0.1,  // Typical golf ball magnus coefficient
        spinDecayRate: 0.98,     // Spin decay per second
        construction: '3-piece'   // Standard ball construction
    };

    // Get environmental effects
    const data = environmentalSystem.processEnvironment(conditions, ballProps);

    res.json({
        temperature: conditions.temperature,
        humidity: conditions.humidity,
        pressure: conditions.pressure * 33.86, // Convert inHg to hPa
        altitude: conditions.altitude,
        windSpeed: 0, // Added to match UI expectations
        windDirection: 0, // Added to match UI expectations
        density: data.airDensity
    });
});

export default router;