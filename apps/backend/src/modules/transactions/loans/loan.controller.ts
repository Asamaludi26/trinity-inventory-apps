import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LoanService } from './loan.service';
import { CreateLoanDto, UpdateLoanDto, FilterLoanDto } from './dto';
import { AuthPermissions, CurrentUser } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';
import { JwtPayload } from '../../../common/interfaces';
import { UserRole } from '../../../generated/prisma/client';

@ApiTags('Loans')
@ApiBearerAuth('access-token')
@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.LOAN_REQUESTS_VIEW_ALL)
  @ApiOperation({ summary: 'List peminjaman' })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil data peminjaman',
  })
  async findAll(
    @Query() query: FilterLoanDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.loanService.findAll(query, user.sub, user.role);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.LOAN_REQUESTS_VIEW_OWN)
  @ApiOperation({ summary: 'Detail peminjaman' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.loanService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.LOAN_REQUESTS_CREATE)
  @ApiOperation({ summary: 'Buat peminjaman' })
  @ApiResponse({ status: 201, description: 'Peminjaman berhasil dibuat' })
  async create(@Body() dto: CreateLoanDto, @CurrentUser() user: JwtPayload) {
    return this.loanService.create(dto, user.sub, user.role as UserRole);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.LOAN_REQUESTS_CREATE)
  @ApiOperation({ summary: 'Update peminjaman' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoanDto,
  ) {
    return this.loanService.update(id, dto);
  }

  @Patch(':id/approve')
  @AuthPermissions(PERMISSIONS.LOAN_REQUESTS_APPROVE)
  @ApiOperation({ summary: 'Approve peminjaman' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
  ) {
    return this.loanService.approve(id, version);
  }

  @Patch(':id/reject')
  @AuthPermissions(PERMISSIONS.LOAN_REQUESTS_APPROVE)
  @ApiOperation({ summary: 'Reject peminjaman' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Body('version') version: number,
  ) {
    return this.loanService.reject(id, reason, version);
  }

  @Patch(':id/execute')
  @AuthPermissions(PERMISSIONS.LOAN_REQUESTS_APPROVE)
  @ApiOperation({ summary: 'Eksekusi peminjaman' })
  async execute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
  ) {
    return this.loanService.execute(id, version);
  }

  @Patch(':id/cancel')
  @AuthPermissions(PERMISSIONS.LOAN_REQUESTS_CREATE)
  @ApiOperation({ summary: 'Batalkan peminjaman' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('version') version: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.loanService.cancel(id, user.sub, version);
  }
}
