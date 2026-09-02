import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "light" };

export function ButtonLink({ variant = "primary", className = "", ...props }: Props) {
  const styles = {
    primary: "bg-[var(--copper)] text-white hover:bg-[var(--copper-dark)] shadow-[0_12px_32px_rgba(103,55,31,.18)]",
    secondary: "border border-[var(--line)] bg-white/60 text-[var(--ink)] hover:bg-white",
    light: "bg-white text-[var(--ink)] hover:bg-[#f3eee6]",
  };
  return <Link className={`focus-ring inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-bold transition duration-300 ${styles[variant]} ${className}`} {...props} />;
}
