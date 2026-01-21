/**
 * Client-side form validation utilities
 */

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

export type FieldValidation = {
  validate: (value: string) => ValidationResult;
};

// Basic validators
export const required = (fieldName: string): FieldValidation => ({
  validate: (value: string) => {
    if (!value || !value.trim()) {
      return { valid: false, error: `${fieldName} is required` };
    }
    return { valid: true };
  },
});

export const maxLength = (max: number, fieldName: string): FieldValidation => ({
  validate: (value: string) => {
    if (value && value.length > max) {
      return { valid: false, error: `${fieldName} must be ${max} characters or less` };
    }
    return { valid: true };
  },
});

export const minLength = (min: number, fieldName: string): FieldValidation => ({
  validate: (value: string) => {
    if (value && value.trim().length < min) {
      return { valid: false, error: `${fieldName} must be at least ${min} characters` };
    }
    return { valid: true };
  },
});

export const email = (): FieldValidation => ({
  validate: (value: string) => {
    if (!value) return { valid: true }; // Use required() for required check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    return { valid: true };
  },
});

export const url = (fieldName = 'URL'): FieldValidation => ({
  validate: (value: string) => {
    if (!value) return { valid: true }; // Use required() for required check
    try {
      new URL(value);
      return { valid: true };
    } catch {
      return { valid: false, error: `Please enter a valid ${fieldName}` };
    }
  },
});

export const linkedinUrl = (): FieldValidation => ({
  validate: (value: string) => {
    if (!value) return { valid: true };
    try {
      const parsed = new URL(value);
      if (!parsed.hostname.includes('linkedin.com')) {
        return { valid: false, error: 'Please enter a valid LinkedIn URL' };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Please enter a valid LinkedIn URL' };
    }
  },
});

export const githubUrl = (): FieldValidation => ({
  validate: (value: string) => {
    if (!value) return { valid: true };
    try {
      const parsed = new URL(value);
      if (!parsed.hostname.includes('github.com')) {
        return { valid: false, error: 'Please enter a valid GitHub URL' };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Please enter a valid GitHub URL' };
    }
  },
});

export const phone = (): FieldValidation => ({
  validate: (value: string) => {
    if (!value) return { valid: true };
    // Allow digits, spaces, dashes, parentheses, plus sign
    const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
    if (!phoneRegex.test(value)) {
      return { valid: false, error: 'Please enter a valid phone number' };
    }
    return { valid: true };
  },
});

export const gpa = (): FieldValidation => ({
  validate: (value: string) => {
    if (!value) return { valid: true };
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 4.0) {
      return { valid: false, error: 'GPA must be between 0.0 and 4.0' };
    }
    return { valid: true };
  },
});

// Combine multiple validators
export const combine = (...validators: FieldValidation[]): FieldValidation => ({
  validate: (value: string) => {
    for (const validator of validators) {
      const result = validator.validate(value);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  },
});

// Validate a form object
export type FormErrors<T> = Partial<Record<keyof T, string>>;

export function validateForm<T extends Record<string, string | null | undefined>>(
  data: T,
  rules: Partial<Record<keyof T, FieldValidation>>
): { valid: boolean; errors: FormErrors<T> } {
  const errors: FormErrors<T> = {};
  let valid = true;

  for (const [field, validator] of Object.entries(rules)) {
    if (validator) {
      const value = data[field as keyof T] ?? '';
      const result = (validator as FieldValidation).validate(String(value));
      if (!result.valid) {
        errors[field as keyof T] = result.error;
        valid = false;
      }
    }
  }

  return { valid, errors };
}

// Helper to get error message for a field
export function getFieldError<T>(errors: FormErrors<T>, field: keyof T): string | undefined {
  return errors[field];
}
