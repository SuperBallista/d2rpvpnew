// Utility functions for rounding operations
const roundFloatToInt = (value) => {
    return Math.floor(value);
  };
  
  const roundFloatToTwoDecimals = (value) => {
    return Math.floor(value * 100) / 100;
  };
  
  module.exports = {
    roundFloatToInt,
    roundFloatToTwoDecimals
  };
  