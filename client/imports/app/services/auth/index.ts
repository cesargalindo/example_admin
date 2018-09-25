import { AuthService } from './auth.service';
import { AuthGuard } from './auth-guard';
import { AuthGuardAdmin } from './auth-guard-admin';
import { AuthGuardContractor } from './auth-guard-contractor';
import { AuthGuardLeadContractor } from './auth-guard-leadContractor';


export const AUTH_PROVIDERS = [
    AuthService,
    AuthGuard,
    AuthGuardAdmin,
    AuthGuardContractor,
    AuthGuardLeadContractor
];
