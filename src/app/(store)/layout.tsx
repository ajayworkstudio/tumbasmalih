import { CartBar } from "@/components/CartBar";
import { MobileNav, MobileNavView } from "@/components/MobileNav";
import { Suspense } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-310 flex-1 px-5 pt-5 pb-8 md:px-6 md:pt-7">{children}</main>
      <SiteFooter />
      <Suspense fallback={null}>
        <CartBar />
      </Suspense>
      <Suspense fallback={<MobileNavView pathname="" />}>
        <MobileNav />
      </Suspense>
    </>
  );
}
