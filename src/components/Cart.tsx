import React from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag, CreditCard, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productApi } from '../services/api';
import { Product } from '../types';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart, addToCart } = useCart();
  const navigate = useNavigate();
  const [relatedProducts, setRelatedProducts] = React.useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = React.useState(false);

  React.useEffect(() => {
    const fetchRelated = async () => {
      if (cart.length === 0) return;
      setLoadingRelated(true);
      try {
        const allProducts = await productApi.getAll();
        const cartCategories = new Set(cart.map(item => item.category));
        const cartIds = new Set(cart.map(item => item.id));
        
        const related = allProducts
          .filter(p => cartCategories.has(p.category) && !cartIds.has(p.id))
          .slice(0, 4);
        
        setRelatedProducts(related);
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelated();
  }, [cart]);

  const handleCheckout = () => {
    toast.success('Checkout successful! (Simulation)');
    clearCart();
    navigate('/dashboard');
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-slate-500 max-w-md mb-8">
          Looks like you haven't added anything to your cart yet. Explore our marketplace to find amazing products.
        </p>
        <Link to="/marketplace" className="btn-primary px-8 py-3 flex items-center gap-2">
          <ShoppingBag size={18} />
          Go to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Shopping Cart</h1>
          <p className="text-sm text-slate-500">You have {totalItems} items in your cart</p>
        </div>
        <button 
          onClick={clearCart}
          className="text-rose-600 text-xs font-medium hover:underline flex items-center gap-1"
        >
          <Trash2 size={14} />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 flex gap-4 items-center"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ShoppingBag size={24} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{item.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{item.category}</p>
                <p className="text-sm font-bold text-primary">${item.price}</p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-1 hover:bg-white rounded-md transition-colors text-slate-500"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-1 hover:bg-white rounded-md transition-colors text-slate-500"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button 
                onClick={() => removeFromCart(item.id)}
                className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Shipping</span>
                <span className="text-emerald-600 font-medium">Free</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-900">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 mb-3"
            >
              <CreditCard size={18} />
              Checkout Now
            </button>
            
            <Link 
              to="/marketplace" 
              className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-primary transition-colors"
            >
              Continue Shopping
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <Star className="text-amber-400 fill-amber-400" size={20} />
            <h2 className="text-xl font-bold">You might also like</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((product) => (
              <div key={product.id} className="card p-0 overflow-hidden group">
                <div className="aspect-square bg-slate-100 relative overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ShoppingBag size={24} />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-xs truncate mb-1">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">${product.price}</span>
                    <button 
                      onClick={() => {
                        addToCart(product);
                        toast.success('Added to cart');
                      }}
                      className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
