import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type FormFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
};

export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className = "",
  htmlFor,
}: FormFieldProps) {
  return (
    <label className={`ds-form-field${className ? ` ${className}` : ""}`} htmlFor={htmlFor}>
      <span className="ds-form-field-label">
        {label}
        {required && <span className="ds-form-field-required" aria-hidden="true"> *</span>}
      </span>
      {hint && <span className="ds-form-field-hint">{hint}</span>}
      {children}
      {error && (
        <span className="ds-form-field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { fullWidth?: boolean };

export function Input({ className = "", fullWidth = true, ...props }: InputProps) {
  return (
    <input
      className={`ds-input${fullWidth ? " ds-input-full" : ""}${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { fullWidth?: boolean };

export function Select({ className = "", fullWidth = true, children, ...props }: SelectProps) {
  return (
    <select
      className={`ds-select${fullWidth ? " ds-select-full" : ""}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </select>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { fullWidth?: boolean };

export function TextArea({ className = "", fullWidth = true, ...props }: TextAreaProps) {
  return (
    <textarea
      className={`ds-textarea${fullWidth ? " ds-textarea-full" : ""}${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}
