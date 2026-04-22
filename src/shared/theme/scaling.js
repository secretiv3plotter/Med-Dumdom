import { Dimensions, PixelRatio } from 'react-native';

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const getWindow = () => Dimensions.get('window');

export const scale = (size) => {
  const { width } = getWindow();
  return (width / BASE_WIDTH) * size;
};

export const verticalScale = (size) => {
  const { height } = getWindow();
  return (height / BASE_HEIGHT) * size;
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
