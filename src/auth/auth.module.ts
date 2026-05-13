import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET_KEY || 'your_secret_key',
      signOptions: { expiresIn: '7d' },
    }),
    UsersModule,
    PrismaModule,
    TenantsModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, GoogleStrategy, GithubStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
