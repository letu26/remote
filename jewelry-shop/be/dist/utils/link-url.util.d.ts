import { type ValidationOptions } from 'class-validator';
export declare function hasControlCharacters(value: string): boolean;
export declare function isSafeLink(value: unknown): boolean;
export declare function isHttpsUrl(value: unknown): boolean;
export declare const IsSafeLink: (options?: ValidationOptions) => (object: object, propertyName: string) => void;
export declare const IsHttpsUrl: (options?: ValidationOptions) => (object: object, propertyName: string) => void;
