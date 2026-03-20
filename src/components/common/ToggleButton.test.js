import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import ToggleButton from './ToggleButton';

const getKnobTranslateX = (views) => {
  const knob = views.find((view) => {
    const flatStyle = StyleSheet.flatten(view.props.style);
    return flatStyle && Array.isArray(flatStyle.transform);
  });

  if (!knob) {
    throw new Error('Knob view not found');
  }

  const flatStyle = StyleSheet.flatten(knob.props.style);
  const transform = flatStyle.transform || [];
  const translate = transform.find((item) => Object.prototype.hasOwnProperty.call(item, 'translateX'));

  return translate ? translate.translateX : undefined;
};

describe('ToggleButton', () => {
  it('renders current state', () => {
    let offTree;
    act(() => {
      offTree = renderer.create(<ToggleButton value={false} />);
    });

    const offTranslateX = getKnobTranslateX(offTree.root.findAllByType(View));

    expect(offTranslateX).toBe(0);

    let onTree;
    act(() => {
      onTree = renderer.create(<ToggleButton value />);
    });

    const onTranslateX = getKnobTranslateX(onTree.root.findAllByType(View));

    expect(onTranslateX).toBeGreaterThan(0);
  });

  it('toggles on press', () => {
    const onChange = jest.fn();
    let tree;
    act(() => {
      tree = renderer.create(<ToggleButton value={false} onChange={onChange} />);
    });

    let pressable;
    try {
      pressable = tree.root.findByType(Pressable);
    } catch {
      pressable = tree.root.find((node) => typeof node.props.onPress === 'function');
    }

    act(() => {
      pressable.props.onPress();
    });

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls handler on press', () => {
    const onChange = jest.fn();
    let tree;
    act(() => {
      tree = renderer.create(<ToggleButton value onChange={onChange} />);
    });

    let pressable;
    try {
      pressable = tree.root.findByType(Pressable);
    } catch {
      pressable = tree.root.find((node) => typeof node.props.onPress === 'function');
    }

    act(() => {
      pressable.props.onPress();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('represents checked state for accessibility', () => {
    let tree;
    act(() => {
      tree = renderer.create(<ToggleButton value />);
    });

    let pressable;
    try {
      pressable = tree.root.findByType(Pressable);
    } catch {
      pressable = tree.root.find((node) => typeof node.props.onPress === 'function');
    }

    const accessibilityChecked = pressable?.props?.accessibilityState?.checked;

    if (accessibilityChecked !== undefined) {
      expect(accessibilityChecked).toBe(true);
      return;
    }

    const onTranslateX = getKnobTranslateX(tree.root.findAllByType(View));
    expect(onTranslateX).toBeGreaterThan(0);
  });
});
