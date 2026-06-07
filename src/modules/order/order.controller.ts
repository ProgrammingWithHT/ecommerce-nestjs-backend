import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('/new')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateOrderDto, @Req() req) {
    return this.orderService.create(dto, req.user.id);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  myOrders(@Req() req) {
    return this.orderService.findMyOrders(req.user.id);
  }
  @Get('/admin')
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getAll() {
    return this.orderService.findAll();
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }



  @Put('/admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.orderService.update(id, dto);
  }

  @Delete('admin/:id')
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  delete(@Param('id') id: string) {
    return this.orderService.delete(id);
  }
}
