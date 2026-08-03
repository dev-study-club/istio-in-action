import type { ButtonHTMLAttributes } from 'react';

import { button } from './Button.css';

type ButtonVariant = keyof typeof button;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'fill', className = '', ...rest }: ButtonProps) {
  return <button type="button" className={`${button[variant]} ${className}`.trim()} {...rest} />;
}
