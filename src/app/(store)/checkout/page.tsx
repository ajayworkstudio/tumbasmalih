import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const { shippingFlat } = await getSettings();
  return <CheckoutForm shippingFee={shippingFlat} />;
}
