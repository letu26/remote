export declare class StatsRangeQueryDto {
    from?: string;
    to?: string;
}
export declare class RevenueQueryDto extends StatsRangeQueryDto {
    granularity?: 'day' | 'month' | 'year';
}
export declare class TopQueryDto extends StatsRangeQueryDto {
    limit?: number;
}
export declare class LowStockQueryDto {
    threshold?: number;
    limit?: number;
}
