import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true })
  public_id: string;

  @Prop({ required: true })
  url: string;
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

@Schema({ _id: false })
export class Review {
  _id?: string;

  @Prop({ required: true })
  user: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  rating: number;

  @Prop({ required: true })
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Product {
  @Prop({
    required: [true, 'Please Enter Product Name'],
    trim: true,
  })
  name: string;

  @Prop({
    required: [true, 'Please Enter Product Price'],
    max: [99999999, 'Price cannot exceed 8 digits'],
  })
  price: number;

  @Prop({
    required: true,
  })
  description: string;

  @Prop({
    default: 0,
  })
  ratings: number;

  @Prop({
    type: [ProductImageSchema],
    default: [],
  })
  images: ProductImage[];

  @Prop({
    required: [true, 'Please Enter Product Category'],
  })
  category: string;

  @Prop({
    required: [true, 'Please Enter product Stock'],
    max: [9999, 'Stock cannot exceed 4 digits'],
    default: 1,
  })
  stock: number;

  @Prop({
    default: 0,
  })
  numOfReviews: number;

  @Prop({
    type: [ReviewSchema],
    default: [],
  })
  reviews: Review[];

  @Prop({
    required: true,
  })
  user: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
