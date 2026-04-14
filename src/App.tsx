import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Mic, ShoppingCart, User, Heart, TrendingUp, Wallet, Sparkles, X, Plus, Minus, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { useStore } from './lib/store';
import { auth, googleProvider, signInWithPopup, signOut, db, collection, getDocs } from './lib/firebase';
import { getPersonalizedRecommendations, getSmartShoppingAdvice } from './lib/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Toaster, toast } from 'sonner';

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = ({ onOpenCart, onOpenBudget, onOpenVoice }: { onOpenCart: () => void, onOpenBudget: () => void, onOpenVoice: () => void }) => {
  const { user, cart } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Logged in successfully!');
    } catch (error) {
      toast.error('Login failed');
    }
  };

  const handleLogout = () => {
    signOut(auth);
    toast.info('Logged out');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-xl hidden sm:block tracking-tight">AI Shop</span>
        </div>

        <div className="flex-1 max-w-2xl relative group">
          <input
            type="text"
            placeholder="Search for products, brands..."
            className="w-full bg-gray-100 border-none rounded-2xl py-2.5 pl-11 pr-12 focus:ring-2 focus:ring-black/5 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <button 
            onClick={onOpenVoice}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Mic className="text-gray-500 w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          <button onClick={onOpenBudget} className="p-2 hover:bg-gray-100 rounded-xl transition-colors relative group">
            <Wallet className="w-6 h-6 text-gray-700" />
            <span className="absolute -top-1 -right-1 bg-green-500 w-2.5 h-2.5 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <button onClick={onOpenCart} className="p-2 hover:bg-gray-100 rounded-xl transition-colors relative">
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <img src={user.photoURL || ''} alt="Profile" className="w-9 h-9 rounded-full border border-gray-200" />
              <button onClick={handleLogout} className="hidden md:block p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <LogOut className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors">
              <LogIn className="w-5 h-5" />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const ProductCard = ({ product }: { product: any }) => {
  const { addToCart } = useStore();
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
    >
      <div className="aspect-square overflow-hidden relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <button className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-400 hover:text-red-500 transition-colors">
          <Heart className="w-5 h-5" />
        </button>
        <div className="absolute bottom-4 left-4">
          <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-black shadow-sm">
            {product.category}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 leading-tight">{product.name}</h3>
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg">
            <span className="text-yellow-600 font-bold text-sm">{product.rating}</span>
          </div>
        </div>
        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black text-black">₹{product.price}</span>
          <button 
            onClick={() => {
              addToCart(product);
              toast.success(`Added ${product.name} to cart`);
            }}
            className="bg-black text-white p-3 rounded-2xl hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const RecommendationFeed = () => {
  const { products, recommendations, setRecommendations, user, behaviorLogs } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecs = async () => {
      if (!user) return;
      setLoading(true);
      const recs = await getPersonalizedRecommendations({}, behaviorLogs, products);
      setRecommendations(recs);
      setLoading(false);
    };
    fetchRecs();
  }, [user]);

  const recommendedProducts = recommendations.map(rec => {
    const product = products.find(p => p.id === rec.productId);
    return product ? { ...product, reason: rec.reason } : null;
  }).filter(Boolean);

  if (!user) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-purple-600 w-6 h-6" />
          <h2 className="text-2xl font-black tracking-tight">Daily Picks for You</h2>
        </div>
        <button className="text-sm font-bold text-gray-500 hover:text-black transition-colors flex items-center gap-1">
          Refresh AI <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-gray-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedProducts.map((product: any) => (
            <div key={product.id} className="relative">
              <ProductCard product={product} />
              <div className="mt-3 bg-purple-50 border border-purple-100 p-3 rounded-2xl">
                <p className="text-xs text-purple-700 font-medium leading-relaxed">
                  <Sparkles className="inline w-3 h-3 mr-1" /> {product.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const BudgetModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { budget, setBudget } = useStore();
  const [limit, setLimit] = useState(budget?.monthlyLimit || 50000);

  const handleSave = () => {
    setBudget({ monthlyLimit: limit, spentThisMonth: 12500, currency: 'INR' });
    toast.success('Budget updated!');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-2xl">
                  <Wallet className="text-green-600 w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black">Budget Planner</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Monthly Limit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                  <input 
                    type="number" 
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-10 pr-4 font-black text-2xl focus:border-black transition-all"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-[24px]">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <span className="text-sm font-bold text-gray-400 block mb-1">Spent so far</span>
                    <span className="text-3xl font-black">₹12,500</span>
                  </div>
                  <span className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {Math.round((12500 / limit) * 100)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(12500 / limit) * 100}%` }}
                    className="h-full bg-black rounded-full"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all active:scale-95"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const CartDrawer = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { cart, removeFromCart } = useStore();
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[101] w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-2xl font-black">Your Bag</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Your bag is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.image} alt={item.name} className="w-24 h-24 rounded-2xl object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{item.name}</h4>
                      <p className="text-gray-500 text-sm mb-2">Qty: {item.quantity}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-black">₹{item.price}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-sm font-bold">Remove</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between mb-6">
                  <span className="text-gray-500 font-bold">Total Amount</span>
                  <span className="text-3xl font-black">₹{total}</span>
                </div>
                <button className="w-full bg-black text-white py-5 rounded-3xl font-bold text-xl hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-black/10">
                  Checkout Now
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const VoiceSearchModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const { cart, budget } = useStore();

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      const advice = await getSmartShoppingAdvice(text, budget, cart);
      setAiResponse(advice);
    };

    recognition.start();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl text-center"
          >
            <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6" />
            </button>

            <div className="mb-8">
              <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6 relative">
                {isListening && (
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-black rounded-full"
                  />
                )}
                <Mic className="text-white w-10 h-10 relative z-10" />
              </div>
              <h2 className="text-3xl font-black mb-2">How can I help?</h2>
              <p className="text-gray-500 font-medium">Try "Find me running shoes under ₹5000"</p>
            </div>

            <div className="min-h-[120px] bg-gray-50 rounded-3xl p-6 mb-8 text-left">
              {transcript && (
                <div className="mb-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">You said</span>
                  <p className="text-lg font-bold text-gray-900">"{transcript}"</p>
                </div>
              )}
              {aiResponse && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-widest block mb-1">AI Assistant</span>
                  <p className="text-gray-700 leading-relaxed">{aiResponse}</p>
                </motion.div>
              )}
            </div>

            <button 
              onClick={startListening}
              disabled={isListening}
              className={cn(
                "w-full py-5 rounded-3xl font-bold text-xl transition-all active:scale-95",
                isListening ? "bg-gray-100 text-gray-400" : "bg-black text-white hover:bg-gray-800"
              )}
            >
              {isListening ? "Listening..." : "Start Speaking"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Main App ---

export default function App() {
  const { products, user, isAuthReady } = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-12 h-12 border-4 border-black border-t-transparent rounded-full"
          />
          <p className="font-bold text-gray-400">Loading AI Shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Toaster position="bottom-right" richColors />
      <Navbar 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenBudget={() => setIsBudgetOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 pt-28 pb-20">
        {/* Hero Section */}
        <section className="mb-16 relative overflow-hidden bg-black rounded-[40px] p-8 sm:p-16 text-white">
          <div className="relative z-10 max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6"
            >
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold">Trending: Smart Wearables</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-7xl font-black tracking-tight mb-6 leading-[0.9]"
            >
              Shop Smarter <br /> with AI.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg sm:text-xl mb-8 max-w-md"
            >
              Personalized recommendations, budget tracking, and voice search all in one place.
            </motion.p>
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white text-black px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Explore Catalog
            </motion.button>
          </div>
          
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-[100px]" />
          </div>
        </section>

        {/* AI Recommendations */}
        <RecommendationFeed />

        {/* Categories / Trending */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black tracking-tight">Trending Now</h2>
            <div className="flex gap-2">
              {['All', 'Electronics', 'Apparel', 'Furniture'].map(cat => (
                <button key={cat} className="px-5 py-2 rounded-full text-sm font-bold bg-white border border-gray-100 hover:border-black transition-all">
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      {/* Modals & Drawers */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <BudgetModal isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} />
      <VoiceSearchModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">AI Shop</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">© 2026 AI Personalized Shopping Assistant. Built with Gemini.</p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-black transition-colors font-bold text-sm">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-black transition-colors font-bold text-sm">Terms</a>
            <a href="#" className="text-gray-400 hover:text-black transition-colors font-bold text-sm">Help</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
