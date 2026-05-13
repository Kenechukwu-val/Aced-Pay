import { SetMetadata } from '@nestjs/common';

// Define a custom decorator to specify required roles for route handlers
export const Roles = (...roles: ('owner' | 'admin' | 'member')[]) =>
    SetMetadata('roles', roles); 