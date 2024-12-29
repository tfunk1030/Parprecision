import express, { RequestHandler } from 'express';
import { EnvironmentalSystem } from '../core/environmental-system';
import { Environment, BallProperties } from '../core/types';
import { SimplifiedShotModel } from '../core/simplified-shot-model';

const router = express.Router();
const environmentalSystem = new EnvironmentalSystem();
const shotModel = new SimplifiedShotModel();

// Standard ball properties based on our physics model research
const defaultBallProps: BallProperties = {
    mass: 45.93,             // Standard golf ball mass (grams)
    radius: 0.021335,        // Standard golf ball radius (meters)
    area: Math.PI * 0.021335 * 0.021335, // Cross-sectional area
    dragCoefficient: 0.24,   // From wind tunnel tests
    liftCoefficient: 0.15,   // From aerodynamics research
    magnusCoefficient: 0.1,  // From spin effect studies
    spinDecayRate: 0.98,     // From empirical data
    construction: '3-piece'  // Standard ball construction
};

const calculateShot: RequestHandler = async (req, res): Promise<void> => {
    try {
        const {
            targetDistance = 150,
            ballType = '3-piece',
            windSpeed = 0,
            windDirection = 0
        } = req.body;

        // Validate ball type
        const validBallTypes = ['2-piece', '3-piece', '4-piece', '5-piece'] as const;
        if (!validBallTypes.includes(ballType)) {
            res.status(400).json({
                error: 'Invalid ball type. Must be one of: ' + validBallTypes.join(', ')
            });
            return;
        }

        // Get current environmental conditions
        const conditions: Environment = {
            temperature: 75.5,    // °F
            pressure: 29.92,      // inHg
            humidity: 80,         // %
            altitude: 221,        // feet
            wind: {               // m/s
                x: windSpeed * Math.cos(windDirection * Math.PI / 180),
                y: 0,
                z: windSpeed * Math.sin(windDirection * Math.PI / 180)
            }
        };

        // Customize ball properties based on type
        const ballProps: BallProperties = {
            ...defaultBallProps,
            construction: ballType
        };

        // Calculate shot adjustments using our physics-based model
        const shotCalculation = shotModel.calculateAdjustedDistance(
            targetDistance,
            conditions,
            ballProps
        );

        // Get club recommendations based on adjusted distance
        const clubRecommendations = shotModel.getClubRecommendations(
            shotCalculation.adjustedDistance
        );

        // Calculate any wind effects
        const windEffect = shotModel.calculateWindEffect(
            Math.sqrt(conditions.wind.x * conditions.wind.x + conditions.wind.z * conditions.wind.z),
            Math.atan2(conditions.wind.z, conditions.wind.x) * 180 / Math.PI
        );

        res.json({
            targetDistance,
            adjustedDistance: shotCalculation.adjustedDistance,
            environmentalAdjustment: {
                ...shotCalculation.environmentalEffects,
                wind: windEffect.totalEffect
            },
            clubRecommendations,
            conditions: {
                temperature: conditions.temperature,
                humidity: conditions.humidity,
                pressure: conditions.pressure * 33.86, // Convert to hPa
                altitude: conditions.altitude,
                wind: {
                    speed: Math.round(Math.sqrt(conditions.wind.x * conditions.wind.x + conditions.wind.z * conditions.wind.z) * 2.237), // Convert to mph
                    direction: Math.round(Math.atan2(conditions.wind.z, conditions.wind.x) * 180 / Math.PI),
                    headwind: windEffect.headwind,
                    crosswind: windEffect.crosswind
                }
            }
        });
    } catch (error) {
        console.error('Shot calculation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

router.post('/calculate', calculateShot);

export default router;