import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingCart, Trash2, Star, Package, Search } from 'lucide-react';
import { Product, WishlistItem } from '../types';
import { productApi, wishlistApi } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

interface WishlistProps {
  wishlist: WishlistItem[];
  onRemove: (id: string) => void;
  onAddToCart: (product: Product) => void;
}

export default function Wishlist({ wishlist, onRemove, onAddToCart }: WishlistProps) {
  const navigate = useNavigate();

  if (wishlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <Heart size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-4">Your Wishlist is Empty</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Save items you love to your wishlist and they'll appear here.
        </p>
        <button 
          onClick={() => navigate('/marketplace')}
          className="btn-primary px-8 py-3"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          My Wishlist ({wishlist.length} items)
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlist.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card overflow-hidden"
          >
            <div 
              className="aspect-square relative bg-slate-100 cursor-pointer"
              onClick={() => navigate(`/product/${item.productId}`)}
            >
              {item.product.image ? (
                <img 
                  src={item.product.image} 
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={48} className="text-slate-300" />
                </div>
              )}
              
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-md hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} className="text-red-500" />
              </button>

              {/* Stock badge */}
              {item.product.stock === 0 && (
                <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  Out of Stock
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 
                className="font-semibold text-sm mb-1 cursor-pointer hover:text-primary transition-colors line-clamp-1"
                onClick={() => navigate(`/product/${item.productId}`)}
              >
                {item.product.name}
              </h3>
              
              <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                {item.product.description}
              </p>

              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-lg">
                  ${item.product.price.toFixed(2)}
                </span>
                
                {item.product.stock > 0 && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    In Stock
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onAddToCart(item.product)}
                  disabled={item.product.stock === 0}
                  className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={14} />
                  Add to Cart
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Wishlist context for managing wishlist state
export function useWishlist() {
  const [wishlist, setWishlist] = React.useState<WishlistItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const items = await wishlistApi.getAll();
      setWishlist(items);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWishlist();
  }, []);

  const addToWishlist = async (productId: string) => {
    try {
      await wishlistApi.add(productId);
      await fetchWishlist();
      toast.success('Added to wishlist');
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error('Already in wishlist');
      } else {
        toast.error('Failed to add to wishlist');
      }
    }
  };

  const removeFromWishlist = async (id: string) => {
    try {
      await wishlistApi.remove(id);
      setWishlist(prev => prev.filter(item => item.id !== id));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.productId === productId);
  };

  return {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refetch: fetchWishlist,
  };
}
