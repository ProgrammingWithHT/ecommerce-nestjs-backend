import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { ProductService } from "../product/product.service";
import { OrderRepository } from "./order.repository";

@Injectable()
export class OrderService {
    constructor(
        private productService: ProductService,
        private orderRepository: OrderRepository
    ) { }

    async create(createOrderDto: CreateOrderDto, userId: string) {
        
        const createOrder = await this.orderRepository.create(createOrderDto, userId);
        return {
            success: true,
            createOrder
        }
    }

    async findOne(id: string) {
        const order = await this.orderRepository.findOne(id);

        if (!order) throw new NotFoundException('Order not found');

        return order;
    }

    async findMyOrders(userId: string) {
        return this.orderRepository.findMyOrders(userId);
    }


    async findAll() {
        const orders = await this.orderRepository.findAll();

        const totalAmount = orders.reduce((acc, o) => acc + o.totalPrice, 0);

        return { totalAmount, orders };
    }

    async update(id: string, dto: UpdateOrderDto) {
        const order = await this.orderRepository.update(id, dto);

        if (!order) throw new NotFoundException('Order not found');

        if (order.orderStatus === 'Delivered') {
            throw new BadRequestException('Already delivered');
        }

        if (dto.status === 'Shipped') {
            console.log('hi')
            for (const item of order.orderItems) {
                // console.log('hi1')
                await this.updateStock(item.product, item.quantity);
            }
        }

        order.orderStatus = dto.status;

        if (dto.status === 'Delivered') {
            order.deliveredAt = new Date();
        }

        return order.save();
    }

    async delete(id: string) {
        const order = await this.orderRepository.delete(id);

        if (!order) throw new NotFoundException('Order not found');

        return await order.deleteOne();
    }

    async updateStock(productId: string, quantity: number) {
        console.log('running updatestock')
        await this.productService.decreaseStock(productId, quantity);
    } 
}