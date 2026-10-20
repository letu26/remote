import { ImageCleanupService } from '../../media/services/image-cleanup.service.js';
import type { CreateBannerDto, UpdateBannerDto } from '../dtos/banner.dtos.js';
import { type BannerRow, BannerRepository } from '../repositories/banner.repository.js';
export declare class BannerService {
    private readonly banners;
    private readonly cleanup;
    constructor(banners: BannerRepository, cleanup: ImageCleanupService);
    listPublic(position?: string): Promise<{
        id: number;
        title: string;
        imageUrl: string;
        linkUrl: string | null;
        position: string;
        sortOrder: number;
    }[]>;
    listAll(): Promise<BannerRow[]>;
    create(dto: CreateBannerDto): Promise<BannerRow>;
    update(id: number, dto: UpdateBannerDto): Promise<BannerRow>;
    remove(id: number): Promise<void>;
    private getOrFail;
}
