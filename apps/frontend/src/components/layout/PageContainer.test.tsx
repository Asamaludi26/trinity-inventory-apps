import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageContainer } from './PageContainer';

describe('PageContainer', () => {
  it('renders title', () => {
    render(<PageContainer title="Test Title">Content</PageContainer>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <PageContainer title="Title" description="Test Description">
        Content
      </PageContainer>,
    );
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<PageContainer title="Title">Content</PageContainer>);
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <PageContainer title="Title">
        <div data-testid="child">Child Content</div>
      </PageContainer>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    render(
      <PageContainer title="Title" actions={<button>Action</button>}>
        Content
      </PageContainer>,
    );
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('renders title as h1', () => {
    render(<PageContainer title="Title">Content</PageContainer>);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Title');
  });
});
