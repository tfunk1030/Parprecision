/**
 * Handles unit conversions between our model and UI expectations
 */
export class UnitConverter {
    // Pressure conversions
    static inHgToHpa(inHg: number): number {
        return inHg * 33.8639;
    }

    static hpaToInHg(hPa: number): number {
        return hPa / 33.8639;
    }

    // Temperature conversions (already in Fahrenheit, but included for completeness)
    static fahrenheitToCelsius(f: number): number {
        return (f - 32) * 5/9;
    }

    static celsiusToFahrenheit(c: number): number {
        return (c * 9/5) + 32;
    }

    // Altitude conversions (already in feet, but included for completeness)
    static feetToMeters(feet: number): number {
        return feet * 0.3048;
    }

    static metersToFeet(meters: number): number {
        return meters / 0.3048;
    }

    // Wind speed conversions (already in mph, but included for completeness)
    static mphToMs(mph: number): number {
        return mph * 0.44704;
    }

    static msToMph(ms: number): number {
        return ms / 0.44704;
    }

    // Density conversions (already in kg/m³, but included for completeness)
    static kgm3ToLbft3(kgm3: number): number {
        return kgm3 * 0.062428;
    }

    static lbft3ToKgm3(lbft3: number): number {
        return lbft3 / 0.062428;
    }
}