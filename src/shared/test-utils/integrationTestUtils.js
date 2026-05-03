jest.mock(
  '@expo/vector-icons',
  () => {
    const React = require('react');
    const { Text } = require('react-native');

    return {
      Ionicons: ({ name, ...props }) => React.createElement(Text, props, name),
    };
  },
  { virtual: true }
);

jest.mock(
  '@react-native-community/datetimepicker',
  () => {
    const React = require('react');
    const { Text } = require('react-native');

    return ({ mode = 'date', onChange }) =>
      React.createElement(
        Text,
        {
          accessibilityLabel: `${mode} picker`,
          onChange,
        },
        `${mode} picker`
      );
  },
  { virtual: true }
);

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
}

if (!global.cancelAnimationFrame) {
  global.cancelAnimationFrame = (frameId) => clearTimeout(frameId);
}

export function createNavigation(overrides = {}) {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: true,
    currentParams: {},
    ...overrides,
  };
}

export function getLastByPlaceholderText(screen, placeholder) {
  const matches = screen.getAllByPlaceholderText(placeholder);
  return matches[matches.length - 1];
}
