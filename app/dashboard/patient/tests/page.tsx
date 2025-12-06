// frontend/app/dashboard/patient/tests/page.tsx

'use client';

import { useAuth } from '@/app/providers/AuthProvider';
import { useRoleProtection } from '@/lib/useRoleProtection';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  TestTube,
  Download,
  Eye,
  Clock,
  CheckCircle,
  DollarSign,
  Calendar,
  FileText,
  User,
  Building2,
  Loader2,
  Filter,
  Search,
  X,
  AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';

export default function PatientTestResultsPage() {
  const { user } = useAuth();
  const { isAuthorized, isChecking } = useRoleProtection(['patient']);
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'ready' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Fetch patient's test orders
  const { data: testOrders = [], isLoading } = useQuery({
    queryKey: ['patientTestOrders', user?._id],
    queryFn: async () => {
      const res = await api.getPatientTestOrders(user!._id);
      return res.data;
    },
    enabled: isAuthorized && !!user?._id,
  });

  // Filter orders
  const filteredOrders = testOrders.filter((order: any) => {
    // Status filter
    if (filterStatus === 'pending' && order.paymentStatus !== 'pending') return false;
    if (filterStatus === 'ready' && order.status !== 'ready_for_test') return false;
    if (filterStatus === 'completed' && order.status !== 'completed') return false;

    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        order.testType.toLowerCase().includes(search) ||
        order.testName.toLowerCase().includes(search) ||
        order.departmentId.name.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Stats
  const stats = [
    {
      label: 'Total Orders',
      value: testOrders.length,
      icon: TestTube,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Pending Payment',
      value: testOrders.filter((o: any) => o.paymentStatus === 'pending').length,
      icon: Clock,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      label: 'In Progress',
      value: testOrders.filter((o: any) => o.status === 'ready_for_test' || o.status === 'in_progress').length,
      icon: TestTube,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Completed',
      value: testOrders.filter((o: any) => o.status === 'completed').length,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
    },
  ];

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Test Results
          </h1>
          <p className="text-gray-600">View and download your test results</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 bg-gradient-to-br ${stat.color} rounded-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by test type or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'ready', label: 'In Progress' },
                { id: 'completed', label: 'Completed' },
              ].map((filter: any) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterStatus === filter.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Test Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center"
          >
            <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || filterStatus !== 'all' ? 'No matching results' : 'No test orders yet'}
            </h3>
            <p className="text-gray-600">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Your doctor will order tests for you when needed'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order: any, index: number) => (
              <TestOrderCard
                key={order._id}
                order={order}
                index={index}
                onViewDetails={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <TestOrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Test Order Card Component
function TestOrderCard({
  order,
  index,
  onViewDetails,
}: {
  order: any;
  index: number;
  onViewDetails: () => void;
}) {
  const statusColors = {
    payment_pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    ready_for_test: 'bg-blue-100 text-blue-700 border-blue-300',
    in_progress: 'bg-purple-100 text-purple-700 border-purple-300',
    completed: 'bg-green-100 text-green-700 border-green-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300',
  };

  const paymentColors = {
    pending: 'bg-orange-100 text-orange-700',
    paid: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.01 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <TestTube className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{order.testType}</h3>
            <p className="text-sm text-gray-600 mb-2">{order.testName}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {order.departmentId.name}
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                Dr. {order.orderedBy.firstName} {order.orderedBy.lastName}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(order.orderedDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 mb-2">${order.paymentAmount}</p>
          <div className="flex flex-col gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                paymentColors[order.paymentStatus as keyof typeof paymentColors]
              }`}
            >
              {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
            </span>
          </div>
        </div>
      </div>

      {order.testDescription && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{order.testDescription}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span
          className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${
            statusColors[order.status as keyof typeof statusColors]
          }`}
        >
          {order.status.replace(/_/g, ' ').toUpperCase()}
        </span>

        <div className="flex items-center gap-2">
          {order.status === 'completed' && order.resultFileUrl && (
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${order.resultFileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Result
            </motion.a>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Detail Modal Component
function TestOrderDetailModal({ order, onClose }: { order: any; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <TestTube className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{order.testType}</h2>
              <p className="text-sm text-gray-600">{order.testName}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>

        {/* Order Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(order.orderedDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-semibold text-gray-900">{order.departmentId.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ordered By</p>
              <p className="font-semibold text-gray-900">
                Dr. {order.orderedBy.firstName} {order.orderedBy.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-semibold text-gray-900">${order.paymentAmount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Status</p>
              <p className="font-semibold text-gray-900 capitalize">{order.paymentStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Test Status</p>
              <p className="font-semibold text-gray-900">
                {order.status.replace(/_/g, ' ').toUpperCase()}
              </p>
            </div>
          </div>

          {order.testDescription && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 p-4 bg-gray-50 rounded-xl">{order.testDescription}</p>
            </div>
          )}

          {order.status === 'completed' && order.resultNotes && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Result Notes</h3>
              <p className="text-gray-700 p-4 bg-green-50 rounded-xl border border-green-200">
                {order.resultNotes}
              </p>
            </div>
          )}

          {order.status === 'completed' && order.resultFileUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Result Available</h3>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Your test results are ready. Click below to download the report.
              </p>
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${order.resultFileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Download className="w-5 h-5" />
                Download Test Result
              </motion.a>
            </div>
          )}

          {order.status === 'payment_pending' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Payment Required</h3>
                  <p className="text-sm text-yellow-700">
                    Please complete payment to proceed with the test.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}