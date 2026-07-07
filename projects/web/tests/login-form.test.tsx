import { render, screen } from '@testing-library/react';
import { LoginForm } from '@/components/auth/LoginForm';

jest.mock('@/lib/auth-actions', () => ({ login: jest.fn() }));

describe('LoginForm', () => {
  it('renders email and password fields and a submit button', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
