import { CheckoutView } from "@/components/checkout/CheckoutView";
import { RouteGuard } from "@/guards/RouteGuard";
import { ShopLayout } from "@/layouts/ShopLayout";

export const metadata = { title: "Thanh toán" };

export default function CheckoutPage() {
  return (
    <RouteGuard>
      <ShopLayout>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <h1 className="mb-6 font-serif text-3xl text-ink sm:text-4xl">Thanh toán</h1>
          <CheckoutView />
        </div>
      </ShopLayout>
    </RouteGuard>
  );
}
