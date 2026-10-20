import { CategoriesBlock, CollectionsBlock, ProductBlock } from "@/components/home/HomeBlocks";
import { ArticlesBlock, HeroBlock, PromoBlock } from "@/components/home/CmsBlocks";
import { PolicyBlock } from "@/components/home/HomeSections";

// Các khối dữ liệu tự tải ở trình duyệt (từng khối có loading/lỗi riêng), nên trang chủ là tĩnh.
export default function Home() {
  return (
    <>
      <HeroBlock />
      <PromoBlock />
      <CategoriesBlock />
      <ProductBlock title="Sản phẩm mới" kicker="Vừa ra mắt" href="/products?sort=newest" params={{ sort: "newest" }} tinted />
      <ProductBlock title="Bán chạy nhất" kicker="Được yêu thích" href="/products?sort=bestseller" params={{ sort: "bestseller" }} />
      <ProductBlock title="Đang giảm giá" kicker="Ưu đãi" href="/products?sale=1" params={{ onSale: true }} tinted />
      <ProductBlock title="Sản phẩm nổi bật" kicker="Được chọn lọc" href="/products" params={{ featured: true }} />
      <CollectionsBlock />
      <ArticlesBlock />
      <PolicyBlock />
    </>
  );
}
