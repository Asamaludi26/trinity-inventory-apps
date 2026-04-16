import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card', () => {
  it('renders card with content', () => {
    render(
      <Card>
        <CardContent>Card content</CardContent>
      </Card>,
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders card with header and title', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('renders card with description', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description text</CardDescription>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('renders card with footer', () => {
    render(
      <Card>
        <CardContent>Body</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>,
    );
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('applies custom className to card', () => {
    const { container } = render(<Card className="custom-card">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-card');
  });

  it('renders with sm size variant', () => {
    const { container } = render(<Card size="sm">Content</Card>);
    expect(container.firstChild).toHaveAttribute('data-size', 'sm');
  });

  it('renders full card composition', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Full Card</CardTitle>
          <CardDescription>Full description</CardDescription>
        </CardHeader>
        <CardContent>Card body</CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>,
    );
    expect(screen.getByText('Full Card')).toBeInTheDocument();
    expect(screen.getByText('Full description')).toBeInTheDocument();
    expect(screen.getByText('Card body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
