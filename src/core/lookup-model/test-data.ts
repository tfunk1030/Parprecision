import { ShotResult } from './types';
import { CLUB_DATA, calculateEnvironmentalEffects } from './club-data';

/**
 * Generate base trajectory for a club
 */
function generateTrajectory(club: string, distance: number): ShotResult['trajectory'] {
    const clubInfo = CLUB_DATA[club];
    const maxHeight = distance * clubInfo.heightRatio;
    const points = [];
    
    // Generate 4 key points in trajectory
    for (let i = 0; i < 4; i++) {
        const t = i / 3; // 0, 0.33, 0.67, 1
        const x = distance * t;
        
        // Parabolic height calculation
        const y = maxHeight * 4 * t * (1 - t);
        
        // Decreasing velocity and spin over time
        const velocityFactor = 1 - (t * 0.2); // 20% velocity loss
        const spinFactor = 1 - (t * 0.1);     // 10% spin loss
        
        points.push({
            position: { x, y, z: 0 },
            velocity: {
                x: clubInfo.baseDistance * 0.5 * velocityFactor,
                y: clubInfo.launchAngle * (1 - t * 2), // Goes from positive to negative
                z: 0
            },
            spinRate: clubInfo.spinRate * spinFactor,
            time: t * clubInfo.baseDistance / 50 // Rough time estimate
        });
    }
    
    return points;
}

/**
 * Pre-generated test data with realistic values
 */
export const TEST_DATA = new Map<string, ShotResult>([
    // Driver at sea level
    ['{"club":"driver","altitude":0,"temperature":70,"windSpeed":0}', {
        distance: CLUB_DATA.driver.baseDistance,
        height: CLUB_DATA.driver.baseDistance * CLUB_DATA.driver.heightRatio,
        landingAngle: CLUB_DATA.driver.launchAngle * 1.2, // Steeper landing
        flightTime: CLUB_DATA.driver.baseDistance / 50,
        trajectory: generateTrajectory('driver', CLUB_DATA.driver.baseDistance),
        environmentalEffects: {
            densityEffect: 0,
            windEffect: 0,
            temperatureEffect: 0
        }
    }],

    // Driver at altitude (Denver)
    ['{"club":"driver","altitude":5000,"temperature":70,"windSpeed":0}', {
        distance: CLUB_DATA.driver.baseDistance * 1.062, // +6.2% at 5000ft
        height: CLUB_DATA.driver.baseDistance * CLUB_DATA.driver.heightRatio * 1.05,
        landingAngle: CLUB_DATA.driver.launchAngle * 1.2,
        flightTime: (CLUB_DATA.driver.baseDistance * 1.062) / 50,
        trajectory: generateTrajectory('driver', CLUB_DATA.driver.baseDistance * 1.062),
        environmentalEffects: calculateEnvironmentalEffects({
            altitude: 5000,
            temperature: 70,
            humidity: 0.5,
            pressure: 24.89,
            windSpeed: 0,
            windDirection: 0,
            shotDirection: 0
        })
    }],

    // 7-iron at sea level
    ['{"club":"7-iron","altitude":0,"temperature":70,"windSpeed":0}', {
        distance: CLUB_DATA['7-iron'].baseDistance,
        height: CLUB_DATA['7-iron'].baseDistance * CLUB_DATA['7-iron'].heightRatio,
        landingAngle: CLUB_DATA['7-iron'].launchAngle * 1.3,
        flightTime: CLUB_DATA['7-iron'].baseDistance / 40,
        trajectory: generateTrajectory('7-iron', CLUB_DATA['7-iron'].baseDistance),
        environmentalEffects: {
            densityEffect: 0,
            windEffect: 0,
            temperatureEffect: 0
        }
    }],

    // 7-iron with crosswind
    ['{"club":"7-iron","altitude":0,"temperature":70,"windSpeed":10,"windDirection":90}', {
        distance: CLUB_DATA['7-iron'].baseDistance,
        height: CLUB_DATA['7-iron'].baseDistance * CLUB_DATA['7-iron'].heightRatio,
        landingAngle: CLUB_DATA['7-iron'].launchAngle * 1.3,
        flightTime: CLUB_DATA['7-iron'].baseDistance / 40,
        trajectory: generateTrajectory('7-iron', CLUB_DATA['7-iron'].baseDistance).map(point => ({
            ...point,
            position: {
                ...point.position,
                z: point.position.x * 0.1 // 10% drift
            }
        })),
        environmentalEffects: calculateEnvironmentalEffects({
            altitude: 0,
            temperature: 70,
            humidity: 0.5,
            pressure: 29.92,
            windSpeed: 10,
            windDirection: 90,
            shotDirection: 0
        })
    }],

    // Driver in hot conditions
    ['{"club":"driver","altitude":0,"temperature":95,"windSpeed":0}', {
        distance: CLUB_DATA.driver.baseDistance * 1.025, // +2.5% in hot weather
        height: CLUB_DATA.driver.baseDistance * CLUB_DATA.driver.heightRatio * 1.02,
        landingAngle: CLUB_DATA.driver.launchAngle * 1.2,
        flightTime: (CLUB_DATA.driver.baseDistance * 1.025) / 50,
        trajectory: generateTrajectory('driver', CLUB_DATA.driver.baseDistance * 1.025),
        environmentalEffects: calculateEnvironmentalEffects({
            altitude: 0,
            temperature: 95,
            humidity: 0.7,
            pressure: 29.92,
            windSpeed: 0,
            windDirection: 0,
            shotDirection: 0
        })
    }]
]);