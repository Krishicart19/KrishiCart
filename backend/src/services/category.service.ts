import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';

const categoryRepository = () => AppDataSource.getRepository(Category);

export const CategoryService = {
  async findAll(): Promise<Category[]> {
    return categoryRepository().find({ order: { name: 'ASC' } });
  },

  async findById(id: string): Promise<Category | null> {
    return categoryRepository().findOne({ where: { id } });
  },

  async create(data: Partial<Category>): Promise<Category> {
    const category = categoryRepository().create(data);
    return categoryRepository().save(category);
  },

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    await categoryRepository().update(id, data);
    return this.findById(id);
  },

  async delete(id: string): Promise<boolean> {
    const result = await categoryRepository().delete(id);
    return (result.affected ?? 0) > 0;
  },
};
