import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  variant?: "primary" | "secondary" | "dark" | "ghost";
  external?: boolean;
  className?: string;
};

const variants = {
  primary:
    "border-[#8c612b] bg-[linear-gradient(135deg,#1a120c,#3a2817_54%,#9a6a2f)] text-[#fff7e6] shadow-sm shadow-[#2b2118]/20 hover:brightness-110",
  secondary:
    "border-[#d8c39b] bg-[#fffaf0] text-[#21170f] shadow-sm shadow-[#9a6a2f]/10 hover:border-[#c99f55] hover:bg-[#fff5dc]",
  dark:
    "border-[#f0d89a]/35 bg-[#fff5dc] text-[#1a120c] shadow-lg shadow-black/20 hover:bg-white",
  ghost:
    "border-[#d8c39b] bg-transparent text-[#4b4036] hover:border-[#c99f55] hover:bg-[#fffaf0]",
};

export function ButtonLink({
  href,
  children,
  icon: Icon,
  variant = "primary",
  external = false,
  className = "",
}: ButtonLinkProps) {
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${variants[variant]} ${className}`;

  if (external) {
    return (
      <a className={classes} href={href} target="_blank" rel="noreferrer">
        {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href}>
      {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
      {children}
    </Link>
  );
}
