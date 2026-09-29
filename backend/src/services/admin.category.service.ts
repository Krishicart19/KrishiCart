import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';

const categoryRepository = () => AppDataSource.getRepository(Category);

export interface CreateCategoryData {
  id: string;
  name: string;
  icon?: string;
}

export const AdminCategoryService = {
  async findAll() {
    return categoryRepository().find({ order: { name: 'ASC' } });
  },

  async findById(id: string): Promise<Category | null> {
    return categoryRepository().findOne({
      where: { id },
      relations: ['products'],
    });
  },

  async create(data: CreateCategoryData): Promise<Category> {
    const repo = categoryRepository();

    const existing = await repo.findOne({ where: { id: data.id } });
    if (existing) {
      throw new Error('Category ID already exists');
    }

    const category = repo.create(data);
    return repo.save(category);
  },

  async update(id: string, data: Partial<CreateCategoryData>): Promise<Category | null> {
    const repo = categoryRepository();

    const category = await repo.findOne({ where: { id } });
    if (!category) return null;

    if (data.name) category.name = data.name;
    if (data.icon !== undefined) category.icon = data.icon;

    return repo.save(category);
  },

  async delete(id: string): Promise<boolean> {
    const productCount = await AppDataSource.getRepository('Product')
      .count({ where: { categoryId: id } });

    if (productCount > 0) {
      throw new Error(`Cannot delete category with ${productCount} products. Move or delete products first.`);
    }

    const result = await categoryRepository().delete(id);
    return (result.affected ?? 0) > 0;
  },

  async getStats() {
    const repo = categoryRepository();
    const totalCategories = await repo.count();

    const categoriesWithProducts = await repo.createQueryBuilder('c')
      .leftJoin('c.products', 'p')
      .select('c.id', 'id')
      .addSelect('c.name', 'name')
      .addSelect('c.icon', 'icon')
      .addSelect('COUNT(p.id)', 'productCount')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.icon')
      .orderBy('COUNT(p.id)', 'DESC')
      .getRawMany();

    return { totalCategories, categoriesWithProducts };
  },
};
