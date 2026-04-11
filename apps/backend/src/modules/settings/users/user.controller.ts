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
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, FilterUserDto } from './dto';
import { Roles } from '../../../common/decorators';
import { UserRole } from '../../../generated/prisma/client';

@Controller('settings/users')
@Roles(UserRole.SUPERADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(@Query() query: FilterUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.userService.findOne(uuid);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put(':uuid')
  update(@Param('uuid') uuid: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(uuid, dto);
  }

  @Delete(':uuid')
  remove(@Param('uuid') uuid: string) {
    return this.userService.remove(uuid);
  }
}
