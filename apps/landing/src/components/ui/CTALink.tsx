import Link from "next/link";
import type { ReactNode } from "react";

const variantClasses = {
  primary: "border-accent bg-accent text-accent-ink hover:bg-transparent hover:text-accent",
  secondary: "border-border-strong bg-transparent text-ink hover:border-accent hover:text-accent",
} as const;

/**
 * Every CTA on this site is real navigation (to GitHub, to the console
 * source, to an in-page anchor) -- always an <a>/<Link>, never a <button>
 * standing in for one, so browser/keyboard/screen-reader link semantics
 * (open in new tab, copy link, etc.) keep working as expected.
 */
export function CTALink({
  href,
  variant = "primary",
  external,
  children,
}: {
  href: string;
  variant?: keyof typeof variantClasses;
  external?: boolean;
  children: ReactNode;
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-md border px-5 py-3 text-sm font-medium transition-colors duration-150 ${variantClasses[variant]}`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
