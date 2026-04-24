import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Order, OrderDocument } from "./schemas/order.schema";
import { Model } from "mongoose";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";


@Injectable()
export class OrderRepository {
    constructor(@InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>
){}

    create(createOrderDto: CreateOrderDto, userId: string){
        return this.orderModel.create(
            {
                ...createOrderDto,
                paidAt: new Date(),
                user: userId
            }
        )
    }

    findOne(id: string){
        return this.orderModel.findById(id).populate('user', 'name email');
    }

    findMyOrders(userId: string){
        return this.orderModel.find({ user: userId });
    }

    findAll(){
        return this.orderModel.find();
    }

    update(id: string, dto: UpdateOrderDto){
        return this.orderModel.findById(id);
    }

    delete(id: string){
        return this.orderModel.findById(id);
    }
    


}