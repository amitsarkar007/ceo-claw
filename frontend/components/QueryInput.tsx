"use client";

import { cn } from "@/lib/utils";

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function QueryInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask your AI workforce anything…",
  disabled = false,
  className,
}: QueryInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onSubmit();
        }
      }}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      className={cn(
        "w-full min-h-[56px] max-h-[120px] rounded-2xl border-[1.5px] border-[#e0e0e0] dark:border-[#333333]",
        "bg-white dark:bg-[#1a1a1a] px-4 py-3.5 text-[15px] text-[#1a1a1a] dark:text-[#e8e8e8]",
        "placeholder:text-[#999999] dark:placeholder:text-[#666666]",
        "resize-none outline-none transition-all",
        "focus:border-[#cc4400] dark:focus:border-[#ff6b35]",
        "shadow-sm focus:shadow-md",
        className
      )}
    />
  );
}
