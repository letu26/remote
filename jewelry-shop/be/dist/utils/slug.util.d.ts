export declare const SLUG_PATTERN: RegExp;
export declare function slugify(input: string, maxLength?: number): string;
export declare function pickFreeSlug(base: string, taken: ReadonlySet<string>): string;
interface SlugPersistOptions<T> {
    name: string;
    slug?: string;
    maxLength: number;
    findTaken: (prefix: string) => Promise<string[]>;
    save: (slug: string) => Promise<T>;
    isSlugConflict: (error: unknown) => boolean;
}
export declare function persistWithSlug<T>(options: SlugPersistOptions<T>): Promise<T>;
export {};
