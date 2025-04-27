// src/utils/unitConverter.js

const GRAMS_PER_KG = 1000;
const GRAMS_PER_LB = 453.592;
const GRAMS_PER_OZ = 28.3495;

const ML_PER_L = 1000;
const ML_PER_CUP = 236.588; // US Legal Cup
const ML_PER_FL_OZ = 29.5735; // US Fluid Ounce
const ML_PER_TBSP = 14.7868; // US Tablespoon
const ML_PER_TSP = 4.92892; // US Teaspoon
const ML_PER_GAL = 3785.41; // US Gallon
const ML_PER_PINT = 473.176; // US Pint
const ML_PER_QUART = 946.353; // US Quart
const ML_PER_C = 237; // US Cup (for liquids)

// --- UPDATED: Add common volume units for Solids ---
export const unitsByType = {
    solid: [
        { value: 'g', label: 'Grams (g)' },
        { value: 'kg', label: 'Kilograms (kg)' },
        { value: 'lb', label: 'Pounds (lb)' },
        { value: 'oz', label: 'Ounces (oz)' },
        { value: 'cup', label: 'Cups (cup)' },
        { value: 'tbsp', label: 'Tablespoons (tbsp)' },
        { value: 'tsp', label: 'Teaspoons (tsp)' },
    ],
    liquid: [
        { value: 'ml', label: 'Milliliters (ml)' },
        { value: 'l', label: 'Liters (l)' },
        { value: 'cup', label: 'Cups (cup)' },
        { value: 'fl oz', label: 'Fluid Ounces (fl oz)' },
        { value: 'tbsp', label: 'Tablespoons (tbsp)' },
        { value: 'tsp', label: 'Teaspoons (tsp)' },
        { value: 'gal', label: 'Gallons (gal)' },
        { value: 'pint', label: 'Pints (pint)' },
        { value: 'quart', label: 'Quarts (quart)' },
        { value: 'c', label: 'Cups (c)' }, // US Cup for liquids
    ],
};

// --- Helper to convert any volume unit to ML ---
const convertVolumeToMl = (amount, unit) => {
     switch (unit) {
        case 'ml': return amount;
        case 'l': return amount * ML_PER_L;
        case 'cup': return amount * ML_PER_CUP;
        case 'fl oz': return amount * ML_PER_FL_OZ;
        case 'tbsp': return amount * ML_PER_TBSP;
        case 'tsp': return amount * ML_PER_TSP;
        case 'gal': return amount * ML_PER_GAL;
        case 'pint': return amount * ML_PER_PINT;
        case 'quart': return amount * ML_PER_QUART;
        case 'c': return amount * ML_PER_C; // US Cup for liquids
        default: return null; // Invalid volume unit
     }
}

// --- UPDATED: convertToStandard accepts density ---
export const convertToStandard = (amount, unit, type, density = null) => {
    if (isNaN(amount) || amount <= 0) {
        return { error: "Invalid amount. Must be a positive number." };
    }

    let standardAmount = 0;
    let standardUnit = '';

    try {
        if (type === 'solid') {
            standardUnit = 'g';
            switch (unit) {
                // Weight units
                case 'g': standardAmount = amount; break;
                case 'kg': standardAmount = amount * GRAMS_PER_KG; break;
                case 'lb': standardAmount = amount * GRAMS_PER_LB; break;
                case 'oz': standardAmount = amount * GRAMS_PER_OZ; break;
                // Volume units (require density)
                case 'cup':
                case 'tbsp':
                case 'tsp':
                    if (density === null || isNaN(density) || density <= 0) {
                       return { error: `Density required to convert solid volume unit '${unit}' to grams. Ingredient density not found or invalid.` };
                    }
                    const amountInMl = convertVolumeToMl(amount, unit);
                    if (amountInMl === null) {
                        return { error: `Invalid unit '${unit}' for volume conversion.` };
                    }
                    standardAmount = amountInMl * density; // grams = ml * (g/ml)
                    break;
                default: return { error: `Unit "${unit}" is not valid for solids or requires density.` };
            }
        } else if (type === 'liquid') {
            standardUnit = 'ml';
             const amountInMl = convertVolumeToMl(amount, unit);
             if (amountInMl === null) {
                 return { error: `Unit "${unit}" is not valid for liquids.` };
             }
             standardAmount = amountInMl;
        } else {
            return { error: "Invalid ingredient type specified." };
        }

        // Round to a reasonable number of decimal places, e.g., 2
        standardAmount = Math.round(standardAmount * 100) / 100;

        if (standardAmount <= 0 && amount > 0) {
             return { error: "Calculated standard amount is zero or negative, check input/density." };
        }

        return { standardAmount, standardUnit };

    } catch (err) {
        console.error("Conversion error:", err);
        return { error: "An unexpected error occurred during conversion." };
    }
};

// --- NEW: Helper to find density (case-insensitive) ---
// In a real app, this might involve more complex matching or API calls
export const findDensity = (ingredientName, densityMap) => {
    if (!ingredientName || typeof ingredientName !== 'string') return null;

    const lowerCaseName = ingredientName.toLowerCase().trim();

    // Try exact match first
    if (densityMap[lowerCaseName]) {
        return densityMap[lowerCaseName];
    }

    // Simple check: see if any key is a substring of the name (e.g., "all-purpose flour" in densityMap matches "organic all-purpose flour")
    // WARNING: This is very basic and can lead to mismatches.
    // A more robust solution would involve better text processing or explicit mapping.
    for (const key in densityMap) {
        if (lowerCaseName.includes(key)) {
            console.warn(`Density lookup using partial match: "${key}" for "${ingredientName}". Accuracy may vary.`);
            return densityMap[key];
        }
    }

    return null; // No density found
};