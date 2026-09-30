import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PhotoIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { adminApi } from '../api/adminApi';
import type { Category, ProductImage } from '../api/adminApi';

type VariantGroup = {
  name: string;
  options: string[];
};

export function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    categoryId: '',
    name: '',
    unit: '',
    price: '',
    rating: '',
    color: '#FFFFFF',
    description: '',
    stock: '0',
    discount: '0',
    imageUrl: '',
  });

  const [variants, setVariants] = useState<VariantGroup[]>([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [newOptionInputs, setNewOptionInputs] = useState<Record<number, string>>({});

  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);

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
            color: product.color || '#FFFFFF',
            description: product.description || '',
            stock: String(product.stock || 0),
            discount: String(product.discount || 0),
            imageUrl: product.imageUrl || '',
          });
          if (product.imageUrl) {
            setMainImagePreview(product.imageUrl);
          }
          if (product.images) {
            setExistingImages(product.images);
          }
          if (product.variants) {
            try {
              const parsed = JSON.parse(product.variants);
              const variantGroups: VariantGroup[] = Object.entries(parsed).map(([name, options]) => ({
                name,
                options: options as string[],
              }));
              setVariants(variantGroups);
            } catch {
              setVariants([]);
            }
          }
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

  const handleMainImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImages((prev) => [...prev, { file, preview: reader.result as string }]);
        };
        reader.readAsDataURL(file);
      });
    }
    if (additionalFileInputRef.current) {
      additionalFileInputRef.current.value = '';
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: number) => {
    try {
      await adminApi.deleteProductImage(imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError('Failed to delete image');
    }
  };

  const addVariantGroup = () => {
    if (newVariantName.trim()) {
      setVariants([...variants, { name: newVariantName.trim(), options: [] }]);
      setNewVariantName('');
    }
  };

  const removeVariantGroup = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addOption = (groupIndex: number) => {
    const optionValue = newOptionInputs[groupIndex]?.trim();
    if (optionValue) {
      const newVariants = [...variants];
      newVariants[groupIndex].options.push(optionValue);
      setVariants(newVariants);
      setNewOptionInputs({ ...newOptionInputs, [groupIndex]: '' });
    }
  };

  const removeOption = (groupIndex: number, optionIndex: number) => {
    const newVariants = [...variants];
    newVariants[groupIndex].options = newVariants[groupIndex].options.filter((_, i) => i !== optionIndex);
    setVariants(newVariants);
  };

  const getVariantsJson = (): string | null => {
    if (variants.length === 0) return null;
    const obj: Record<string, string[]> = {};
    variants.forEach((v) => {
      if (v.options.length > 0) {
        obj[v.name] = v.options;
      }
    });
    return Object.keys(obj).length > 0 ? JSON.stringify(obj) : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      let imageUrl = formData.imageUrl;
      const productId = isEdit ? id! : formData.id;
      const variantsJson = getVariantsJson();

      if (!isEdit) {
        const productData = {
          id: formData.id,
          categoryId: formData.categoryId,
          name: formData.name,
          unit: formData.unit,
          price: parseFloat(formData.price),
          rating: formData.rating ? parseFloat(formData.rating) : undefined,
          color: formData.color,
          description: formData.description,
          stock: parseInt(formData.stock),
          discount: parseInt(formData.discount),
          variants: variantsJson,
        };
        await adminApi.createProduct(productData);
      }

      if (mainImageFile) {
        setUploading(true);
        const uploadResult = await adminApi.uploadProductImage(productId, mainImageFile, true);
        imageUrl = uploadResult.image.imageUrl;
      }

      for (const { file } of newImages) {
        setUploading(true);
        await adminApi.uploadProductImage(productId, file, false);
      }

      const productData = {
        categoryId: formData.categoryId,
        name: formData.name,
        unit: formData.unit,
        price: parseFloat(formData.price),
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
        color: formData.color,
        description: formData.description,
        stock: parseInt(formData.stock),
        discount: parseInt(formData.discount),
        imageUrl,
        variants: variantsJson,
      };

      await adminApi.updateProduct(productId, productData);
      navigate('/products');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
      setUploading(false);
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

      <form onSubmit={handleSubmit} className="card max-w-3xl">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Main Product Image</label>
          <div className="flex items-start gap-4">
            <div
              className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#173B2B] transition-colors bg-white"
              onClick={() => fileInputRef.current?.click()}
            >
              {mainImagePreview ? (
                <img src={mainImagePreview} alt="Preview" className="w-full h-full object-contain" />
              ) : (
                <PhotoIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleMainImageSelect}
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-sm"
              >
                {mainImagePreview ? 'Change Main Image' : 'Upload Main Image'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                This will be the primary image shown in product listings.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images</label>
          <div className="flex flex-wrap gap-3">
            {existingImages.filter(img => img.imageUrl !== formData.imageUrl).map((img) => (
              <div key={img.id} className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            {newImages.map((img, index) => (
              <div key={index} className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
                <span className="absolute bottom-1 left-1 text-xs bg-green-500 text-white px-1 rounded">New</span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => additionalFileInputRef.current?.click()}
              className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#173B2B] hover:text-[#173B2B] transition-colors"
            >
              <PlusIcon className="w-8 h-8" />
              <span className="text-xs mt-1">Add More</span>
            </button>
            <input
              type="file"
              ref={additionalFileInputRef}
              onChange={handleAdditionalImagesSelect}
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Add multiple images for the product gallery. JPG, PNG, GIF or WEBP.
          </p>
        </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rs) *</label>
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

        {/* Product Variants Section */}
        <div className="mt-6 pt-6 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Product Variants (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add variant types like Size, Colour, Thickness, etc. with their options.
          </p>

          {/* Existing variant groups */}
          {variants.map((variant, groupIndex) => (
            <div key={groupIndex} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-800">{variant.name}</span>
                <button
                  type="button"
                  onClick={() => removeVariantGroup(groupIndex)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-2 mb-3">
                {variant.options.map((option, optionIndex) => (
                  <span
                    key={optionIndex}
                    className="inline-flex items-center gap-1 bg-white border border-gray-300 rounded-full px-3 py-1 text-sm"
                  >
                    {option}
                    <button
                      type="button"
                      onClick={() => removeOption(groupIndex, optionIndex)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add option input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOptionInputs[groupIndex] || ''}
                  onChange={(e) => setNewOptionInputs({ ...newOptionInputs, [groupIndex]: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption(groupIndex))}
                  placeholder={`Add ${variant.name} option...`}
                  className="input-field flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => addOption(groupIndex)}
                  className="btn-secondary text-sm px-3"
                >
                  Add
                </button>
              </div>
            </div>
          ))}

          {/* Add new variant group */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newVariantName}
              onChange={(e) => setNewVariantName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariantGroup())}
              placeholder="Enter variant type (e.g., Coil Size, Colour, Thickness)"
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={addVariantGroup}
              className="btn-secondary whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4 inline mr-1" />
              Add Variant Type
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t">
          <button type="submit" className="btn-primary" disabled={saving || uploading}>
            {uploading ? 'Uploading Images...' : saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <Link to="/products" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
