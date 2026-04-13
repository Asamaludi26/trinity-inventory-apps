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
import { AuthPermissions } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';

@Controller('settings/divisions')
export class DivisionController {
  constructor(private readonly divisionService: DivisionService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.DIVISIONS_MANAGE)
  findAll(@Query() query: PaginationQueryDto) {
    return this.divisionService.findAll(query);
  }

  @Get('active')
  findAllActive() {
    return this.divisionService.findAllActive();
  }

  @Get(':uuid')
  @AuthPermissions(PERMISSIONS.DIVISIONS_MANAGE)
  findOne(@Param('uuid') uuid: string) {
    return this.divisionService.findOne(uuid);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.DIVISIONS_MANAGE)
  create(@Body() dto: CreateDivisionDto) {
    return this.divisionService.create(dto);
  }

  @Put(':uuid')
  @AuthPermissions(PERMISSIONS.DIVISIONS_MANAGE)
  update(@Param('uuid') uuid: string, @Body() dto: UpdateDivisionDto) {
    return this.divisionService.update(uuid, dto);
  }

  @Delete(':uuid')
  @AuthPermissions(PERMISSIONS.DIVISIONS_MANAGE)
  remove(@Param('uuid') uuid: string) {
    return this.divisionService.remove(uuid);
  }
}
