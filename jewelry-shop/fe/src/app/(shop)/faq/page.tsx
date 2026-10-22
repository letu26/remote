import { FaqView } from "@/components/content/FaqView";

export const metadata = { title: "Câu hỏi thường gặp" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <p className="mb-1 text-center text-xs font-medium uppercase tracking-[0.3em] text-gold-deep">Hỗ trợ khách hàng</p>
      <h1 className="font-serif text-4xl text-ink sm:text-5xl text-center">Câu hỏi thường gặp</h1>
      <p className="mx-auto mb-8 mt-3 max-w-xl text-center text-sm text-muted">Giải đáp nhanh về bảo hành, đổi trả, giao hàng và thanh toán.</p>
      <FaqView />
    </div>
  );
}
