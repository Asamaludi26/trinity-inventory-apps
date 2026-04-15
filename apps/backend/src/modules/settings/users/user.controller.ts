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
import { AuthPermissions } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';

@Controller('settings/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.USERS_VIEW)
  findAll(@Query() query: FilterUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':uuid')
  @AuthPermissions(PERMISSIONS.USERS_VIEW)
  findOne(@Param('uuid') uuid: string) {
    return this.userService.findOne(uuid);
  }

  @Get(':uuid/stats')
  @AuthPermissions(PERMISSIONS.USERS_VIEW)
  getStats(@Param('uuid') uuid: string) {
    return this.userService.getUserStats(uuid);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.USERS_CREATE)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put(':uuid')
  @AuthPermissions(PERMISSIONS.USERS_EDIT)
  update(@Param('uuid') uuid: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(uuid, dto);
  }

  @Delete(':uuid')
  @AuthPermissions(PERMISSIONS.USERS_DELETE)
  remove(@Param('uuid') uuid: string) {
    return this.userService.remove(uuid);
  }
}
