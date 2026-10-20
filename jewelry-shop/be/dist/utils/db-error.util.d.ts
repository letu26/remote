export declare function getDuplicateEntryValue(error: unknown): string | null;
export declare function getDuplicateKeyName(error: unknown): string | null;
export declare function isForeignKeyReferencedError(error: unknown): boolean;
export declare function isForeignKeyMissingError(error: unknown): boolean;
export interface DuplicateInfo {
    table: string;
    value: string;
}
export declare function getDuplicateInfo(error: unknown): DuplicateInfo | null;
export declare function toBool(value: unknown): boolean;
