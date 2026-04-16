import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { FormInput } from './FormInput';

function TestFormInput(props: { disabled?: boolean; type?: string }) {
  const form = useForm<{ name: string }>({ defaultValues: { name: '' } });
  return <FormInput form={form} name="name" label="Name" placeholder="Enter name" {...props} />;
}

describe('FormInput', () => {
  it('renders label', () => {
    render(<TestFormInput />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders input with placeholder', () => {
    render(<TestFormInput />);
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('renders input with text type by default', () => {
    render(<TestFormInput />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
  });

  it('renders disabled input', () => {
    render(<TestFormInput disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders with label for attribute matching input id', () => {
    render(<TestFormInput />);
    const label = screen.getByText('Name');
    expect(label).toHaveAttribute('for', 'name');
  });
});
