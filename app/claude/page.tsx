import { ProductPage, getProductMetadata } from "@/components/product-page";

export const metadata = getProductMetadata("claude");

export default function ClaudePage() {
  return <ProductPage slug="claude" />;
}
