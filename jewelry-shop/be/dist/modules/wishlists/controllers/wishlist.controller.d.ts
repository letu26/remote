import type { Response } from 'express';
import { PageQueryDto } from '../../../utils/pagination.js';
import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { AddWishlistDto } from '../dtos/wishlist.dtos.js';
import { WishlistService } from '../services/wishlist.service.js';
export declare class WishlistController {
    private readonly service;
    constructor(service: WishlistService);
    list(user: AuthenticatedUser, query: PageQueryDto): Promise<import("../../../utils/pagination.js").Page<import("../services/wishlist.service.js").WishlistItem>>;
    ids(user: AuthenticatedUser): Promise<{
        productIds: number[];
    }>;
    add(user: AuthenticatedUser, dto: AddWishlistDto, res: Response): Promise<{
        productId: number;
    }>;
    remove(user: AuthenticatedUser, productId: number): Promise<void>;
}
