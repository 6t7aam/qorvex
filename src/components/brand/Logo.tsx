import Image from "next/image";
import Link from "next/link";

type LogoSize = "sm" | "md" | "lg";
type LogoVariant = "icon" | "wordmark";

const SIZE_STYLES: Record<
  LogoSize,
  { icon: string; text: string; gap: string; radius: string }
> = {
  sm: {
    icon: "h-6 w-6",
    text: "text-base",
    gap: "gap-2",
    radius: "rounded-md",
  },
  md: {
    icon: "h-7 w-7",
    text: "text-lg",
    gap: "gap-2",
    radius: "rounded-md",
  },
  lg: {
    icon: "h-9 w-9",
    text: "text-2xl",
    gap: "gap-2.5",
    radius: "rounded-lg",
  },
};

interface LogoProps {
  href?: string;
  size?: LogoSize;
  variant?: LogoVariant;
  priority?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  onClick?: () => void;
}

export function Logo({
  href,
  size = "md",
  variant = "wordmark",
  priority = false,
  className = "",
  iconClassName = "",
  textClassName = "",
  onClick,
}: LogoProps) {
  const styles = SIZE_STYLES[size];
  const content = (
    <>
      <Image
        src="/qorvex-logo.svg"
        alt="Qorvex"
        width={36}
        height={36}
        priority={priority}
        className={`${styles.icon} ${styles.radius} object-contain ${iconClassName}`.trim()}
      />
      {variant === "wordmark" ? (
        <span
          className={`gradient-text font-bold tracking-tight ${styles.text} ${textClassName}`.trim()}
        >
          Qorvex
        </span>
      ) : null}
    </>
  );

  const wrapperClassName =
    `inline-flex items-center ${styles.gap} ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        className={wrapperClassName}
        aria-label="Qorvex"
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return <div className={wrapperClassName}>{content}</div>;
}
