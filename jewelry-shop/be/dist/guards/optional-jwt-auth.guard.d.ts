import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';
export declare class OptionalJwtAuthGuard implements CanActivate {
    private readonly jwtAuthGuard;
    constructor(jwtAuthGuard: JwtAuthGuard);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
