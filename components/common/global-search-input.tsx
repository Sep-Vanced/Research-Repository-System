"use client";

import { type KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type GlobalSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEnter?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
};

export function GlobalSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  onEnter,
  onFocus,
  onBlur,
  className,
  inputClassName,
  iconClassName,
}: GlobalSearchInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || !onEnter) return;
    event.preventDefault();
    onEnter();
  };

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400",
          iconClassName
        )}
      />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className={cn(
          "h-9 w-full rounded-full border-[var(--surface-border)] bg-[var(--surface)] pl-11 pr-3 text-sm text-[var(--foreground)] placeholder:text-blue-400/70 focus-visible:bg-[var(--surface)] focus-visible:ring-2 focus-visible:ring-blue-300",
          inputClassName
        )}
      />
    </div>
  );
}
