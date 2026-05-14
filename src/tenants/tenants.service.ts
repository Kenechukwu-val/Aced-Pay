import { 
    ConflictException,
    Injectable,
    NotFoundException,
    ForbiddenException,

} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

@Injectable()
export class TenantsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(userId: string, dto: CreateTenantDto) {
        // Check if slug is taken
        const existing = await this.prisma.tenant.findUnique({
            where: { slug: dto.slug },
        });

        if (existing) {
            throw new ConflictException('Tenant slug already taken');
        }

        // Create tenant and add creator as owner in a transaction
        return this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: dto.name,
                    slug: dto.slug,
                },
            });

            await tx.tenantMember.create({
                data: {
                    userId,
                    tenantId: tenant.id,
                    role: 'owner',  
                }
            });

            return tenant;
        })
    }

    async findAllForUser(userId: string) {
        return this.prisma.tenant.findMany({
            where: {
                members: {
                    some: { userId },
                },
            },
            include: {
                members: {
                    where: { userId },
                    select: { role: true },
                },
            },
        });
    }

    async findOne(tenantId: string, userId: string) {
        const tenant = await this.prisma.tenant.findFirst({
            where: {
                id: tenantId,
                members: {
                    some: { userId },
                },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, email: true, name: true } },
                    }
                },
                subscriptions: { include: { plan: true } },
            },
        });
        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }
        // Map members to include 'id' as alias for userId (for use in /members/:id endpoint)
        return {
            ...tenant,
            members: tenant.members.map(m => ({
                id: m.userId,
                userId: m.userId,
                role: m.role,
                createdAt: m.createdAt,
                user: m.user,
            })),
        };
    }

    async inviteMember(tenantId: string, invitingUserId: string, dto: InviteMemberDto) {
        // Check if tenant inviting user is a owner/admin
        const membership = await this.prisma.tenantMember.findUnique({
            where: { userId_tenantId: { userId: invitingUserId, tenantId } },
        });

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            throw new ForbiddenException('Only owners and admins can invite members');
        }

        // Find or fail if user doesn't exist
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new NotFoundException('User not found. They must have an account to be invited');
        }

        // Check if user is already a member
        const existing = await this.prisma.tenantMember.findUnique({
            where: { userId_tenantId: { userId: user.id, tenantId } },
        });

        if (existing) {
            throw new ConflictException('User is already a member');
        }

        // Add user as member
        return this.prisma.tenantMember.create({
            data: {
                userId: user.id,
                tenantId,
                role: dto.role || 'member',
            },
            include: { user: { select: { id: true, email: true, name: true } } },
        });
    }

    async removeMember(tenantId: string, removingUserId: string, targetUserId: string) {
        // Can't remove yourself if you're the only owner
        const membership = await this.prisma.tenantMember.findUnique({
            where: { userId_tenantId: { userId: removingUserId, tenantId } },
        });

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            throw new ForbiddenException('Only owners and admins can remove members');
        }

        const targetmembership = await this.prisma.tenantMember.findUnique({
            where: { userId_tenantId: { userId: targetUserId, tenantId } },
        });

        if (!targetmembership) {
            throw new NotFoundException('Member not found');
        }

        //Prevent removing the last owner
        if (targetmembership.role === 'owner') {
            const ownerCount = await this.prisma.tenantMember.count({
                where: {
                    tenantId,
                    role: 'owner',
                },
            });

            if (ownerCount <= 1) {
                throw new ForbiddenException('Cannot remove the last owner');
            }
        }

        return this.prisma.tenantMember.delete({
            where: { userId_tenantId: { userId: targetUserId, tenantId } },
        });
    }
}
