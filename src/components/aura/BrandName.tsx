import { AURA_BRAND } from "../../design-system/aura/brand";

type BrandNameProps = {
  className?: string;
  as?: "span" | "p";
};

/** User-facing product name — always "Aura". */
export function BrandName({ className = "brand-name", as: Tag = "p" }: BrandNameProps) {
  return <Tag className={className}>{AURA_BRAND.name}</Tag>;
}

export function brandTitle(suffix?: string): string {
  return suffix ? `${suffix} — ${AURA_BRAND.name}` : AURA_BRAND.name;
}
