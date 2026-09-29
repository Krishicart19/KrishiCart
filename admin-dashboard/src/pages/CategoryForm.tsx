import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { adminApi } from '../api/adminApi';

const commonEmojis = ['🌾', '🚜', '🌱', '🌿', '💧', '⚙️', '🛠️', '🏗️', '🧱', '🎨', '🛡️', '🪵', '📎', '🔩', '🧰', '🛏️', '🔒', '⚡', '🔌', '💡', '🚿', '🚰', '🧯', '🛁', '🪑'];

export function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    icon: '📦',
  });

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      adminApi.getCategory(id)
        .then((category) => {
          setFormData({
            id: category.id,
            name: category.name,
            icon: category.icon || '📦',
          });
        })
        .catch(() => setError('Category not found'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (isEdit && id) {
        await adminApi.updateCategory(id, {
          name: formData.name,
          icon: formData.icon,
        });
      } else {
        await adminApi.createCategory(formData);
      }

      navigate('/categories');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save category');
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
        <Link to="/categories" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Categories
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Category' : 'Add New Category'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-lg">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Category ID *</label>
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              className="input-field"
              required
              disabled={isEdit}
            />
            <p className="text-xs text-gray-500 mt-1">Used in URLs and API. Cannot be changed after creation.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-3xl">
                {formData.icon}
              </div>
              <input
                type="text"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                className="input-field w-20 text-center text-xl"
                maxLength={4}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className={`w-10 h-10 rounded-lg text-xl hover:bg-gray-100 transition-colors ${
                    formData.icon === emoji ? 'bg-[#173B2B] text-white' : 'bg-gray-50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
          </button>
          <Link to="/categories" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
