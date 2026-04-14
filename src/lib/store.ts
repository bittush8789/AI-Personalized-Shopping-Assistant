import { create } from 'zustand';
import { auth, db, onAuthStateChanged, collection, getDocs, setDoc, doc, onSnapshot, query, where } from './firebase';
import { SAMPLE_PRODUCTS } from './sampleData';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AppState {
  user: User | null;
  isAuthReady: boolean;
  products: any[];
  cart: any[];
  wishlist: any[];
  budget: any | null;
  behaviorLogs: any[];
  recommendations: any[];
  
  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;
  setProducts: (products: any[]) => void;
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  setBudget: (budget: any) => void;
  addBehaviorLog: (log: any) => void;
  setRecommendations: (recs: any[]) => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  isAuthReady: false,
  products: SAMPLE_PRODUCTS,
  cart: [],
  wishlist: [],
  budget: null,
  behaviorLogs: [],
  recommendations: [],

  setUser: (user) => set({ user }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
  setProducts: (products) => set({ products }),
  
  addToCart: (product) => {
    const { cart, user } = get();
    const existing = cart.find(item => item.id === product.id);
    let newCart;
    if (existing) {
      newCart = cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }
    set({ cart: newCart });
    
    // Sync with Firestore if user exists
    if (user) {
      setDoc(doc(db, `users/${user.uid}/cart`, product.id), {
        productId: product.id,
        quantity: existing ? existing.quantity + 1 : 1,
        addedAt: new Date().toISOString()
      });
    }
  },

  removeFromCart: (productId) => {
    const { cart, user } = get();
    const newCart = cart.filter(item => item.id !== productId);
    set({ cart: newCart });
    if (user) {
      // deleteDoc logic here
    }
  },

  setBudget: (budget) => set({ budget }),
  
  addBehaviorLog: (log) => {
    const { behaviorLogs, user } = get();
    set({ behaviorLogs: [...behaviorLogs, log] });
    if (user) {
      // addDoc to behaviorLogs
    }
  },

  setRecommendations: (recs) => set({ recommendations: recs })
}));

// Initialize Auth Listener
onAuthStateChanged(auth, (user) => {
  useStore.getState().setUser(user ? {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL
  } : null);
  useStore.getState().setAuthReady(true);
});
