import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Chỉ hiển thị Markdown thuần: KHÔNG bật HTML thô (không dùng rehype-raw), liên kết nguy hiểm
// (javascript:, data:...) bị react-markdown lọc mặc định. Liên kết ngoài mở tab mới.
const components: Components = {
  h1: (props) => <h1 className="mb-3 mt-6 font-serif text-2xl font-semibold text-ink first:mt-0" {...props} />,
  h2: (props) => <h2 className="mb-2 mt-6 font-serif text-xl font-semibold text-ink first:mt-0" {...props} />,
  h3: (props) => <h3 className="mb-2 mt-5 font-serif text-lg font-semibold text-ink first:mt-0" {...props} />,
  p: (props) => <p className="my-3 leading-7" {...props} />,
  ul: (props) => <ul className="my-3 list-disc space-y-1 pl-6" {...props} />,
  ol: (props) => <ol className="my-3 list-decimal space-y-1 pl-6" {...props} />,
  li: (props) => <li className="leading-7" {...props} />,
  blockquote: (props) => (
    <blockquote className="my-4 border-l-2 border-gold pl-4 italic text-ink/80" {...props} />
  ),
  hr: () => <hr className="my-6 border-line" />,
  a: ({ href, children, ...rest }) => {
    const external = typeof href === "string" && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        className="text-gold-deep underline underline-offset-2 hover:text-gold-deeper"
        {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  },
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element -- nội dung do admin nhập, kích thước không biết trước
    <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" className="my-4 h-auto max-w-full rounded-lg" />
  ),
  table: (props) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => <th className="border border-line bg-gold-tint px-3 py-2 text-left font-medium" {...props} />,
  td: (props) => <td className="border border-line px-3 py-2" {...props} />,
  code: (props) => <code className="rounded bg-gold-tint px-1 py-0.5 text-[0.9em]" {...props} />,
};

export function MarkdownContent({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className ?? "text-[15px] text-ink/90"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
