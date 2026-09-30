import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { ProductImage } from '../entities/ProductImage';

const productRepository = () => AppDataSource.getRepository(Product);
const imageRepository = () => AppDataSource.getRepository(ProductImage);

export interface CreateProductData {
  id: string;
  categoryId: string;
  name: string;
  unit?: string;
  price: number;
  rating?: number;
  emoji?: string;
  color?: string;
  description?: string;
  stock?: number;
  discount?: number;
  imageUrl?: string;
  variants?: string;
}

export const AdminProductService = {
  async findAll(options?: { categoryId?: string; search?: string; page?: number; limit?: number }) {
    const repo = productRepository();
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const query = repo.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.name', 'ASC');

    if (options?.categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId: options.categoryId });
    }

    if (options?.search) {
      query.andWhere('(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))',
        { search: `%${options.search}%` });
    }

    const [products, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: string): Promise<Product | null> {
    const product = await productRepository().findOne({
      where: { id },
      relations: ['category'],
    });

    if (product) {
      const images = await imageRepository().find({
        where: { productId: id },
        order: { sortOrder: 'ASC' },
      });
      (product as any).images = images;
    }

    return product;
  },

  async create(data: CreateProductData): Promise<Product> {
    const repo = productRepository();

    const existing = await repo.findOne({ where: { id: data.id } });
    if (existing) {
      throw new Error('Product ID already exists');
    }

    const product = repo.create(data);
    return repo.save(product);
  },

  async update(id: string, data: Partial<CreateProductData>): Promise<Product | null> {
    const repo = productRepository();

    const product = await repo.findOne({ where: { id } });
    if (!product) return null;

    Object.assign(product, data);
    return repo.save(product);
  },

  async delete(id: string): Promise<boolean> {
    const result = await productRepository().delete(id);
    return (result.affected ?? 0) > 0;
  },

  async addImage(productId: string, imageUrl: string, isPrimary: boolean = false): Promise<ProductImage> {
    const repo = imageRepository();

    if (isPrimary) {
      await repo.update({ productId }, { isPrimary: false });
    }

    const maxOrder = await repo.createQueryBuilder('img')
      .select('MAX(img.sortOrder)', 'max')
      .where('img.productId = :productId', { productId })
      .getRawOne();

    const image = repo.create({
      productId,
      imageUrl,
      isPrimary,
      sortOrder: (maxOrder?.max || 0) + 1,
    });

    return repo.save(image);
  },

  async removeImage(imageId: number): Promise<boolean> {
    const result = await imageRepository().delete(imageId);
    return (result.affected ?? 0) > 0;
  },

  async getStats() {
    const repo = productRepository();

    const totalProducts = await repo.count();
    const lowStock = await repo.createQueryBuilder('p')
      .where('p.stock < :threshold', { threshold: 10 })
      .getCount();
    const outOfStock = await repo.createQueryBuilder('p')
      .where('p.stock = 0')
      .getCount();

    return { totalProducts, lowStock, outOfStock };
  },

  async updateStock(id: string, stock: number): Promise<Product | null> {
    const repo = productRepository();
    await repo.update(id, { stock });
    return repo.findOne({ where: { id } });
  },
};
