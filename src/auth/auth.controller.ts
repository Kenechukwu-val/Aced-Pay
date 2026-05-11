import {
  Controller,
  Get,
  Req,
  UseGuards,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() {
        // Initiates Google OAuth2 login flow
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthredirect(@Req() req: Request, @Res() res: Response) {
        const googleUser = req.user as any;

        //Find or create user in the database
        let user = await this.prisma.user.findUnique({
            where: { email: googleUser.email },
        });

        if (user && user.provider !== 'google') {
            // User exists but with a different provider
            throw new UnauthorizedException('Email is already associated with another account');
        }

        if (!user) {
            // Create new user
            user = await this.prisma.user.create({
                data: {
                    email: googleUser.email,
                    name: googleUser.name,
                    provider: 'google',
                    providerId: googleUser.providerId,
                },
            });
        }

        // Get or create default tenant
        const membership = await this.prisma.tenantMember.findFirst({
            where: { userId: user.id },
            include: { tenant: true },
        });

        //Generate JWT (reusing the service's logic)
        const jwtService = await import('@nestjs/jwt').then(m => m.JwtService);
        const jwt = new jwtService({
            secret: process.env.JWT_SECRET,
        });

        const token = jwt.sign({
            sub: user.id,
            email: user.email,
            tenantId: membership?.tenantId,
            role: membership?.role,
        });

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    }

    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    async githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
       
        const githubUser = req.user as any;
        
        let user = await this.prisma.user.findUnique({
            where: { email: githubUser.email },
        });

        if (user && user.provider !== 'github') {
            throw new UnauthorizedException('Email already registered with another provider');
        }

        if (!user) {
        user = await this.prisma.user.create({
            data: {
            email: githubUser.email,
            name: githubUser.name,
            provider: 'github',
            providerId: githubUser.providerId,
            },
        });
        }

        const membership = await this.prisma.tenantMember.findFirst({
            where: { userId: user.id },
            include: { tenant: true },
        });

        const jwtService = await import('@nestjs/jwt').then(m => m.JwtService);
        const jwt = new jwtService({
            secret: process.env.JWT_SECRET_KEY,
        });

        const token = jwt.sign({
            sub: user.id,
            email: user.email,
            tenantId: membership?.tenantId,
            role: membership?.role,
        });

        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    }

}