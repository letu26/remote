export declare class PageQueryDto {
    page?: number;
    pageSize?: number;
}
export interface Page<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
export interface PageRequest {
    page: number;
    pageSize: number;
    offset: number;
}
export declare function resolvePage(query: PageQueryDto, defaultSize: number, maxSize: number): PageRequest;
export declare function toPage<T>(items: T[], total: number, request: PageRequest): Page<T>;
