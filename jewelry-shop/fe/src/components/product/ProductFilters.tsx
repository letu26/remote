"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { PRICE_RANGES, TARGET_GROUPS } from "@/constants/catalog";
import type { CategoryNode, FilterOptions, ProductQuery } from "@/types/catalog";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line py-5 first:pt-0 last:border-0">
      <legend className="mb-3 font-serif text-lg text-ink">{title}</legend>
      <div className="space-y-2.5">{children}</div>
    </fieldset>
  );
}

function toggle<T>(list: T[] | undefined, value: T): T[] | undefined {
  const cur = list ?? [];
  const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
  return next.length ? next : undefined;
}

function flatten(nodes: CategoryNode[], depth = 0): { node: CategoryNode; depth: number }[] {
  return nodes.flatMap((n) => [{ node: n, depth }, ...flatten(n.children ?? [], depth + 1)]);
}

/** Bộ lọc dùng chung cho thanh bên (desktop) và ngăn kéo (mobile). `idPrefix` tránh trùng id. */
export function ProductFilters({
  value,
  onChange,
  idPrefix,
  options,
}: {
  value: ProductQuery;
  onChange: (patch: Partial<ProductQuery>) => void;
  idPrefix: string;
  options: FilterOptions;
}) {
  const id = (k: string) => `${idPrefix}-${k}`;
  return (
    <div>
      {options.categories.length > 0 && (
        <Group title="Loại trang sức">
          {flatten(options.categories).map(({ node, depth }) => (
            <div key={node.id} style={{ paddingLeft: depth * 16 }}>
              <Checkbox
                id={id(`cat-${node.slug}`)}
                label={node.name}
                checked={value.category === node.slug}
                onChange={() => onChange({ category: value.category === node.slug ? undefined : node.slug })}
              />
            </div>
          ))}
        </Group>
      )}
      <Group title="Khoảng giá">
        {PRICE_RANGES.map((r) => (
          <Checkbox
            key={r.key}
            id={id(`price-${r.key}`)}
            label={r.label}
            checked={value.price === r.key}
            onChange={() => onChange({ price: value.price === r.key ? undefined : r.key })}
          />
        ))}
      </Group>
      {options.materials.length > 0 && (
        <Group title="Chất liệu">
          {options.materials.map((m) => (
            <Checkbox
              key={m.id}
              id={id(`material-${m.id}`)}
              label={m.name}
              checked={value.material === m.id}
              onChange={() => onChange({ material: value.material === m.id ? undefined : m.id })}
            />
          ))}
        </Group>
      )}
      {options.gemstones.length > 0 && (
        <Group title="Loại đá quý">
          {options.gemstones.map((g) => (
            <Checkbox
              key={g.id}
              id={id(`gemstone-${g.id}`)}
              label={g.name}
              checked={!!value.gemstone?.includes(g.id)}
              onChange={() => onChange({ gemstone: toggle(value.gemstone, g.id) })}
            />
          ))}
        </Group>
      )}
      <Group title="Dành cho">
        {TARGET_GROUPS.map((t) => (
          <Checkbox
            key={t.value}
            id={id(`target-${t.value}`)}
            label={t.label}
            checked={value.targetGroup === t.value}
            onChange={() => onChange({ targetGroup: value.targetGroup === t.value ? undefined : t.value })}
          />
        ))}
      </Group>
      {options.collections.length > 0 && (
        <Group title="Bộ sưu tập">
          {options.collections.map((c) => (
            <Checkbox
              key={c.id}
              id={id(`col-${c.slug}`)}
              label={c.name}
              checked={value.collection === c.slug}
              onChange={() => onChange({ collection: value.collection === c.slug ? undefined : c.slug })}
            />
          ))}
        </Group>
      )}
      <Group title="Tình trạng">
        <Checkbox
          id={id("sale")}
          label="Đang khuyến mại"
          checked={!!value.sale}
          onChange={() => onChange({ sale: value.sale ? undefined : true })}
        />
        <Checkbox
          id={id("instock")}
          label="Còn hàng"
          checked={!!value.inStock}
          onChange={() => onChange({ inStock: value.inStock ? undefined : true })}
        />
      </Group>
    </div>
  );
}
