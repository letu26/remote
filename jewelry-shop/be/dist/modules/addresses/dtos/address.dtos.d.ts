export declare class CreateAddressDto {
    receiverName: string;
    receiverPhone: string;
    provinceId: number;
    wardId: number;
    detail: string;
    isDefault?: boolean;
}
export declare class UpdateAddressDto {
    receiverName?: string;
    receiverPhone?: string;
    provinceId?: number;
    wardId?: number;
    detail?: string;
    isDefault?: boolean;
}
