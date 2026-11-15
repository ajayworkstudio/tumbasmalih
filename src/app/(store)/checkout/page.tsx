import type { Metadata } from "next";
import { shippingFlat } from "@/lib/site";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return <CheckoutForm shippingFee={shippingFlat()} />;
}
