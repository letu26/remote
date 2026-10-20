import { FaqView } from "@/components/content/FaqView";

export const metadata = { title: "Câu hỏi thường gặp" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <h1 className="mb-6 font-serif text-3xl text-ink sm:text-4xl">Câu hỏi thường gặp</h1>
      <FaqView />
    </div>
  );
}
