import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto, FilterCategoryDto } from './dto';
import { AuthPermissions } from '../../../common/decorators';
import { PERMISSIONS } from '../../../common/constants';

@ApiTags('Asset Categories')
@ApiBearerAuth('access-token')
@Controller('assets/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @AuthPermissions(PERMISSIONS.CATEGORIES_VIEW)
  @ApiOperation({ summary: 'List kategori aset' })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil data kategori' })
  async findAll(@Query() query: FilterCategoryDto) {
    return this.categoryService.findAll(query);
  }

  @Get(':id')
  @AuthPermissions(PERMISSIONS.CATEGORIES_VIEW)
  @ApiOperation({ summary: 'Detail kategori aset' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Post()
  @AuthPermissions(PERMISSIONS.CATEGORIES_MANAGE)
  @ApiOperation({ summary: 'Buat kategori aset' })
  @ApiResponse({ status: 201, description: 'Kategori berhasil dibuat' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Patch(':id')
  @AuthPermissions(PERMISSIONS.CATEGORIES_MANAGE)
  @ApiOperation({ summary: 'Update kategori aset' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @AuthPermissions(PERMISSIONS.CATEGORIES_MANAGE)
  @ApiOperation({ summary: 'Hapus kategori aset' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
