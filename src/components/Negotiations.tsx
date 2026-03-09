import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Send, DollarSign, Clock, CheckCircle2, XCircle, MoreVertical, User as UserIcon, MessageSquare } from 'lucide-react';
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
      senderId: 'current-user-id', // In a real app, this should be the actual user ID
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
    try {
      await negotiationApi.update(selectedId, { status });
      toast.success(`Negotiation ${status}`);
      fetchNegotiations();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredNegotiations = negotiations.filter(n => 
    n.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Sidebar - Negotiation List */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search negotiations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {filteredNegotiations.map((neg) => (
            <button
              key={neg.id}
              onClick={() => setSelectedId(neg.id)}
              className={`w-full p-4 rounded-2xl text-left transition-all ${
                selectedId === neg.id 
                  ? 'bg-white shadow-md border-primary/20 border' 
                  : 'hover:bg-white/50 border-transparent border'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <UserIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">Negotiation #{neg.id.slice(0, 5)}</p>
                  <p className="text-xs text-slate-500 truncate">Product ID: {neg.productId.slice(0, 8)}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  neg.status === 'pending' ? 'bg-amber-400' : 
                  neg.status === 'accepted' ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
              </div>
              <p className="text-sm text-slate-600 line-clamp-1">
                {neg.messages.length > 0 ? neg.messages[neg.messages.length - 1].text : 'No messages yet'}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">
                {neg.updatedAt ? format((neg.updatedAt as any).toDate(), 'MMM d, h:mm a') : 'Just now'}
              </p>
            </button>
          ))}
          {filteredNegotiations.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No negotiations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 card p-0 flex flex-col overflow-hidden">
        {selectedNeg ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Negotiation #{selectedNeg.id.slice(0, 8)}</h3>
                  <p className="text-xs text-slate-500">Status: <span className={`font-medium uppercase ${
                    selectedNeg.status === 'accepted' ? 'text-emerald-600' : 
                    selectedNeg.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'
                  }`}>{selectedNeg.status}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {selectedNeg.messages.map((msg) => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-2xl shadow-sm ${
                        isMe 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
                      }`}>
                        {msg.offerPrice && (
                          <div className={`mb-2 p-2 rounded-lg flex items-center gap-2 text-sm font-bold ${
                            isMe ? 'bg-white/20' : 'bg-primary/10 text-primary'
                          }`}>
                            <DollarSign size={16} />
                            Offer: ${msg.offerPrice}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium px-1">
                        {format(msg.timestamp, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
              {selectedNeg.messages.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p>No messages yet. Start the negotiation!</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!message.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-32">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="number"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="Offer"
                      className="w-full pl-7 pr-2 py-2 rounded-lg bg-slate-50 border-none text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleStatusUpdate('accepted')}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 size={14} /> Accept Deal
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleStatusUpdate('rejected')}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors flex items-center gap-1"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Negotiation Selected</h3>
            <p className="max-w-xs">Select a conversation from the list to start negotiating with your customers.</p>
          </div>
        )}
      </div>
    </div>
  );
}
