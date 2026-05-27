import { ProductPage, getProductMetadata } from "@/components/product-page";

export const metadata = getProductMetadata("chatgpt");

export default function ChatGPTPage() {
  return <ProductPage slug="chatgpt" />;
}
