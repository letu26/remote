import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenBlacklistService } from '../modules/token-blacklist/services/token-blacklist.service.js';
export declare class JwtAuthGuard implements CanActivate {
    private readonly jwtService;
    private readonly blacklist;
    private readonly logger;
    constructor(jwtService: JwtService, blacklist: TokenBlacklistService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private verify;
}
