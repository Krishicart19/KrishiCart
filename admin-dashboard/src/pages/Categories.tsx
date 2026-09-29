import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { adminApi } from '../api/adminApi';
import type { Category } from '../api/adminApi';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getCategories(),
      adminApi.getCategoryStats(),
    ])
      .then(([cats, statsData]) => {
        setCategories(cats);
        setStats(statsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    const productCount = stats?.categoriesWithProducts?.find((c: any) => c.id === id)?.productCount || 0;

    if (productCount > 0) {
      alert(`Cannot delete category with ${productCount} products. Move or delete products first.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await adminApi.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete category');
    }
  };

  const getProductCount = (categoryId: string) => {
    return stats?.categoriesWithProducts?.find((c: any) => c.id === categoryId)?.productCount || 0;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500">Organize your products into categories</p>
        </div>
        <Link to="/categories/new" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Category
        </Link>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-[#173B2B] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories found</p>
            <Link to="/categories/new" className="text-[#173B2B] hover:underline mt-2 inline-block">
              Add your first category
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border border-gray-200 rounded-xl p-4 hover:border-[#173B2B] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                      {category.icon || '📦'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        {getProductCount(category.id)} products
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/categories/${category.id}/edit`}
                      className="p-2 text-gray-400 hover:text-[#173B2B] hover:bg-gray-100 rounded-lg"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      disabled={getProductCount(category.id) > 0}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">ID: {category.id}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
