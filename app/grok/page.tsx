import { ProductPage, getProductMetadata } from "@/components/product-page";

export const metadata = getProductMetadata("grok");

export default function GrokPage() {
  return <ProductPage slug="grok" />;
}
