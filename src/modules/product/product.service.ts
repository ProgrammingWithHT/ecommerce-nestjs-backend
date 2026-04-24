import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { DeleteReviewDto } from './dto/delete-review.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from './product.repository';
import { ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async getAllProducts() {
    const products = await this.productRepository.getAllProduct();

    return {
      success: true,
      count: products.length,
      products,
    };
  }

  async getAdminProducts() {
    const products = await this.productRepository.getAdminProducts();

    return {
      success: true,
      count: products.length,
      products,
    };
  }

  async getProductDetails(productId: string) {
    const product = await this.findExistingProduct(productId);

    return {
      success: true,
      product,
    };
  }

  async createProduct(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[] = [],
    userId: string,
  ) {
    const images = await this.uploadImages(files);
    const product = await this.productRepository.createProduct({
      ...createProductDto,
      user: userId,
      images,
    });

    return {
      success: true,
      message: 'Product created successfully',
      product,
    };
  }

  async updateProduct(
    productId: string,
    updateProductDto: UpdateProductDto,
    files: Express.Multer.File[] = [],
  ) {
    const existingProduct = await this.findExistingProduct(productId);
    const images = files.length
      ? await this.uploadImages(files)
      : existingProduct.images;

    const product = await this.productRepository.updateProduct(productId, {
      ...updateProductDto,
      images,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      success: true,
      message: 'Product updated successfully',
      product,
    };
  }

  async deleteProduct(productId: string) {
    const product = await this.productRepository.deleteProduct(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  async createProductReview(
    createProductReviewDto: CreateProductReviewDto,
    user: { id: string; name: string },
  ) {
    const product = await this.findExistingProduct(createProductReviewDto.productId);
    const existingReview = product.reviews.find(
      (review) => review.user.toString() === user.id,
    );

    if (existingReview) {
      existingReview.name = user.name;
      existingReview.rating = createProductReviewDto.rating;
      existingReview.comment = createProductReviewDto.comment;
    } else {
      product.reviews.push({
        user: new Types.ObjectId(user.id),
        name: user.name,
        rating: createProductReviewDto.rating,
        comment: createProductReviewDto.comment,
      });
    }

    product.numOfReviews = product.reviews.length;
    product.ratings = this.calculateAverageRating(product);
    await this.productRepository.save(product);

    return {
      success: true,
      message: 'Review saved successfully',
    };
  }

  async getProductReviews(productId: string) {
    const product = await this.findExistingProduct(productId);

    return {
      success: true,
      reviews: product.reviews,
    };
  }

  async deleteReview(deleteReviewDto: DeleteReviewDto) {
    const product = await this.findExistingProduct(deleteReviewDto.productId);
    const reviews = product.reviews.filter(
      (review) => review._id?.toString() !== deleteReviewDto.reviewId,
    );

    if (reviews.length === product.reviews.length) {
      throw new NotFoundException('Review not found');
    }

    product.reviews = reviews;
    product.numOfReviews = reviews.length;
    product.ratings = reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    await this.productRepository.save(product);

    return {
      success: true,
      message: 'Review deleted successfully',
    };
  }

  private async findExistingProduct(productId: string) {
    const product = await this.productRepository.getProductById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async decreaseStock(productId: string, quantity: number) {
    // console.log("runnig decrease stock")
    const product = await this.productRepository.decreaseStock(productId);

    if (!product) throw new NotFoundException('Product not found');

    product.stock -= quantity;

    await product.save();
  }

  private async uploadImages(files: Express.Multer.File[]) {
    const images: Array<{ public_id: string; url: string }> = [];

    for (const file of files) {
      const result = await this.cloudinaryService.uploadImage(file, 'products');

      images.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    return images;
  }

  private calculateAverageRating(product: ProductDocument) {
    if (!product.reviews.length) {
      return 0;
    }

    const totalRating = product.reviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    );

    return totalRating / product.reviews.length;
  }

}
