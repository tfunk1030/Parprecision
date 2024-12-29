import express from 'express';
import { WindEffectsEngine } from '../core/wind-effects';
import { Vector3D } from '../core/types';

const router = express.Router();
const windEngine = new WindEffectsEngine();

interface WindCalculationRequest {
    windSpeed: number;      // mph
    windDirection: number;  // degrees
    targetYardage: number;
    shotDirection?: number; // degrees, optional
}

router.post('/calculate', (req, res) => {
    const { windSpeed, windDirection, targetYardage, shotDirection = 0 } = req.body as WindCalculationRequest;

    // Convert wind speed from mph to m/s
    const windSpeedMS = windSpeed * 0.44704;

    // Convert wind direction to radians and calculate components
    const windRadians = (windDirection * Math.PI) / 180;
    const wind: Vector3D = {
        x: windSpeedMS * Math.cos(windRadians),
        y: 0, // Vertical component
        z: windSpeedMS * Math.sin(windRadians)
    };

    // Initial ball velocity (simplified for calculation)
    const initialVelocity: Vector3D = {
        x: Math.cos((shotDirection * Math.PI) / 180) * 50, // Approximate initial velocity
        y: 0,
        z: Math.sin((shotDirection * Math.PI) / 180) * 50
    };

    // Calculate crosswind effect
    const crosswindEffect = windEngine.calculateCrosswindEffect(
        initialVelocity,
        wind,
        2500 // Average spin rate
    );

    // Calculate headwind/tailwind component
    const headwindComponent = windSpeedMS * Math.cos((windDirection - shotDirection) * Math.PI / 180);

    // Calculate adjustments
    const crosswindAdjustment = crosswindEffect * 0.9144; // Convert to yards
    const headwindAdjustment = headwindComponent * targetYardage * 0.02; // 2% per m/s

    res.json({
        adjustments: {
            total: Math.round(headwindAdjustment + crosswindAdjustment),
            crosswind: Math.round(crosswindAdjustment),
            headwind: Math.round(headwindAdjustment)
        },
        effectiveWind: {
            speed: Math.round(windSpeed * 10) / 10,
            direction: Math.round(windDirection),
            crosswindComponent: Math.round(crosswindEffect * 2.237), // Convert to mph
            headwindComponent: Math.round(headwindComponent * 2.237) // Convert to mph
        }
    });
});

export default router;