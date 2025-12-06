// frontend/app/dashboard/department/page.tsx




// frontend/app/dashboard/department/page.tsx

'use client';

import { useAuth } from '@/app/providers/AuthProvider';
import { useRoleProtection } from '@/lib/useRoleProtection';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  TestTube,
  Upload,
  CheckCircle,
  Clock,
  FileText,
  User,
  Calendar,
  DollarSign,
  Loader2,
  X,
  Building2,
  Eye,
  LogOut,
  Filter,
  Search,
} from 'lucide-react';
import api from '@/lib/api';

export default function DepartmentStaffDashboard() {
  const { user, logout } = useAuth();
  const { isAuthorized, isChecking } = useRoleProtection(['department_staff']);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'pending' | 'ready' | 'completed'>('ready');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch pending payment orders
  const { data: pendingOrders = [], isLoading: loadingPending } = useQuery({
    queryKey: ['departmentPendingTests'],
    queryFn: async () => {
      const res = await api.getDepartmentPendingTests();
      return res.data;
    },
    enabled: isAuthorized && activeTab === 'pending',
  });

  // Fetch ready for test orders (payment confirmed)
  const { data: readyOrders = [], isLoading: loadingReady } = useQuery({
    queryKey: ['departmentReadyTests'],
    queryFn: async () => {
      const res = await api.getDepartmentReadyTests();
      return res.data;
    },
    enabled: isAuthorized && activeTab === 'ready',
  });

  // Fetch completed orders
  const { data: completedOrders = [], isLoading: loadingCompleted } = useQuery({
    queryKey: ['departmentCompletedTests'],
    queryFn: async () => {
      const res = await api.getDepartmentCompletedTests();
      return res.data;
    },
    enabled: isAuthorized && activeTab === 'completed',
  });

  // Get active orders based on tab
  const getActiveOrders = () => {
    switch (activeTab) {
      case 'pending':
        return pendingOrders;
      case 'ready':
        return readyOrders;
      case 'completed':
        return completedOrders;
      default:
        return [];
    }
  };

  const activeOrders = getActiveOrders();
  const isLoading = loadingPending || loadingReady || loadingCompleted;

  // Filter orders by search
  const filteredOrders = activeOrders.filter((order: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.testType.toLowerCase().includes(searchLower) ||
      `${order.patientId.firstName} ${order.patientId.lastName}`.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const stats = [
    {
      label: 'Pending Payment',
      value: pendingOrders.length,
      icon: Clock,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Ready for Test',
      value: readyOrders.length,
      icon: TestTube,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Completed',
      value: completedOrders.length,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <TestTube className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Department Dashboard
                </h1>
                <p className="text-sm text-gray-600">{user?.departmentId?.name} - Test Results Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600">{user?.departmentRole}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-gray-700" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200 flex">
            {[
              { id: 'pending', label: 'Pending Payment', badge: pendingOrders.length },
              { id: 'ready', label: 'Ready for Test', badge: readyOrders.length },
              { id: 'completed', label: 'Completed', badge: completedOrders.length },
            ].map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all relative ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.badge}
                </span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by test type or patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Orders List */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No matching orders' : 'No orders yet'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery ? 'Try a different search term' : 'Orders will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order: any, index: number) => (
                  <TestOrderCard
                    key={order._id}
                    order={order}
                    index={index}
                    activeTab={activeTab}
                    onUpload={() => {
                      setSelectedOrder(order);
                      setShowUploadModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && selectedOrder && (
          <UploadResultModal
            order={selectedOrder}
            onClose={() => {
              setShowUploadModal(false);
              setSelectedOrder(null);
            }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['departmentReadyTests'] });
              queryClient.invalidateQueries({ queryKey: ['departmentCompletedTests'] });
              setShowUploadModal(false);
              setSelectedOrder(null);
            }}
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
  activeTab,
  onUpload,
}: {
  order: any;
  index: number;
  activeTab: string;
  onUpload: () => void;
}) {
  const statusColors = {
    payment_pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    ready_for_test: 'bg-blue-100 text-blue-700 border-blue-300',
    in_progress: 'bg-purple-100 text-purple-700 border-purple-300',
    completed: 'bg-green-100 text-green-700 border-green-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.01 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-2xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <TestTube className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{order.testType}</h3>
            <p className="text-sm text-gray-600 mb-2">
              Patient: {order.patientId.firstName} {order.patientId.lastName}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
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
          <span
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${
              statusColors[order.status as keyof typeof statusColors]
            }`}
          >
            {order.status.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {order.testDescription && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{order.testDescription}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              order.urgency === 'emergency'
                ? 'bg-red-100 text-red-700'
                : order.urgency === 'urgent'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {order.urgency.toUpperCase()}
          </span>
        </div>

        {activeTab === 'ready' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUpload}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Result
          </motion.button>
        )}

        {activeTab === 'completed' && order.resultFileUrl && (
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={order.resultFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Result
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}

// Upload Result Modal Component
function UploadResultModal({
  order,
  onClose,
  onSuccess,
}: {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resultNotes, setResultNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      // Upload file
      await api.uploadTestResultFile(order._id, selectedFile, resultNotes);

      onSuccess();
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

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
        className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Upload className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Upload Test Result</h2>
              <p className="text-sm text-gray-600">{order.testType}</p>
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
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Patient</p>
              <p className="font-semibold text-gray-900">
                {order.patientId.firstName} {order.patientId.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ordered By</p>
              <p className="font-semibold text-gray-900">
                Dr. {order.orderedBy.firstName} {order.orderedBy.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Test Type</p>
              <p className="font-semibold text-gray-900">{order.testType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(order.orderedDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Result File (PDF, JPG, PNG) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            {selectedFile && (
              <p className="mt-2 text-sm text-green-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Result Notes</label>
            <textarea
              value={resultNotes}
              onChange={(e) => setResultNotes(e.target.value)}
              rows={4}
              placeholder="Add any additional notes about the test results..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            disabled={uploading}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload & Complete
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

















// 'use client';

// import ProtectedRoute from '@/components/ProtectedRoute';
// import DashboardLayout from '@/components/DashboardLayout';
// import StatCard from '@/components/StatCard';
// import { useAuth } from '@/app/providers/AuthProvider';
// import { motion } from 'framer-motion';
// import { Clock, TestTube, CheckCircle, Upload, AlertCircle, DollarSign } from 'lucide-react';

// export default function DepartmentDashboard() {
//   const { departmentName } = useAuth();

//   return (
//     <ProtectedRoute allowedRoles={['department_staff']}>
//       <DashboardLayout>
//         <div className="space-y-6">
//           {/* Header */}
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="flex items-center justify-between"
//           >
//             <div>
//               <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
//                 Department Dashboard
//               </h1>
//               <p className="text-gray-600 flex items-center gap-2">
//                 <TestTube className="w-4 h-4" />
//                 {departmentName || 'Loading...'}
//               </p>
//             </div>
//             <motion.button
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
//             >
//               <Upload className="w-5 h-5" />
//               Upload Result
//             </motion.button>
//           </motion.div>

//           {/* Stats Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             <StatCard
//               title="Pending Payment"
//               value="5"
//               icon={Clock}
//               color="from-orange-500 to-orange-600"
//               subtitle="Awaiting payment"
//               index={0}
//             />
//             <StatCard
//               title="Ready for Upload"
//               value="2"
//               icon={Upload}
//               color="from-blue-500 to-blue-600"
//               subtitle="Payment confirmed"
//               index={1}
//             />
//             <StatCard
//               title="In Progress"
//               value="3"
//               icon={TestTube}
//               color="from-purple-500 to-purple-600"
//               subtitle="Currently testing"
//               index={2}
//             />
//             <StatCard
//               title="Completed Today"
//               value="8"
//               icon={CheckCircle}
//               color="from-green-500 to-green-600"
//               subtitle="Tests uploaded"
//               trend={{ value: '20%', isPositive: true }}
//               index={3}
//             />
//           </div>

//           {/* Test Queue Priority */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4 }}
//             className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6"
//           >
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-bold text-gray-900">Ready for Upload</h2>
//               <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full">
//                 2 Tests Ready
//               </span>
//             </div>
//             <div className="space-y-4">
//               {[
//                 { 
//                   patient: 'John Doe', 
//                   test: 'Complete Blood Count (CBC)', 
//                   ordered: 'Dr. Smith', 
//                   time: '2 hours ago',
//                   paymentStatus: 'paid',
//                   urgency: 'routine'
//                 },
//                 { 
//                   patient: 'Jane Smith', 
//                   test: 'X-Ray Chest', 
//                   ordered: 'Dr. Johnson', 
//                   time: '1 hour ago',
//                   paymentStatus: 'paid',
//                   urgency: 'urgent'
//                 },
//               ].map((test, idx) => (
//                 <motion.div
//                   key={idx}
//                   initial={{ opacity: 0, x: -20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ delay: 0.5 + idx * 0.1 }}
//                   whileHover={{ scale: 1.02, x: 4 }}
//                   className={`p-5 rounded-xl border-l-4 ${
//                     test.urgency === 'urgent' 
//                       ? 'bg-red-50 border-red-500' 
//                       : 'bg-blue-50 border-blue-500'
//                   } hover:shadow-lg transition-all`}
//                 >
//                   <div className="flex items-start justify-between mb-3">
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 mb-2">
//                         <h3 className="font-bold text-gray-900">{test.patient}</h3>
//                         {test.urgency === 'urgent' && (
//                           <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
//                             URGENT
//                           </span>
//                         )}
//                         <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
//                           <DollarSign className="w-3 h-3" />
//                           PAID
//                         </span>
//                       </div>
//                       <p className="text-sm text-gray-700 font-semibold mb-1">{test.test}</p>
//                       <p className="text-xs text-gray-600">Ordered by {test.ordered} • {test.time}</p>
//                     </div>
//                     <motion.button
//                       whileHover={{ scale: 1.1 }}
//                       whileTap={{ scale: 0.9 }}
//                       className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
//                     >
//                       <Upload className="w-4 h-4" />
//                       Upload
//                     </motion.button>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>
//           </motion.div>

//           {/* Two Column Layout */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Pending Payment */}
//             <motion.div
//               initial={{ opacity: 0, x: -20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: 0.6 }}
//               className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6"
//             >
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-xl font-bold text-gray-900">Pending Payment</h2>
//                 <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-bold rounded-full">
//                   5 Tests
//                 </span>
//               </div>
//               <div className="space-y-3">
//                 {[
//                   { patient: 'Bob Johnson', test: 'Lipid Profile', amount: '$45', time: '30 min ago' },
//                   { patient: 'Alice Brown', test: 'Urinalysis', amount: '$20', time: '1 hour ago' },
//                   { patient: 'Charlie Davis', test: 'Blood Sugar', amount: '$30', time: '2 hours ago' },
//                 ].map((test, idx) => (
//                   <motion.div
//                     key={idx}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: 0.7 + idx * 0.1 }}
//                     className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border border-orange-200"
//                   >
//                     <div className="p-2 bg-orange-500 rounded-lg">
//                       <Clock className="w-4 h-4 text-white" />
//                     </div>
//                     <div className="flex-1">
//                       <p className="font-semibold text-gray-900">{test.patient}</p>
//                       <p className="text-xs text-gray-600">{test.test}</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="font-bold text-orange-700">{test.amount}</p>
//                       <p className="text-xs text-gray-500">{test.time}</p>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>

//             {/* Recently Completed */}
//             <motion.div
//               initial={{ opacity: 0, x: 20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: 0.6 }}
//               className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6"
//             >
//               <h2 className="text-xl font-bold text-gray-900 mb-6">Recently Completed</h2>
//               <div className="space-y-3">
//                 {[
//                   { patient: 'Emma Wilson', test: 'CT Scan', time: '10 min ago', status: 'uploaded' },
//                   { patient: 'David Lee', test: 'MRI Brain', time: '30 min ago', status: 'uploaded' },
//                   { patient: 'Sarah Miller', test: 'ECG', time: '1 hour ago', status: 'uploaded' },
//                 ].map((test, idx) => (
//                   <motion.div
//                     key={idx}
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: 0.7 + idx * 0.1 }}
//                     className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl border border-green-200"
//                   >
//                     <div className="p-2 bg-green-500 rounded-lg">
//                       <CheckCircle className="w-4 h-4 text-white" />
//                     </div>
//                     <div className="flex-1">
//                       <p className="font-semibold text-gray-900">{test.patient}</p>
//                       <p className="text-xs text-gray-600">{test.test}</p>
//                     </div>
//                     <div className="text-right">
//                       <span className="text-xs text-green-700 font-semibold">{test.status}</span>
//                       <p className="text-xs text-gray-500">{test.time}</p>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </DashboardLayout>
//     </ProtectedRoute>
//   );
// }