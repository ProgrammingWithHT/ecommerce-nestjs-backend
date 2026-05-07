import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../../../shared/auth/authenticated-user.interface';
import { CloudinaryService } from '../../../../shared/cloudinary/cloudinary.service';
import { CreateProductReviewDto } from '../../../../shared/contracts/products/create-product-review.dto';
import { CreateProductDto } from '../../../../shared/contracts/products/create-product.dto';
import { DecreaseStockDto } from '../../../../shared/contracts/products/decrease-stock.dto';
import { DeleteReviewDto } from '../../../../shared/contracts/products/delete-review.dto';
import { SerializedFileDto } from '../../../../shared/contracts/files/serialized-file.dto';
import { UpdateProductDto } from '../../../../shared/contracts/products/update-product.dto';
import { ProductDocument } from './schemas/product.schema';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async getAllProducts() {
    const products = await this.productsRepository.getAllProducts();

    return {
      success: true,
      count: products.length,
      products,
    };
  }

  async getAdminProducts() {
    const products = await this.productsRepository.getAdminProducts();

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
    files: SerializedFileDto[] = [],
    userId: string,
  ) {
    const images = await this.uploadImages(files);
    const product = await this.productsRepository.createProduct({
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
    files: SerializedFileDto[] = [],
  ) {
    const existingProduct = await this.findExistingProduct(productId);
    const images = files.length
      ? await this.uploadImages(files)
      : existingProduct.images;

    const product = await this.productsRepository.updateProduct(productId, {
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
    const product = await this.productsRepository.deleteProduct(productId);

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
    if (createProductReviewDto.rating < 0 || createProductReviewDto.rating > 5) {
      throw new BadRequestException('Rating must be between 0 and 5');
    }

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
        user: user.id,
        name: user.name,
        rating: createProductReviewDto.rating,
        comment: createProductReviewDto.comment,
      });
    }

    product.numOfReviews = product.reviews.length;
    product.ratings = this.calculateAverageRating(product);
    await this.productsRepository.save(product);

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

    await this.productsRepository.save(product);

    return {
      success: true,
      message: 'Review deleted successfully',
    };
  }

  async handleOrderCancelled(data: DecreaseStockDto) {
    // try {
    //   await this.increaseStock(data);
    // } catch (err) {
    //   console.error('Failed to restore stock', err);
    // }


    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 sec

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.increaseStock(data);

        console.log(`Stock updated (attempt ${attempt})`);
        return;
      } catch (err) {
        console.error(`Attempt ${attempt} failed`, err);

        if (attempt === MAX_RETRIES) {
          console.error('FINAL FAILURE: Stock update failed permanently');
          // later: emit failure event here
          return;
        }

        // wait before retry
        await new Promise((res) => setTimeout(res, RETRY_DELAY));
      }
    }

  }

  async increaseStock(decreaseStockDto: DecreaseStockDto) {
    const products = await Promise.all(
      decreaseStockDto.items.map((item) =>
        this.productsRepository.getProductById(item.productId),
      ),
    );

    await Promise.all(
      products.map((product, index) => {
        if (!product) return;

        product.stock += decreaseStockDto.items[index].quantity;
        return this.productsRepository.save(product);
      }),
    );

    return {
      success: true,
      message: 'Stock restored successfully',
    };
  }

  async handleOrderCreated(data: DecreaseStockDto) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 sec

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.decreaseStock(data);

        console.log(`Stock updated (attempt ${attempt})`);
        return;
      } catch (err) {
        console.error(`Attempt ${attempt} failed`, err);

        if (attempt === MAX_RETRIES) {
          console.error('FINAL FAILURE: Stock update failed permanently');
          // later: emit failure event here
          return;
        }

        // wait before retry
        await new Promise((res) => setTimeout(res, RETRY_DELAY));
      }
    }
  }

  async decreaseStock(decreaseStockDto: DecreaseStockDto) {
    const loadedProducts = await Promise.all(
      decreaseStockDto.items.map((item) =>
        this.productsRepository.getProductById(item.productId),
      ),
    );

    decreaseStockDto.items.forEach((item, index) => {
      const product = loadedProducts[index];

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}`,
        );
      }
    });

    await Promise.all(
      loadedProducts.map((product, index) => {
        if (!product) {
          return Promise.resolve(product);
        }

        product.stock -= decreaseStockDto.items[index].quantity;
        return this.productsRepository.save(product);
      }),
    );

    return {
      success: true,
      message: 'Stock updated successfully',
    };
  }

  private async findExistingProduct(productId: string) {
    const product = await this.productsRepository.getProductById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private async uploadImages(files: SerializedFileDto[]) {
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
