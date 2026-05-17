import { Dimensions, PixelRatio, Platform } from 'react-native';

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Industry standard scaling caps to prevent text/spacing from blowing up
// too large on tablets and iPads, keeping the visual density elegant.
const MAX_WIDTH = 480; 
const MAX_HEIGHT = 860;

const getWindow = () => {
  if (typeof window === 'undefined') {
    return { width: BASE_WIDTH, height: BASE_HEIGHT };
  }
  
  const dim = Dimensions.get('window');
  
  if (Platform.OS === 'web') {
    // If the web app is running in desktop mode (> 1025px wide browser window),
    // we calculate the scaling factor based on the actual 420px width of the 
    // centered phone mockup frame, preventing oversized text clipping.
    if (dim.width > 1025) {
      return { width: 420, height: 860 };
    }
  }
  
  return dim;
};

const clampMax = (value, max) => Math.min(value, max);

export const scale = (size) => {
  const { width } = getWindow();
  const responsiveWidth = clampMax(width, MAX_WIDTH);
  return (responsiveWidth / BASE_WIDTH) * size;
};

export const verticalScale = (size) => {
  const { height } = getWindow();
  const responsiveHeight = clampMax(height, MAX_HEIGHT);
  return (responsiveHeight / BASE_HEIGHT) * size;
};

export const moderateScale = (size, factor = 0.5) => {
  const scaledSize = scale(size);
  return size + (scaledSize - size) * factor;
};

export const moderateVerticalScale = (size, factor = 0.5) => {
  const scaledSize = verticalScale(size);
  return size + (scaledSize - size) * factor;
};

export const roundToPixel = (size) => PixelRatio.roundToNearestPixel(size);
