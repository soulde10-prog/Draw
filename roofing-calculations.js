// roofing-calculations.js

// Function to calculate roof pitch
function calculatePitch(rise, run) {
    return Math.atan(rise / run) * (180 / Math.PI);
}

// Function to calculate area with pitch factors
function calculateArea(length, width, pitch) {
    const pitchFactor = Math.cos(pitch * (Math.PI / 180));
    return length * width / pitchFactor;
}

// Function to calculate water flow in valleys
function calculateValleyFlow(roofArea, slope) {
    const flowCoefficient = 0.4; // example coefficient
    return roofArea * flowCoefficient * slope;
}

// Function to size undertile timber
function sizeUndertileTimber(sheetSize) {
    const timberDimensions = { 
        "38x38": { length: 2.4, width: 0.038, height: 0.038 },
    };
    return timberDimensions[sheetSize];
}

// Example Usage:
const pitch = calculatePitch(12, 24);
const area = calculateArea(10, 20, pitch);
const flow = calculateValleyFlow(area, 1);
const timber = sizeUndertileTimber("38x38");