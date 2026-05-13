import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, InviteMemberDto } from './dto';
import { TenantContext } from '../common/tenant/tenant-context';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly tenantContext: TenantContext,
  ) {}

  private getUserId(): string {
    const userId = this.tenantContext.getUserId();
    if (!userId) {
      throw new UnauthorizedException('User context not available');
    }
    return userId;
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin', 'member')
  findAll() {
    return this.tenantsService.findAllForUser(this.getUserId());
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin', 'member')
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(this.getUserId(), dto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin', 'member')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id, this.getUserId());
  }

  @Post(':id/invite')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  inviteMember(@Param('id') id: string, @Body() dto: InviteMemberDto) {
    return this.tenantsService.inviteMember(id, this.getUserId(), dto);
  }

  @Delete(':id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles('owner', 'admin')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.tenantsService.removeMember(id, this.getUserId(), userId);
  }
}
