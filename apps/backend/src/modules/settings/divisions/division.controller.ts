import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { DivisionService } from './division.service';
import { CreateDivisionDto, UpdateDivisionDto } from './dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Roles } from '../../../common/decorators';
import { UserRole } from '../../../generated/prisma/client';

@Controller('settings/divisions')
@Roles(UserRole.SUPERADMIN)
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.divisionService.findAll(query);
  }

  @Get('active')
  findAllActive() {
    return this.divisionService.findAllActive();
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.divisionService.findOne(uuid);
  }

  @Post()
  create(@Body() dto: CreateDivisionDto) {
    return this.divisionService.create(dto);
  }

  @Put(':uuid')
  update(@Param('uuid') uuid: string, @Body() dto: UpdateDivisionDto) {
    return this.divisionService.update(uuid, dto);
  }

  @Delete(':uuid')
  remove(@Param('uuid') uuid: string) {
    return this.divisionService.remove(uuid);
  }
}
