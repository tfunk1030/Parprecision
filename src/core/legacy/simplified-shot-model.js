"use strict";
/**
 * @deprecated This is the legacy shot model. Please use the new Hybrid Model from '@/app/lib/simplified-model/simplified-shot-model'.
 * This model will be removed in the next major version.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimplifiedShotModel = void 0;
var types_1 = require("../types");
/**
 * @deprecated Use the new Hybrid Model instead.
 */
var SimplifiedShotModel = /** @class */ (function () {
    function SimplifiedShotModel() {
    }
    /**
     * @deprecated This implementation uses oversimplified calculations.
     * Use the new Hybrid Model for more accurate results.
     */
    SimplifiedShotModel.prototype.calculateAdjustedDistance = function (targetDistance, environment, ballProperties) {
        console.warn('Using deprecated SimplifiedShotModel. Please migrate to the new Hybrid Model.');
        // Get ratios from lookup tables
        var tempRatio = this.getTemperatureRatio(environment.temperature);
        var altRatio = this.getAltitudeRatio(environment.altitude);
        // Calculate effects (ratio < 1 = thinner air = shorter distance)
        // Temperature effect: 90°F = 0.96 ratio = -4% effect
        var tempEffect = -((1 - tempRatio) * 100);
        // Altitude effect: 5000ft = 0.862 ratio = -13.8% effect
        var altitudeEffect = -((1 - altRatio) * 100);
        // Density effect is already captured in temperature and altitude
        var densityEffect = 0;
        // Total environmental effect (combine all effects)
        var totalEffect = (densityEffect + tempEffect + altitudeEffect) / 100;
        // Calculate adjusted distance
        var adjustedDistance = Math.round(targetDistance * (1 + totalEffect));
        return {
            adjustedDistance: adjustedDistance,
            environmentalEffects: {
                density: Math.round(densityEffect),
                temperature: Math.round(tempEffect),
                altitude: Math.round(altitudeEffect),
                total: Math.round(totalEffect * 100)
            }
        };
    };
    SimplifiedShotModel.prototype.getTemperatureRatio = function (temp) {
        var tempEffects = [
            { temp: 40, ratio: 1.06 },
            { temp: 50, ratio: 1.04 },
            { temp: 60, ratio: 1.02 },
            { temp: 70, ratio: 1.00 },
            { temp: 80, ratio: 0.98 },
            { temp: 90, ratio: 0.96 },
            { temp: 100, ratio: 0.94 }
        ];
        return this.findClosestRatio(tempEffects, temp, 'temp');
    };
    SimplifiedShotModel.prototype.getAltitudeRatio = function (alt) {
        var altEffects = [
            { alt: 0, ratio: 1.000 },
            { alt: 1000, ratio: 0.971 },
            { alt: 2000, ratio: 0.942 },
            { alt: 3000, ratio: 0.915 },
            { alt: 4000, ratio: 0.888 },
            { alt: 5000, ratio: 0.862 },
            { alt: 6000, ratio: 0.837 }
        ];
        return this.findClosestRatio(altEffects, alt, 'alt');
    };
    SimplifiedShotModel.prototype.findClosestRatio = function (effects, value, key) {
        var sorted = effects.sort(function (a, b) {
            return Math.abs(a[key] - value) - Math.abs(b[key] - value);
        });
        return sorted[0].ratio;
    };
    /**
     * @deprecated Use the new Hybrid Model's wind calculations for more accurate results.
     */
    SimplifiedShotModel.prototype.calculateWindEffect = function (windSpeed, windDirection, shotDirection) {
        if (shotDirection === void 0) { shotDirection = 0; }
        console.warn('Using deprecated wind calculations. Please migrate to the new Hybrid Model.');
        // Convert to radians
        var angleRad = ((windDirection - shotDirection) * Math.PI) / 180;
        // Calculate components (from our aerodynamics model)
        var headwind = windSpeed * Math.cos(angleRad);
        var crosswind = windSpeed * Math.sin(angleRad);
        // Calculate total effect (simplified from our physics model)
        // Headwind: ~1.5 yards per mph
        // Crosswind: ~1 yard per mph
        var headwindEffect = headwind * 1.5;
        var crosswindEffect = Math.abs(crosswind);
        return {
            headwind: Math.round(headwind * 10) / 10,
            crosswind: Math.round(crosswind * 10) / 10,
            totalEffect: Math.round(headwindEffect + crosswindEffect)
        };
    };
    /**
     * @deprecated Use the new Hybrid Model for more accurate adjustments.
     */
    SimplifiedShotModel.prototype.calculateShotAdjustments = function (targetDistance, environment, ballProperties, shotDirection) {
        if (shotDirection === void 0) { shotDirection = 0; }
        console.warn('Using deprecated shot adjustments. Please migrate to the new Hybrid Model.');
        // Get base distance adjustments
        var distanceResult = this.calculateAdjustedDistance(targetDistance, environment, ballProperties);
        // Calculate wind effects
        var windEffect = this.calculateWindEffect(environment.windSpeed, environment.windDirection, shotDirection);
        // Calculate spin adjustment based on air density
        var densityRatio = environment.density / types_1.STANDARD_CONDITIONS.DENSITY;
        var spinAdjustment = (densityRatio - 1) * -50; // Less spin in thinner air
        // Calculate launch angle adjustment for wind
        var launchAngleAdjustment = windEffect.headwind * 0.1; // Slight adjustment for wind
        return {
            distanceAdjustment: distanceResult.environmentalEffects.total,
            trajectoryShift: windEffect.totalEffect,
            spinAdjustment: Math.round(spinAdjustment),
            launchAngleAdjustment: Math.round(launchAngleAdjustment * 10) / 10
        };
    };
    /**
     * @deprecated Use the new Hybrid Model's club recommendations.
     */
    SimplifiedShotModel.prototype.getClubRecommendations = function (adjustedDistance) {
        console.warn('Using deprecated club recommendations. Please migrate to the new Hybrid Model.');
        // Club distances based on typical player averages
        if (adjustedDistance <= 100)
            return { primary: 'PW', secondary: '9i' };
        if (adjustedDistance <= 120)
            return { primary: '9i', secondary: '8i' };
        if (adjustedDistance <= 130)
            return { primary: '8i', secondary: '7i' };
        if (adjustedDistance <= 140)
            return { primary: '7i', secondary: '6i' };
        if (adjustedDistance <= 150)
            return { primary: '6i', secondary: '5i' };
        if (adjustedDistance <= 160)
            return { primary: '5i', secondary: '4i' };
        if (adjustedDistance <= 170)
            return { primary: '4i', secondary: '3i' };
        if (adjustedDistance <= 180)
            return { primary: '3i', secondary: 'Hybrid' };
        if (adjustedDistance <= 200)
            return { primary: 'Hybrid', secondary: '3w' };
        if (adjustedDistance <= 230)
            return { primary: '3w', secondary: 'Driver' };
        return { primary: 'Driver' };
    };
    return SimplifiedShotModel;
}());
exports.SimplifiedShotModel = SimplifiedShotModel;
