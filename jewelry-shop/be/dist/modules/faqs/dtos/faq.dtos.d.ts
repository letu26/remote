export declare function splitKeywords(raw: string): string[];
export declare function validateKeywords(raw: unknown): string | null;
export declare class CreateFaqDto {
    question: string;
    answer: string;
    keywords?: string | null;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class UpdateFaqDto {
    question?: string;
    answer?: string;
    keywords?: string | null;
    sortOrder?: number;
    isActive?: boolean;
}
