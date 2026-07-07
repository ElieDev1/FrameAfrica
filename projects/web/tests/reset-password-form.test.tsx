import { render, screen } from '@testing-library/react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

jest.mock('@/lib/account-actions', () => ({
  requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
}));

describe('password reset forms', () => {
  it('ForgotPasswordForm renders an email field and a submit button', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('ResetPasswordForm carries the token in a hidden field and asks for a new password', () => {
    const { container } = render(<ResetPasswordForm token="tok-123" />);
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    const hidden = container.querySelector('input[name="token"]') as HTMLInputElement;
    expect(hidden).not.toBeNull();
    expect(hidden.value).toBe('tok-123');
  });
});
