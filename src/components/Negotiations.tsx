import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Send, DollarSign, Clock, CheckCircle2, XCircle, MoreVertical, User as UserIcon, MessageSquare, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { negotiationApi } from '../services/api';
import { Negotiation, Message } from '../types';
import { useAuth } from '../context/AuthContext';

export default function Negotiations() {
  const { user } = useAuth();
  const [negotiations, setNegotiations] = React.useState<Negotiation[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState('');
  const [offerPrice, setOfferPrice] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const fetchNegotiations = async () => {
    try {
      const negs = await negotiationApi.getAll();
      setNegotiations(negs);
      if (negs.length > 0 && !selectedId) {
        setSelectedId(negs[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching negotiations:', error);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchNegotiations();
  }, [selectedId]);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedId, negotiations]);

  const selectedNeg = negotiations.find(n => n.id === selectedId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedId) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user?.uid || 'current-user-id',
      text: message.trim(),
      timestamp: Date.now(),
      offerPrice: offerPrice ? parseFloat(offerPrice) : undefined
    };

    try {
      const updatedMessages = [...(selectedNeg?.messages || []), newMessage];
      await negotiationApi.update(selectedId, {
        messages: updatedMessages,
        status: offerPrice ? 'countered' : 'pending'
      });
      setMessage('');
      setOfferPrice('');
      fetchNegotiations();
    } catch (error: any) {
      toast.error('Failed to send message');
    }
  };

  const handleStatusUpdate = async (status: 'accepted' | 'rejected') => {
    if (!selectedId) return;
    if (status === 'rejected' && !isRejectModalOpen) {
      setIsRejectModalOpen(true);
      return;
    }

    try {
      await negotiationApi.update(selectedId, { status });
      toast.success(`Negotiation ${status}`);
      setIsRejectModalOpen(false);
      fetchNegotiations();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteNegotiation = async () => {
    if (!selectedId) return;
    try {
      await negotiationApi.delete(selectedId);
      toast.success('Negotiation deleted');
      setIsDeleteModalOpen(false);
      setSelectedId(null);
      fetchNegotiations();
    } catch (error) {
      toast.error('Failed to delete negotiation');
    }
  };

  const filteredNegotiations = negotiations.filter(n => 
    (n.productId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (n.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-3">
      {/* Sidebar - Negotiation List */}
      <div className="w-full md:w-64 flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredNegotiations.map((neg) => (
            <button
              key={neg.id}
              onClick={() => setSelectedId(neg.id)}
              className={`w-full p-2.5 rounded-xl text-left transition-all ${
                selectedId === neg.id 
                  ? 'bg-white shadow-sm border-primary/20 border' 
                  : 'hover:bg-white/50 border-transparent border'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <UserIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-xs truncate">Neg. #{neg.id.slice(0, 5)}</p>
                  <p className="text-[10px] text-slate-500 truncate">ID: {neg.productId.slice(0, 8)}</p>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  neg.status === 'pending' ? 'bg-amber-400' : 
                  neg.status === 'accepted' ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-1">
                {Array.isArray(neg.messages) && neg.messages.length > 0 ? neg.messages[neg.messages.length - 1].text : 'No messages'}
              </p>
            </button>
          ))}
          {filteredNegotiations.length === 0 && (
            <div className="text-center py-4 text-slate-400">
              <p className="text-[10px]">No negotiations</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 card p-0 flex flex-col overflow-hidden">
        {selectedNeg ? (
          <>
            {/* Chat Header */}
            <div className="p-2.5 border-b border-slate-100 flex items-center justify-between bg-white/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <UserIcon size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Negotiation #{selectedNeg.id.slice(0, 8)}</h3>
                  <p className="text-[10px] text-slate-500 uppercase">Status: <span className={`font-bold ${
                    selectedNeg.status === 'accepted' ? 'text-emerald-600' : 
                    selectedNeg.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'
                  }`}>{selectedNeg.status}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                  title="Delete Negotiation"
                >
                  <Trash2 size={16} />
                </button>
                <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-500">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {Array.isArray(selectedNeg.messages) && selectedNeg.messages.map((msg) => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] space-y-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`p-2.5 rounded-xl shadow-sm ${
                        isMe 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
                      }`}>
                        {msg.offerPrice && (
                          <div className={`mb-1 p-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold ${
                            isMe ? 'bg-white/20' : 'bg-primary/10 text-primary'
                          }`}>
                            <DollarSign size={14} />
                            Offer: ${msg.offerPrice}
                          </div>
                        )}
                        <p className="text-xs leading-relaxed">{msg.text}</p>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium px-1">
                        {format(msg.timestamp, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type message..."
                      className="w-full pl-3 pr-10 py-2 rounded-lg bg-slate-50 border-none text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!message.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-50"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative w-24">
                    <DollarSign className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                      type="number"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="Offer"
                      className="w-full pl-6 pr-1.5 py-1.5 rounded-md bg-slate-50 border-none text-[11px] focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleStatusUpdate('accepted')}
                    className="px-2.5 py-1.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 size={12} /> Accept
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleStatusUpdate('rejected')}
                    className="px-2.5 py-1.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors flex items-center gap-1"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">No Negotiation Selected</h3>
            <p className="text-xs max-w-[200px]">Select a conversation from the list to start negotiating.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-xs overflow-hidden p-4"
            >
              <div className="flex items-center gap-2 mb-2 text-rose-600">
                <AlertTriangle size={18} />
                <h3 className="text-sm font-bold">Delete Negotiation?</h3>
              </div>
              <p className="text-[11px] text-slate-600 mb-4">
                This action cannot be undone. All messages and history for this negotiation will be permanently removed.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteNegotiation}
                  className="flex-1 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-medium hover:bg-rose-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Confirmation Modal */}
      <AnimatePresence>
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-xs overflow-hidden p-4"
            >
              <div className="flex items-center gap-2 mb-2 text-amber-600">
                <AlertTriangle size={18} />
                <h3 className="text-sm font-bold">Reject Negotiation?</h3>
              </div>
              <p className="text-[11px] text-slate-600 mb-4">
                Are you sure you want to reject this negotiation? This will end the conversation and mark the status as rejected.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate('rejected')}
                  className="flex-1 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-medium hover:bg-rose-700 transition-all"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
