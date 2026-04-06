import React from 'react';
import { render } from '@testing-library/react-native';
import TextCard from '../TextCard';

describe('TextCard', () => {
  it('renders title, body, and footer', () => {
    const { getByText } = render(
      <TextCard title="Title" body="Body" footer="Footer" />
    );

    expect(getByText('Title')).toBeTruthy();
    expect(getByText('Body')).toBeTruthy();
    expect(getByText('Footer')).toBeTruthy();
  });
});
