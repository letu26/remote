import type { AuthenticatedUser } from '../../auth/models/jwt-payload.js';
import { AddCartItemDto, RemoveCartItemsDto, UpdateCartItemDto } from '../dtos/cart.dtos.js';
import { CartService } from '../services/cart.service.js';
export declare class CartController {
    private readonly service;
    constructor(service: CartService);
    get(user: AuthenticatedUser): Promise<import("../services/cart.service.js").CartView>;
    summary(user: AuthenticatedUser): Promise<{
        itemCount: number;
        totalQuantity: number;
    }>;
    add(user: AuthenticatedUser, dto: AddCartItemDto): Promise<import("../services/cart.service.js").CartView>;
    removeMany(user: AuthenticatedUser, dto: RemoveCartItemsDto): Promise<import("../services/cart.service.js").CartView>;
    update(user: AuthenticatedUser, itemId: number, dto: UpdateCartItemDto): Promise<import("../services/cart.service.js").CartView>;
    remove(user: AuthenticatedUser, itemId: number): Promise<import("../services/cart.service.js").CartView>;
    clear(user: AuthenticatedUser): Promise<void>;
}
