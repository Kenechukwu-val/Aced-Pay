import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user and default personal tenant in a transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          password: hashedPassword,
          provider: 'email',
        },
      });

      // Automatically create a personal tenant named after the users name or "My Workspace"
      const tenant = await tx.tenant.create({
        data: {
          name: createUserDto.name ? `${createUserDto.name}'s Workspace` : 'My Workspace',
          slug: `workspace-${user.id.substring(0, 8)}`,
        }
      });

      // Add user as owner of the tenant
      await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'owner',
        },
      });

      // Generate JWT token with tenant info
      const accessToken = this.generateToken(user.id, user.email, tenant.id, 'owner');

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return {
        user: {
          ...result,
          currentTenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            role: 'owner',
          },
        },
        accessToken,
      };
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  // Get user's primary tenant (first one they're a member of)
  const membership = await this.prisma.tenantMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    include: { tenant: true },
  });

  const accessToken = this.generateToken(
    user.id,
    user.email,
    membership?.tenantId,
    membership?.role,
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...result } = user;

  return {
    user: {
      ...result,
      currentTenant: membership
        ? {
            id: membership.tenant.id,
            name: membership.tenant.name,
            slug: membership.tenant.slug,
            role: membership.role,
          }
        : null,
    },
    accessToken,
  };
}


  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id '${id}' not found`);
    }

    return user;
  }

  async update(id: string, data: { name?: string; email?: string; password?: string }) {
    // Validate that data is provided
    if (!data) {
      throw new BadRequestException('Request body is required');
    }

    // Validate that at least one field is provided
    if (!data.name && !data.email && !data.password) {
      throw new BadRequestException('At least one field (name, email, or password) is required');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password = data.password;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }

  private generateToken(
    userId: string,
    email: string,
    tenantId?: string,
    role?: string,
  ) {
    return this.jwtService.sign({
      sub: userId,
      email,
      tenantId: tenantId || null,
      role: role || null,
    });
  }
}
