import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CubeIcon, TagIcon, UsersIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { adminApi } from '../api/adminApi';
import type { DashboardStats } from '../api/adminApi';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#173B2B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Products',
      value: stats?.products.totalProducts || 0,
      icon: CubeIcon,
      color: 'bg-blue-500',
      link: '/products',
    },
    {
      name: 'Categories',
      value: stats?.categories || 0,
      icon: TagIcon,
      color: 'bg-green-500',
      link: '/categories',
    },
    {
      name: 'Registered Users',
      value: stats?.users || 0,
      icon: UsersIcon,
      color: 'bg-purple-500',
      link: null,
    },
    {
      name: 'Low Stock Items',
      value: stats?.products.lowStock || 0,
      icon: ExclamationTriangleIcon,
      color: stats?.products.lowStock ? 'bg-orange-500' : 'bg-gray-400',
      link: '/products?filter=low-stock',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to KrishiCart Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            {stat.link && (
              <Link
                to={stat.link}
                className="mt-4 text-sm text-[#173B2B] hover:underline block"
              >
                View all →
              </Link>
            )}
          </div>
        ))}
      </div>

      {stats?.products.outOfStock ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            <div>
              <p className="font-medium text-red-800">
                {stats.products.outOfStock} products are out of stock
              </p>
              <Link to="/products?filter=out-of-stock" className="text-sm text-red-600 hover:underline">
                View and restock →
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              to="/products/new"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <CubeIcon className="w-5 h-5 text-[#173B2B]" />
              <span className="text-gray-700">Add New Product</span>
            </Link>
            <Link
              to="/categories/new"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <TagIcon className="w-5 h-5 text-[#173B2B]" />
              <span className="text-gray-700">Add New Category</span>
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">API Status</span>
              <span className="text-green-600 font-medium">● Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Database</span>
              <span className="text-gray-900">PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Version</span>
              <span className="text-gray-900">1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
