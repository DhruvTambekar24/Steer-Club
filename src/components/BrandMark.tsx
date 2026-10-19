import Image from "next/image";

export default function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Image
      className={`brand-mark-image ${className}`.trim()}
      src="/steer-club-platform-logo.svg"
      alt="Steer Club"
      width={128}
      height={36}
      priority
    />
  );
}