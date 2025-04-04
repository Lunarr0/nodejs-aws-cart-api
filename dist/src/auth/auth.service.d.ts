import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/services/users.service';
import { User } from '../users/models';
type TokenResponse = {
    token_type: string;
    access_token: string;
};
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(payload: User): {
        userId: string;
    };
    validateUser(name: string, password: string): User;
    login(user: User, type: 'jwt' | 'basic' | 'default'): TokenResponse;
    loginJWT(user: User): {
        token_type: string;
        access_token: string;
    };
    loginBasic(user: User): {
        token_type: string;
        access_token: string;
    };
}
export {};
