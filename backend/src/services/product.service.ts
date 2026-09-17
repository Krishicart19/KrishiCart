import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';

const productRepository = () => AppDataSource.getRepository(Product);

export const ProductService = {
  async findAll(categoryId?: string): Promise<Product[]> {
    const repo = productRepository();
    if (categoryId && categoryId !== 'all') {
      return repo.find({
        where: { categoryId },
        order: { name: 'ASC' }
      });
    }
    return repo.find({ order: { name: 'ASC' } });
  },

  async findById(id: string): Promise<Product | null> {
    return productRepository().findOne({ where: { id } });
  },

  async search(query: string): Promise<Product[]> {
    return productRepository()
      .createQueryBuilder('product')
      .where('LOWER(product.name) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(product.description) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('product.name', 'ASC')
      .getMany();
  },

  async create(data: Partial<Product>): Promise<Product> {
    const product = productRepository().create(data);
    return productRepository().save(product);
  },

  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    await productRepository().update(id, data);
    return this.findById(id);
  },

  async delete(id: string): Promise<boolean> {
    const result = await productRepository().delete(id);
    return (result.affected ?? 0) > 0;
  },
};
