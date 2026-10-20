import { http } from "./http";
import type {
  AdminCategory,
  AdminCollection,
  AdminNamedItem,
  CategoryInput,
  CollectionInput,
  NamedInput,
} from "@/types/admin-catalog";

/** Bộ CRUD chuẩn cho một tài nguyên `/admin/<path>`. */
export interface CrudService<T, I> {
  list: () => Promise<T[]>;
  create: (input: I) => Promise<T>;
  update: (id: number, input: Partial<I>) => Promise<T>;
  remove: (id: number) => Promise<void>;
}

export function createCrudService<T, I>(path: string): CrudService<T, I> {
  const base = `/admin/${path}`;
  return {
    list: async () => (await http.get<T[]>(base)).data,
    create: async (input) => (await http.post<T>(base, input)).data,
    update: async (id, input) => (await http.patch<T>(`${base}/${id}`, input)).data,
    remove: async (id) => {
      await http.delete(`${base}/${id}`);
    },
  };
}

export const adminCategoryService = createCrudService<AdminCategory, CategoryInput>("categories");
export const adminMaterialService = createCrudService<AdminNamedItem, NamedInput>("materials");
export const adminGemstoneService = createCrudService<AdminNamedItem, NamedInput>("gemstones");
export const adminCollectionService = createCrudService<AdminCollection, CollectionInput>("collections");
