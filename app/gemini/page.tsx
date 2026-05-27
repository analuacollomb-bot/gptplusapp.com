import { ProductPage, getProductMetadata } from "@/components/product-page";

export const metadata = getProductMetadata("gemini");

export default function GeminiPage() {
  return <ProductPage slug="gemini" />;
}
