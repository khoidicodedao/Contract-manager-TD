import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";

interface NumericFormatInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string | null | undefined;
  onChange: (value: number | undefined) => void;
}

export const NumericFormatInput = React.forwardRef<HTMLInputElement, NumericFormatInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const formattedValue = useMemo(() => {
      if (value === undefined || value === null || value === "" || isNaN(Number(value))) return "";
      return new Intl.NumberFormat("vi-VN").format(Number(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, "");
      const numValue = rawValue ? parseInt(rawValue, 10) : undefined;
      onChange(numValue);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        value={formattedValue}
        onChange={handleChange}
        autoComplete="off"
      />
    );
  }
);

NumericFormatInput.displayName = "NumericFormatInput";
