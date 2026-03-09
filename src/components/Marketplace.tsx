import React from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ShoppingBag, MessageSquare, DollarSign, Tag, Info, ShoppingCart } from 'lucide-react';
import { productApi, negotiationApi } from '../services/api';
import { Product } from '../types';
import { PRODUCT_CATEGORIES } from '../constants';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Marketplace() {
  const { addToCart } = useCart();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const prods = await productApi.getAll();
      setProducts(prods);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const handleStartNegotiation = async (product: Product) => {
    try {
      const negData = {
        businessId: product.businessId,
        productId: product.id,
        status: 'pending',
        messages: [
          {
            id: Math.random().toString(36).substr(2, 9),
            senderId: 'current-user-id', // This will be handled by the backend auth
            text: `Hi, I'm interested in ${product.name}.`,
            timestamp: Date.now()
          }
        ]
      };

      await negotiationApi.create(negData);
      toast.success('Negotiation started!');
      navigate('/negotiations');
    } catch (error) {
      toast.error('Failed to start negotiation');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (p.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold mb-0.5">Marketplace</h1>
          <p className="text-[10px] text-slate-500">Discover products and services from businesses around the world.</p>
        </div>
      </div>

      <div className="card p-2">
        <div className="flex flex-col md:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 rounded-lg border border-slate-200 text-[11px] focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <Filter className="text-slate-400" size={12} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-[10px] font-medium rounded-lg px-2 py-1 outline-none w-full md:w-28"
            >
              <option value="All">All Categories</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            className="card p-0 overflow-hidden group"
          >
            <div className="relative aspect-square overflow-hidden bg-slate-100">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ShoppingBag size={24} />
                </div>
              )}
              <div className="absolute top-1 right-1">
                <span className="px-1 py-0.5 bg-white/90 backdrop-blur-sm rounded text-[8px] font-bold text-slate-700 shadow-sm">
                  {product.category}
                </span>
              </div>
            </div>
            <div className="p-2">
              <h3 className="font-bold text-slate-900 text-xs mb-0.5 truncate">{product.name}</h3>
              <p className="text-[9px] text-slate-500 line-clamp-2 mb-1.5 h-5 leading-tight">{product.description}</p>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-primary">${product.price}</p>
                <div className="text-[9px] font-medium text-slate-400">
                  {product.stock} left
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={() => handleStartNegotiation(product)}
                  className="w-full btn-secondary py-1 text-[9px] flex items-center justify-center gap-1"
                >
                  <MessageSquare size={10} />
                  Negotiate
                </button>
                <button 
                  onClick={() => {
                    addToCart(product);
                    toast.success('Added to cart');
                  }}
                  className="w-full btn-primary py-1 text-[9px] flex items-center justify-center gap-1"
                >
                  <ShoppingCart size={10} />
                  Add to Cart
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-6 text-slate-400">
            <ShoppingBag size={24} className="mx-auto mb-1.5 opacity-20" />
            <p className="text-sm font-medium">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
