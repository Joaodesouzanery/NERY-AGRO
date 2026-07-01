import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
};

/**
 * Campo de senha reutilizável com botão de mostrar/ocultar (olho).
 * Casa com o estilo dos inputs das telas de auth (h-11, rounded-lg, focus ring).
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, className, autoComplete = "current-password", ...props }, ref) => {
    const [show, setShow] = useState(false);
    const id = useId();
    const input = (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          className={
            "h-11 w-full rounded-lg border border-border bg-background pl-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" +
            (className ? ` ${className}` : "")
          }
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );

    if (!label) return input;
    return (
      <label htmlFor={id} className="grid gap-1.5 text-sm">
        <span className="text-muted-foreground">{label}</span>
        {input}
      </label>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
