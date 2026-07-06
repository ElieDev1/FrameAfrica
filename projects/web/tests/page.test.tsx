import { render, screen } from '@testing-library/react';
import Home from '../app/page';

describe('Home', () => {
  it('renders the Frame Africa tagline', () => {
    render(<Home />);
    expect(screen.getByText('Frame Africa')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('NEWS.');
  });
});
