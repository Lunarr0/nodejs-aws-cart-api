import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth';
import { User } from './users';
import { AppRequest } from './shared';
export declare class AppController {
    private authService;
    constructor(authService: AuthService);
    healthCheck(): {
        statusCode: HttpStatus;
        message: string;
    };
    register(body: User): {
        userId: string;
    };
    login(req: AppRequest): Promise<{
        token_type: string;
        access_token: string;
    }>;
    getProfile(req: AppRequest): Promise<{
        user: User;
    }>;
}
