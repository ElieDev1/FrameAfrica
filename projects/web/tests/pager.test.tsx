import { render, screen } from '@testing-library/react';
import { Pager } from '@/components/Pager';

describe('Pager', () => {
  it('renders nothing on a single-page hub', () => {
    const { container } = render(<Pager locale="en" basePath="/videos" page={1} hasMore={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('offers next but not previous on page one', () => {
    render(<Pager locale="en" basePath="/videos" page={1} hasMore />);

    expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute('href', '/videos?page=2');
    expect(screen.queryByRole('link', { name: /previous/i })).not.toBeInTheDocument();
  });

  it('offers previous but not next on the last page', () => {
    render(<Pager locale="en" basePath="/galleries" page={3} hasMore={false} />);

    expect(screen.getByRole('link', { name: /previous/i })).toHaveAttribute(
      'href',
      '/galleries?page=2',
    );
    expect(screen.queryByRole('link', { name: /next/i })).not.toBeInTheDocument();
    expect(screen.getByText(/page 3/i)).toBeInTheDocument();
  });
});
