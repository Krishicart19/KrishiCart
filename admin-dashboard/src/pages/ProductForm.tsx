import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { adminApi } from '../api/adminApi';
import type { Category } from '../api/adminApi';

export function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    categoryId: '',
    name: '',
    unit: '',
    price: '',
    rating: '',
    emoji: '',
    color: '#E8F3E0',
    description: '',
    stock: '0',
    discount: '0',
  });

  useEffect(() => {
    adminApi.getCategories().then(setCategories);

    if (isEdit && id) {
      setLoading(true);
      adminApi.getProduct(id)
        .then((product) => {
          setFormData({
            id: product.id,
            categoryId: product.categoryId,
            name: product.name,
            unit: product.unit || '',
            price: String(product.price),
            rating: String(product.rating || ''),
            emoji: product.emoji || '',
            color: product.color || '#E8F3E0',
            description: product.description || '',
            stock: String(product.stock || 0),
            discount: String(product.discount || 0),
          });
        })
        .catch(() => setError('Product not found'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateId = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      id: isEdit ? formData.id : generateId(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const productData = {
        id: formData.id,
        categoryId: formData.categoryId,
        name: formData.name,
        unit: formData.unit,
        price: parseFloat(formData.price),
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
        emoji: formData.emoji,
        color: formData.color,
        description: formData.description,
        stock: parseInt(formData.stock),
        discount: parseInt(formData.discount),
      };

      if (isEdit && id) {
        await adminApi.updateProduct(id, productData);
      } else {
        await adminApi.createProduct(productData);
      }

      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#173B2B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/products" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleNameChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product ID *</label>
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              className="input-field"
              required
              disabled={isEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="input-field"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., 1 kg, Pack of 10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className="input-field"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
            <input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleChange}
              className="input-field"
              min="0"
              max="100"
              placeholder="0-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-5)</label>
            <input
              type="number"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              className="input-field"
              step="0.1"
              min="0"
              max="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
            <input
              type="text"
              name="emoji"
              value={formData.emoji}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., 🍅"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={handleChange}
                name="color"
                className="input-field flex-1"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              rows={3}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <Link to="/products" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
