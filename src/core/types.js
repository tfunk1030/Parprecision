"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindUtils = exports.STANDARD_CONDITIONS = void 0;
exports.createStandardEnvironment = createStandardEnvironment;
// Standard conditions
exports.STANDARD_CONDITIONS = {
    TEMPERATURE: 70, // °F
    PRESSURE: 1013.25, // hPa
    ALTITUDE: 0, // feet
    HUMIDITY: 50, // %
    DENSITY: 1.225, // kg/m³
    WIND: { speed: 0, direction: 0 }
};
// Wind utilities
exports.WindUtils = {
    calculateWindComponents: function (wind) {
        return wind;
    },
    createWindVector: function (speed, direction) {
        var radians = direction * Math.PI / 180;
        return {
            x: speed * Math.cos(radians),
            y: 0,
            z: speed * Math.sin(radians)
        };
    }
};
// Helper function to create standard environment
function createStandardEnvironment() {
    return {
        temperature: exports.STANDARD_CONDITIONS.TEMPERATURE,
        pressure: exports.STANDARD_CONDITIONS.PRESSURE,
        altitude: exports.STANDARD_CONDITIONS.ALTITUDE,
        humidity: exports.STANDARD_CONDITIONS.HUMIDITY,
        wind: __assign({}, exports.STANDARD_CONDITIONS.WIND)
    };
}
