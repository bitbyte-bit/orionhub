import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, Package, DollarSign, Tag, X, Save } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '../constants';
import toast from 'react-hot-toast';
import { productApi, uploadApi, businessApi } from '../services/api';
import { Product } from '../types';

export default function ProductManagement() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [businessId, setBusinessId] = React.useState<string | null>(null);
  
  const [isUploading, setIsUploading] = React.useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [productToDelete, setProductToDelete] = React.useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    price: '',
    category: PRODUCT_CATEGORIES[0],
    stock: '',
    image: ''
  });

  const fetchProducts = async () => {
    try {
      const business = await businessApi.getMyBusiness();
      if (business) {
        setBusinessId(business.id);
        const prods = await productApi.getAll({ businessId: business.id });
        setProducts(prods);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        stock: product.stock.toString(),
        image: product.image || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: PRODUCT_CATEGORIES[0],
        stock: '',
        image: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadApi.uploadFile(file);
      setFormData({ ...formData, image: url });
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      toast.error('Please register your business first');
      return;
    }

    const productData = {
      businessId,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      stock: parseInt(formData.stock),
      image: formData.image
    };

    try {
      if (editingProduct) {
        await productApi.update(editingProduct.id, productData);
        toast.success('Product updated successfully');
      } else {
        await productApi.create(productData);
        toast.success('Product added successfully');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await productApi.delete(productToDelete);
      toast.success('Product deleted');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      await productApi.update(id, { stock: newStock });
      setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
      toast.success('Stock updated');
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
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
          <h1 className="text-lg font-bold mb-0.5">Products & Services</h1>
          <p className="text-[10px] text-slate-500">Manage your inventory and offerings.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary py-1.5 px-3 text-[10px] flex items-center gap-1.5"
        >
          <Plus size={14} />
          Add New Product
        </button>
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
              className="w-full pl-7 pr-2 py-1 rounded-lg border border-slate-200 text-[11px] focus:ring-1 focus:ring-primary focus:border-transparent outline-none transition-all"
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
                  <Package size={24} />
                </div>
              )}
              <div className="absolute top-1 right-1 flex gap-1">
                <button 
                  onClick={() => handleOpenModal(product)}
                  className="p-1 bg-white/90 backdrop-blur-sm rounded-lg text-slate-600 hover:text-primary shadow-sm transition-colors"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  onClick={() => handleDeleteClick(product.id)}
                  className="p-1 bg-white/90 backdrop-blur-sm rounded-lg text-slate-600 hover:text-rose-600 shadow-sm transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="absolute bottom-1 left-1">
                <span className="px-1 py-0.5 bg-white/90 backdrop-blur-sm rounded text-[8px] font-bold text-slate-700 shadow-sm">
                  {product.category}
                </span>
              </div>
            </div>
            <div className="p-2">
              <h3 className="font-bold text-slate-900 text-xs mb-0.5 truncate">{product.name}</h3>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-primary">${product.price}</p>
                <div className="flex items-center gap-1 text-[9px] font-medium text-slate-500">
                  <Package size={10} />
                  {product.stock}
                </div>
              </div>
              
              <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100">
                <button 
                  onClick={() => handleUpdateStock(product.id, product.stock - 1)}
                  className="flex-1 py-0.5 rounded-md bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors text-[9px] font-bold"
                >
                  -1
                </button>
                <button 
                  onClick={() => handleUpdateStock(product.id, product.stock + 1)}
                  className="flex-1 py-0.5 rounded-md bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors text-[9px] font-bold"
                >
                  +1
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        
        <button 
          onClick={() => handleOpenModal()}
          className="card border-2 border-dashed border-slate-200 bg-transparent flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-primary hover:text-primary transition-all group p-3"
        >
          <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Plus size={16} />
          </div>
          <span className="text-[10px] font-medium">Add Product</span>
        </button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      required
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none"
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Stock</label>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Product Image</label>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {formData.image ? (
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} className="text-slate-300" />
                        )}
                      </div>
                      <label className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer text-center transition-colors">
                        {isUploading ? '...' : 'Upload'}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Save size={14} />
                    {editingProduct ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6"
            >
              <h3 className="text-xl font-bold mb-2">Delete Product?</h3>
              <p className="text-slate-500 mb-6">This action cannot be undone. Are you sure you want to delete this product?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-rose-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-rose-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
