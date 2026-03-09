import React from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  MapPin,
  Phone,
  Mail,
  Copy,
  ChevronRight
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface OrderTrackingProps {
  order: Order;
}

const statusSteps: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'pending', label: 'Order Placed', icon: Clock },
  { status: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
  { status: 'processing', label: 'Processing', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const statusColors: Record<OrderStatus, string> = {
  pending: 'text-yellow-500 bg-yellow-50 border-yellow-200',
  confirmed: 'text-blue-500 bg-blue-50 border-blue-200',
  processing: 'text-purple-500 bg-purple-50 border-purple-200',
  shipped: 'text-indigo-500 bg-indigo-50 border-indigo-200',
  delivered: 'text-green-500 bg-green-50 border-green-200',
  cancelled: 'text-red-500 bg-red-50 border-red-200',
  refunded: 'text-orange-500 bg-orange-50 border-orange-200',
};

export default function OrderTracking({ order }: OrderTrackingProps) {
  const currentStepIndex = statusSteps.findIndex(s => s.status === order.status);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusMessage = () => {
    switch (order.status) {
      case 'pending':
        return 'Your order has been placed and is waiting for confirmation.';
      case 'confirmed':
        return 'Your order has been confirmed and will be processed soon.';
      case 'processing':
        return 'Your order is being prepared for shipment.';
      case 'shipped':
        return `Your order is on its way! Tracking: ${order.trackingNumber || 'N/A'}`;
      case 'delivered':
        return 'Your order has been delivered successfully!';
      case 'cancelled':
        return 'This order has been cancelled.';
      case 'refunded':
        return 'This order has been refunded.';
      default:
        return 'Order status is being updated.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Order #{order.id.slice(0, 8).toUpperCase()}</h2>
            <p className="text-sm text-slate-500">
              Placed on {format(order.createdAt, 'MMMM d, yyyy • h:mm a')}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full border ${statusColors[order.status]} inline-flex items-center gap-2`}>
            {order.status === 'cancelled' && <XCircle size={18} />}
            {order.status === 'refunded' && <XCircle size={18} />}
            {order.status === 'delivered' && <CheckCircle size={18} />}
            <span className="font-medium capitalize">{order.status}</span>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600">
            {getStatusMessage()}
            {order.status === 'shipped' && order.trackingNumber && (
              <button
                onClick={() => copyToClipboard(order.trackingNumber!)}
                className="ml-2 text-primary hover:underline inline-flex items-center gap-1"
              >
                <Copy size={14} />
                Copy
              </button>
            )}
          </p>
        </div>
      </div>

      {/* Progress Tracker */}
      {order.status !== 'cancelled' && order.status !== 'refunded' && (
        <div className="card p-6">
          <h3 className="font-semibold mb-6">Order Progress</h3>
          
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 -z-10">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
              />
            </div>

            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.status} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-slate-300 border-slate-200'
                    } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                  >
                    <Icon size={18} />
                  </div>
                  <span className={`mt-2 text-xs font-medium ${isCompleted ? 'text-primary' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Estimated Delivery */}
          {order.estimatedDelivery && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
              <Clock size={20} className="text-blue-500" />
              <div>
                <p className="text-sm font-medium text-blue-700">Estimated Delivery</p>
                <p className="text-sm text-blue-600">
                  {format(order.estimatedDelivery, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Items */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Order Items</h3>
        
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 p-3 bg-slate-50 rounded-lg">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                ) : (
                  <Package size={24} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{item.productName}</h4>
                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${item.total.toFixed(2)}</p>
                <p className="text-xs text-slate-500">${item.price.toFixed(2)} each</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Shipping</span>
              <span>${order.shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tax</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total ({order.currency})</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Shipping Address</h3>
        
        <div className="flex gap-3">
          <MapPin size={20} className="text-slate-400 flex-shrink-0" />
          <div className="text-sm">
            <p>{order.shippingAddress.street}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p className="text-slate-500">{order.shippingAddress.country}</p>
            {order.shippingAddress.phone && (
              <p className="mt-2 flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                {order.shippingAddress.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Payment Information</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Method</span>
            <span className="capitalize">{order.paymentMethod.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Status</span>
            <span className={`capitalize ${
              order.paymentStatus === 'paid' ? 'text-green-600' : 
              order.paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {order.paymentStatus}
            </span>
          </div>
          {order.paymentIntentId && (
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID</span>
              <button
                onClick={() => copyToClipboard(order.paymentIntentId!)}
                className="text-primary hover:underline flex items-center gap-1"
              >
                {order.paymentIntentId.slice(0, 20)}...
                <Copy size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
