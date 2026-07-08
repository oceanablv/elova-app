"use client";

import React, { useState, useEffect } from 'react';
import { FaLeaf } from 'react-icons/fa';
import { HiCheck, HiExclamation, HiLockClosed } from 'react-icons/hi';
import { GiRecycle, GiBananaBunch } from 'react-icons/gi';
import { MdLogout, MdRefresh, MdOutlineInbox } from 'react-icons/md';

// Hardcoded Supabase Credentials provided by the user (Secured privately inside the client application)
const SUPABASE_URL = 'https://amxvgzrrikccjgtfktpa.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zWn_kC_9mk3huTQq5HFQCA_0gkioqf_';

export default function App() {
  // Navigation & Authentication States
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'login' | 'admin'
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Application Data States
  const [products, setProducts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  
  // Landing Page Interactive States
  const [activeStep, setActiveStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(10);
  const [customMessage, setCustomMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemNotification, setSystemNotification] = useState(null);

  // Product CRUD Form States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means "Add New", object means "Edit"
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formUnit, setFormUnit] = useState('pcs');
  const [formBadge, setFormBadge] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formBenefits, setFormBenefits] = useState('');

  // Fallback Mock Data matching the database structure
  const mockProducts = [
    {
      id: "mock-1",
      title: "Elova Seedling Cup 6cm",
      description: "Ukuran ideal untuk menyemai benih sayuran, buah, dan bunga kecil sebelum dipindahkan langsung ke tanah.",
      price_numeric: 2500,
      price_formatted: "Rp 2.500",
      unit: "pcs",
      badge: "Best Seller",
      image_url: null, 
      benefits: ["Bahan Pelepah Pisang Murni", "Diameter Atas: 6 cm", "Waktu Urai: 3-5 Minggu"]
    },
    {
      id: "mock-2",
      title: "Elova Multi-tray Starter Pack",
      description: "Paket bundling berisi 12 pot semai modular hemat ruang untuk pembibitan skala kebun rumah.",
      price_numeric: 27000,
      price_formatted: "Rp 27.000",
      unit: "pack",
      badge: "Eco-Choice",
      image_url: null,
      benefits: ["Isi 12 Pot Semai", "Lebih Hemat 10%", "Dilengkapi Panduan Semai"]
    },
    {
      id: "mock-3",
      title: "Elova Custom Nursery Set",
      description: "Kustomisasi dimensi pot semai berbagai ukuran khusus untuk pertanian komersial maupun urban farming skala industri.",
      price_numeric: 0,
      price_formatted: "Hubungi Sales",
      unit: "set",
      badge: "Custom Pack",
      image_url: null,
      benefits: ["Ukuran Sesuai Request", "Diskon Pembelian Partai", "Logo Grafir Kustom"]
    }
  ];

  // Load Supabase Client SDK and Auto-Fetch Public Data
  useEffect(() => {
    setProducts(mockProducts); // set fallback initial data

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = () => {
      if (window.supabase) {
        try {
          const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
          setSupabaseClient(client);
          setIsDbReady(true);
          
          // Fetch catalog directly for public landing view
          fetchPublicProducts(client);
          
          // Check if there is an active session in local storage
          checkActiveSession(client);
        } catch (err) {
          console.error("Gagal menginisialisasi client Supabase:", err);
        }
      }
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Simple client-side Router based on window location hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/login') {
        setCurrentView('login');
      } else if (hash === '#/admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('landing');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // trigger on initial load
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check existing session
  const checkActiveSession = async (client) => {
    try {
      const { data: { session }, error } = await client.auth.getSession();
      if (!error && session) {
        setAdminUser(session.user);
      }
    } catch (err) {
      console.log("Belum ada session admin aktif.");
    }
  };

  // Fetch Public Products from Supabase
  const fetchPublicProducts = async (client) => {
    setIsLoadingProducts(true);
    try {
      const { data, error } = await client
        .from('elova_products')
        .select('*')
        .order('price_numeric', { ascending: true });
      if (!error && data && data.length > 0) {
        setProducts(data);
      }
    } catch (err) {
      console.error("Menggunakan data lokal cadangan:", err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Handle Admin Email/Password Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    setAuthError(null);
    setIsAuthenticating(true);
    
    // DEVELOPER TEST BYPASS (Bisa langsung digunakan di browser)
    if (loginEmail === 'admin@elova.id' && loginPassword === 'admin123') {
      setAdminUser({ email: 'admin@elova.id', id: 'local-admin-test' });
      triggerNotification("Selamat datang kembali Admin Elova (Uji Coba Lokal)!");
      window.location.hash = '#/admin';
      if (supabaseClient) {
        fetchLeads(supabaseClient);
      }
      setIsAuthenticating(false);
      return;
    }

    if (!supabaseClient) {
      setAuthError("Koneksi Supabase belum siap dan kredensial uji coba lokal tidak cocok.");
      setIsAuthenticating(false);
      return;
    }
    
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.user) {
        setAdminUser(data.user);
        triggerNotification("Selamat datang kembali Admin Elova!");
        window.location.hash = '#/admin';
        fetchLeads(supabaseClient);
      }
    } catch (err) {
      setAuthError(err.message || "Gagal masuk. Silakan periksa kembali email dan password Anda.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Admin Logout
  const handleAdminLogout = async () => {
    if (!supabaseClient) return;
    try {
      await supabaseClient.auth.signOut();
      setAdminUser(null);
      triggerNotification("Berhasil keluar dari Portal Admin.");
      window.location.hash = '#/';
    } catch (err) {
      console.error("Gagal melakukan sign out:", err);
    }
  };

  // Fetch Leads for Admin Dashboard
  const fetchLeads = async (client) => {
    if (!client) return;
    setIsLoadingLeads(true);
    try {
      const { data, error } = await client
        .from('elova_whatsapp_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setLeads(data);
      }
    } catch (err) {
      console.error("Gagal memuat log pesanan:", err);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  // Open modal for creating a new product
  const openAddProductModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormDescription('');
    setFormPrice(0);
    setFormUnit('pcs');
    setFormBadge('');
    setFormImageUrl('');
    setFormBenefits('Bahan Pelepah Pisang Murni, Diameter: 6 cm, Waktu Urai: 3-5 Minggu');
    setIsProductModalOpen(true);
  };

  // Open modal with pre-filled fields for editing
  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setFormTitle(product.title);
    setFormDescription(product.description);
    setFormPrice(product.price_numeric);
    setFormUnit(product.unit || 'pcs');
    setFormBadge(product.badge || '');
    setFormImageUrl(product.image_url || '');
    setFormBenefits(product.benefits ? product.benefits.join(', ') : '');
    setIsProductModalOpen(true);
  };

  // Handle Save (Create/Update) product either in database or local mock fallback
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const parsedBenefits = formBenefits.split(',').map(b => b.trim()).filter(b => b.length > 0);
    
    const productPayload = {
      title: formTitle,
      description: formDescription,
      price_numeric: Number(formPrice),
      price_formatted: Number(formPrice) > 0 
        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(formPrice)
        : 'Hubungi Sales',
      unit: formUnit,
      badge: formBadge || null,
      image_url: formImageUrl || null,
      benefits: parsedBenefits
    };

    if (supabaseClient && isDbReady) {
      try {
        setIsLoadingProducts(true);
        let error;
        
        if (editingProduct) {
          // Update existing row
          const { error: err } = await supabaseClient
            .from('elova_products')
            .update(productPayload)
            .eq('id', editingProduct.id);
          error = err;
        } else {
          // Insert new row
          const { error: err } = await supabaseClient
            .from('elova_products')
            .insert([productPayload]);
          error = err;
        }

        if (error) throw error;
        
        triggerNotification(editingProduct ? "Produk berhasil diperbarui!" : "Produk baru berhasil ditambahkan!");
        fetchPublicProducts(supabaseClient); // Reload live catalog
        setIsProductModalOpen(false);
      } catch (err) {
        alert(`Gagal menyimpan produk: ${err.message}`);
      } finally {
        setIsLoadingProducts(false);
      }
    } else {
      // Offline local mock simulation update
      if (editingProduct) {
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productPayload } : p));
        triggerNotification("Produk diperbarui di mode lokal!");
      } else {
        const newMockId = `mock-${Date.now()}`;
        setProducts([...products, { id: newMockId, ...productPayload }]);
        triggerNotification("Produk baru ditambahkan di mode lokal!");
      }
      setIsProductModalOpen(false);
    }
  };

  // Delete product row
  const handleDeleteProduct = async (productId) => {
    if (confirm("Apakah Anda yakin ingin menghapus produk ini dari katalog?")) {
      if (supabaseClient && isDbReady) {
        try {
          setIsLoadingProducts(true);
          const { error } = await supabaseClient
            .from('elova_products')
            .delete()
            .eq('id', productId);
          
          if (error) throw error;
          
          triggerNotification("Produk berhasil dihapus!");
          fetchPublicProducts(supabaseClient); // Reload live catalog
        } catch (err) {
          alert(`Gagal menghapus produk: ${err.message}`);
        } finally {
          setIsLoadingProducts(false);
        }
      } else {
        setProducts(products.filter(p => p.id !== productId));
        triggerNotification("Produk dihapus dari mode lokal!");
      }
    }
  };

  // Load Admin Data when visiting Admin View directly
  useEffect(() => {
    if (currentView === 'admin' && supabaseClient) {
      if (!adminUser) {
        // Guard route: redirect unauthorized to login
        window.location.hash = '#/login';
      } else {
        fetchLeads(supabaseClient);
      }
    }
  }, [currentView, adminUser, supabaseClient]);

  // Helper to trigger custom system notification
  const triggerNotification = (message) => {
    setSystemNotification(message);
    setTimeout(() => {
      setSystemNotification(null);
    }, 4000);
  };

  const tutorialSteps = [
    {
      id: 1,
      num: "01",
      title: "Semai Bibit Anda",
      description: "Masukkan media tanam dan benih pilihan Anda langsung ke dalam pot Elova. Struktur serat pelepah pisang kami menahan kelembaban dan mengikat nutrisi tanah dengan optimal.",
      svg: (
        <svg viewBox="0 0 200 200" className="w-full h-full max-h-[260px]" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" fill="#EDF1E4" />
          <path d="M70 140 L130 140 L120 90 L80 90 Z" fill="#A3B18A" opacity="0.8" stroke="#374F3B" strokeWidth="3" strokeLinejoin="round" />
          <path d="M75 135 L125 135 L117 98 L83 98 Z" fill="#374F3B" opacity="0.1" />
          <path d="M81 95 C95 90 105 98 119 95 L116 110 L84 110 Z" fill="#374F3B" opacity="0.4" />
          <path d="M100 95 C100 95 90 75 100 55 C110 75 100 95 100 95 Z" fill="#374F3B" />
          <path d="M100 70 C100 70 110 65 115 55 C110 55 100 65 100 70 Z" fill="#A3B18A" />
          <circle cx="100" cy="95" r="4" fill="#374F3B" />
        </svg>
      )
    },
    {
      id: 2,
      num: "02",
      title: "Rawat & Siram Berkala",
      description: "Siram benih Anda secara berkala. Struktur pori mikro alami dari pelepah pisang menjamin sirkulasi udara (aerasi) yang melimpah ke akar bibit sehingga mencegah pembusukan.",
      svg: (
        <svg viewBox="0 0 200 200" className="w-full h-full max-h-[260px]" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" fill="#EDF1E4" />
          <path d="M70 140 L130 140 L120 90 L80 90 Z" fill="#A3B18A" opacity="0.8" stroke="#374F3B" strokeWidth="3" strokeLinejoin="round" />
          <path d="M100 90 C100 90 85 65 100 40 C115 65 100 90 100 90 Z" fill="#374F3B" />
          <path d="M100 40 C100 40 115 30 125 15 C115 15 100 30 100 40 Z" fill="#A3B18A" />
          <circle cx="85" cy="65" r="2.5" fill="#374F3B" />
          <circle cx="115" cy="60" r="2.5" fill="#374F3B" />
        </svg>
      )
    },
    {
      id: 3,
      num: "03",
      title: "Tanam Langsung Bersama Pot",
      description: "Saat bibit telah siap dipindahkan, letakkan seluruh pot Elova langsung ke dalam tanah/pot besar. Pot akan melebur menjadi bahan organik tanah tanpa mengganggu pertumbuhan akar sedikit pun.",
      svg: (
        <svg viewBox="0 0 200 200" className="w-full h-full max-h-[260px]" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" fill="#EDF1E4" />
          <path d="M30 135 C70 125 130 145 170 135 L170 180 L30 180 Z" fill="#374F3B" opacity="0.9" />
          <path d="M80 148 L120 148 L115 115 L85 115 Z" fill="#A3B18A" stroke="#EDF1E4" strokeWidth="2.5" strokeDasharray="4 3" />
          <path d="M100 115 L100 65" stroke="#EDF1E4" strokeWidth="4" />
          <path d="M100 85 C115 85 125 75 130 60 C115 70 105 85 100 85 Z" fill="#EDF1E4" />
        </svg>
      )
    }
  ];

  // Open purchase modal and set initial values
  const initiatePurchase = (product) => {
    setSelectedProduct(product);
    setIsLogSuccess(false);
    if (product.price_numeric > 0) {
      setQuantity(10);
      const initialMessage = `Halo Elova, saya ingin memesan ${10} pcs "${product.title}". Bagaimana prosedur pengiriman dan pembayarannya?`;
      setCustomMessage(initialMessage);
    } else {
      const initialMessage = `Halo Elova, saya tertarik untuk berkonsultasi mengenai "${product.title}" untuk kebutuhan bisnis/partai besar saya.`;
      setCustomMessage(initialMessage);
    }
    setIsModalOpen(true);
  };

  // Handle calculator adjustments inside purchase modal
  const handleQuantityChange = (newQty) => {
    const qty = Math.max(1, parseInt(newQty) || 1);
    setQuantity(qty);
    const totalPrice = qty * selectedProduct.price_numeric;
    const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalPrice);
    
    const updatedMessage = `Halo Elova, saya ingin memesan ${qty} pcs "${selectedProduct.title}" (Total: ${formattedPrice}). Bagaimana prosedur pengiriman dan pembayarannya?`;
    setCustomMessage(updatedMessage);
  };

  // Confirm Purchase, send lead, open WhatsApp external link
  const handleConfirmPurchase = async () => {
    const totalPrice = selectedProduct.price_numeric > 0 ? (quantity * selectedProduct.price_numeric) : 0;
    
    // Log lead in database silently if connected
    if (isDbReady && supabaseClient) {
      try {
        await supabaseClient
          .from('elova_whatsapp_leads')
          .insert([
            {
              product_title: selectedProduct.title,
              quantity: selectedProduct.price_numeric > 0 ? quantity : 1,
              total_price: totalPrice
            }
          ]);
      } catch (err) {
        console.error("Gagal mencatat konversi:", err);
      }
    }

    // Open WhatsApp URL
    const encodedMessage = encodeURIComponent(customMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=62881037144574&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setIsModalOpen(false);
    triggerNotification("Membuka chat WhatsApp. Terima kasih telah memesan!");
  };

  // Derived Admin Statistics
  const totalLeadsCount = leads.length;
  const totalEstimatedRevenue = leads.reduce((sum, item) => sum + Number(item.total_price || 0), 0);

  return (
    <div className="min-h-screen text-[#0A0A0A] font-sans selection:bg-[#A3B18A] selection:text-[#374F3B]" style={{ backgroundColor: '#FAFAFA' }}>
      
      {/* GLOBAL SYSTEM NOTIFICATION BANNER */}
      {systemNotification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-[#374F3B] text-white px-6 py-3 rounded-full shadow-lg border border-[#A3B18A]/50 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>🌿</span> {systemNotification}
        </div>
      )}

      {/* VIEW CONTROLLER AND RENDERING */}

      {/* =========================================
          VIEW 1: LANDING PAGE (CUSTOMER VIEW)
          ========================================= */}
      {currentView === 'landing' && (
        <>
          {/* Decorative Gradient Background Spot */}
          <div className="absolute inset-0 bg-radial-[circle_at_top_right,_var(--tw-gradient-stops)] from-[#EDF1E4]/30 via-transparent to-transparent pointer-events-none h-[800px] z-0" />

          {/* PUBLIC HEADER */}
          <header className="sticky top-0 z-40 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-[#E5E7EB]">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="https://amxvgzrrikccjgtfktpa.supabase.co/storage/v1/object/public/elova-media/logo.png"
                  alt="Elova Logo"
                  className="w-10 h-10 object-cover"
                />
                <span className="font-semibold text-2xl tracking-tight text-[#374F3B]">Elova</span>
              </div>

              <nav className="hidden md:flex items-center gap-8">
                <a href="#hero" className="text-sm font-medium text-[#6B7280] hover:text-[#374F3B] transition-colors">Home</a>
                <a href="#sejarah" className="text-sm font-medium text-[#6B7280] hover:text-[#374F3B] transition-colors">Sejarah</a>
                <a href="#katalog" className="text-sm font-medium text-[#6B7280] hover:text-[#374F3B] transition-colors">Katalog</a>
                <a href="#edukasi" className="text-sm font-medium text-[#6B7280] hover:text-[#374F3B] transition-colors">Cara Penggunaan</a>
              </nav>

              <div className="hidden md:block">
                <a 
                  href="https://api.whatsapp.com/send?phone=62881037144574&text=Halo%20Elova,%20saya%20ingin%20berkonsultasi%20mengenai%20pot%20semai%20biodegradable!"
                  target="_blank"
                  className="inline-block px-5 py-2.5 rounded-lg border-2 border-[#374F3B] text-[#374F3B] hover:bg-[#374F3B] hover:text-white font-semibold text-sm transition-all"
                >
                  Hubungi Kami ↗
                </a>
              </div>

              {/* Navigation Hamburger on Mobile */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="md:hidden p-2 text-[#374F3B] focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden bg-white border-b border-[#E5E7EB] px-6 py-5 flex flex-col gap-4 animate-fadeIn">
                <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-[#6B7280]">Home</a>
                <a href="#sejarah" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-[#6B7280]">Sejarah</a>
                <a href="#katalog" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-[#6B7280]">Katalog</a>
                <a href="#edukasi" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-[#6B7280]">Cara Penggunaan</a>
                <a 
                  href="https://api.whatsapp.com/send?phone=62881037144574&text=Halo%20Elova!"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-5 py-3 rounded-lg bg-[#374F3B] text-white font-semibold text-sm"
                >
                  Hubungi Kami ↗
                </a>
              </div>
            )}
          </header>

          <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
            {/* HERO SECTION */}
            <section id="hero" className="py-12 md:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 flex flex-col items-start gap-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EDF1E4] text-[#374F3B] text-xs font-bold uppercase tracking-wider">
                  <FaLeaf className="text-lg" /> Alternatif Ramah Lingkungan Pengganti Polybag
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#0A0A0A] leading-[1.1]">
                  Pot Semai Pelepah Pisang: <span className="text-[#374F3B] underline decoration-[#A3B18A] decoration-wavy underline-offset-8">Solusi Hijau</span> Bebas Sampah Plastik.
                </h1>

                <p className="text-base md:text-lg text-[#6B7280] leading-relaxed max-w-xl">
                  Ganti polybag plastik dan seed tray Anda dengan Elova. Dapat langsung ditanam bersama bibit ke dalam tanah untuk menekan sampah plastik perkebunan dan mencegah risiko kerusakan akar.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mt-2">
                  <a 
                    href="#katalog"
                    className="px-8 py-4 rounded-xl bg-[#374F3B] text-white font-semibold text-md hover:bg-[#A3B18A] hover:shadow-lg active:scale-98 transition-all text-center flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    Pilih Produk & Pesan <span className="group-hover:translate-x-1 transition-transform">↗</span>
                  </a>
                  <a 
                    href="#sejarah" 
                    className="px-6 py-4 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#374F3B] hover:border-[#374F3B] font-semibold text-md text-center transition-all flex items-center justify-center gap-1"
                  >
                    Pelajari Sejarah
                  </a>
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#E5E7EB] w-full max-w-lg mt-4">
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-[#374F3B]">100%</p>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Organik Alami</p>
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-[#374F3B]">Bebas</p>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Zat Kimia</p>
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-[#374F3B]">Mencegah</p>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wider font-semibold">Root Shock</p>
                  </div>
                </div>
              </div>

              {/* Hero Collage Bento Style */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4 h-[380px] md:h-[480px]">
                <div className="col-span-2 bg-[#EDF1E4] rounded-2xl relative overflow-hidden flex flex-col justify-end p-6 border border-[#E5E7EB] group hover:border-[#374F3B] transition-all">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#374F3B]/40 to-transparent z-10" />
                  <div className="absolute inset-0 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700">
                    <svg viewBox="0 0 200 200" className="w-40 h-40 text-[#374F3B]" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M100 160 L100 80" stroke="#374F3B" strokeWidth="4" strokeLinecap="round" />
                      <path d="M100 120 C120 120 145 105 145 75 C120 85 100 100 100 120 Z" fill="#A3B18A" opacity="0.85" />
                      <path d="M100 100 C80 100 55 85 55 55 C80 65 100 80 100 100 Z" fill="#374F3B" />
                      <circle cx="100" cy="160" r="14" fill="#374F3B" opacity="0.15" />
                    </svg>
                  </div>
                  <div className="relative z-20 text-white font-sans">
                    <span className="text-xs font-bold tracking-wider uppercase bg-[#374F3B] px-2.5 py-1 rounded">Nilai Utama</span>
                    <h3 className="text-lg md:text-xl font-bold mt-2 leading-snug">Menanam Bersama Alam Tanpa Meninggalkan Jejak Mikroplastik</h3>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 flex flex-col justify-between border border-[#E5E7EB] hover:border-[#374F3B] transition-all">
                  <GiBananaBunch className="text-2xl text-[#374F3B]" />
                  <div>
                    <h4 className="font-bold text-[#374F3B] text-sm">Upcycle Berdampak</h4>
                    <p className="text-xs text-[#6B7280] mt-1">Dibuat dari sisa serat pelepah pisang petani lokal Indonesia.</p>
                  </div>
                </div>

                <div className="bg-[#374F3B] text-white rounded-2xl p-5 flex flex-col justify-between border border-[#E5E7EB] hover:bg-[#374F3B]/95 transition-all">
                  <FaLeaf className="text-2xl" />
                  <div>
                    <h4 className="font-bold text-sm">Praktis & Instan</h4>
                    <p className="text-xs text-[#EDF1E4] mt-1">Cukup kubur pot utuh, biarkan terurai dan menyatu dengan bumi.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SEJARAH SECTION */}
            <section id="sejarah" className="py-16 md:py-24 border-t border-[#E5E7EB]">
              <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center gap-3">
                <span className="text-xs font-bold tracking-widest text-[#A3B18A] uppercase">Sejarah Elova</span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0A0A0A]">Diciptakan untuk Sirkularitas</h2>
                <p className="text-[#6B7280] text-sm md:text-base leading-relaxed">
                  Kami memproses limbah pelepah pisang yang kerap dibakar sia-sia menjadi produk esensial berkebun yang higienis, bersih, dan solutif.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 bg-white rounded-3xl p-8 border border-[#E5E7EB] hover:border-[#374F3B] transition-all flex flex-col justify-between group min-h-[320px]">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-[#EDF1E4] flex items-center justify-center text-xl"><GiRecycle className="text-[#374F3B]" /></div>
                    <span className="text-xs font-bold text-[#A3B18A] uppercase tracking-wider">Komposisi Bahan</span>
                  </div>
                  <div className="my-6">
                    <span className="text-7xl md:text-8xl font-extrabold text-[#374F3B] tracking-tighter block group-hover:scale-105 transition-transform origin-left duration-300">100%</span>
                    <h3 className="text-xl font-bold text-[#0A0A0A] mt-2">Bahan Organik Tanpa Lem Sintetis</h3>
                  </div>
                  <p className="text-[#6B7280] text-sm leading-relaxed">
                    Murni mengandalkan ikatan alami selulosa pelepah pisang melalui kempa panas tinggi tanpa kontaminasi lem perekat sintetis.
                  </p>
                </div>

                <div className="md:col-span-7 bg-[#EDF1E4] rounded-3xl p-8 border border-[#E5E7EB] hover:border-[#374F3B] transition-all flex flex-col justify-between min-h-[320px] relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-15 md:opacity-100 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full p-4 text-[#374F3B]" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 50 C20 30 40 10 50 10 C60 10 80 30 80 50 C80 70 60 90 50 90 C40 90 20 70 20 50 Z" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                      <path d="M50 15 L50 85" stroke="currentColor" strokeWidth="2" />
                      <path d="M35 35 L50 50 L65 35" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="relative z-10 flex flex-col justify-between h-full gap-8">
                    <div>
                      <span className="text-xs font-bold text-[#374F3B] uppercase tracking-wider bg-white/60 px-2.5 py-1 rounded">Proses Pembuatan</span>
                      <h3 className="text-2xl font-bold text-[#374F3B] mt-4 max-w-md leading-tight">Pengolahan Serat Tanpa Polusi Kimia</h3>
                    </div>
                    <p className="text-[#374F3B]/80 text-sm leading-relaxed max-w-md">
                      Ekstraksi serat pelepah mekanis steril ditekan pada cetakan presisi tinggi untuk menghasilkan pot kokoh namun ramah tanah.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* KATALOG PRODUK SECTION */}
            <section id="katalog" className="py-16 md:py-24 border-t border-[#E5E7EB]">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <span className="text-xs font-bold tracking-widest text-[#A3B18A] uppercase">Pilihan Produk</span>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0A0A0A] mt-2">Katalog Elova</h2>
                  <p className="text-[#6B7280] text-sm md:text-base mt-2">Pilih ukuran paket semai ramah lingkungan yang paling cocok untuk kebun impian Anda.</p>
                </div>
              </div>

              {isLoadingProducts ? (
                <div className="text-center py-12 text-[#6B7280] font-semibold flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-[#374F3B] border-t-transparent rounded-full animate-spin"></div>
                  Memuat katalog database...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {products.map((product) => (
                    <div 
                      key={product.id} 
                      className="bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#374F3B] transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      <div className="h-56 bg-gradient-to-br from-[#EDF1E4] to-[#C2CDA8] relative overflow-hidden flex flex-col justify-between p-6">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.title} 
                            onError={(e) => {
                              e.target.onerror = null; 
                              e.target.style.display = 'none';
                            }}
                            className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-12 z-0">
                            <svg viewBox="0 0 100 100" className="w-full h-full text-[#374F3B]/10 group-hover:scale-110 transition-transform duration-500" fill="currentColor">
                              <path d="M50 90 Q30 50 50 10 Q70 50 50 90" />
                            </svg>
                          </div>
                        )}

                        <div className="flex justify-between items-center z-10 relative">
                          <span className="px-3 py-1 rounded-full bg-white/90 text-[#374F3B] text-xs font-bold shadow-sm">
                            {product.badge || "E-Pot"}
                          </span>
                          <FaLeaf className="text-xl bg-white/90 p-1.5 rounded-full shadow-sm leading-none select-none" />
                        </div>

                        <div className="relative z-10">
                          <span className="text-xs text-[#374F3B] font-bold block uppercase tracking-widest opacity-80">Kategori</span>
                          <span className="text-sm font-semibold text-[#374F3B]">Pot Semai Organik</span>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col gap-4 flex-grow justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[#0A0A0A] group-hover:text-[#374F3B] transition-colors">{product.title}</h3>
                          <p className="text-[#6B7280] text-xs leading-relaxed mt-2">{product.description}</p>
                          
                          <ul className="mt-4 flex flex-col gap-1.5">
                            {product.benefits && product.benefits.map((benefit, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-xs text-[#6B7280]">
                                <HiCheck className="text-[#374F3B] font-bold" /> {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-4 border-t border-[#E5E7EB] flex flex-col gap-3">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-[#374F3B]">
                              {product.price_formatted || (product.price_numeric > 0 ? `Rp ${product.price_numeric.toLocaleString('id-ID')}` : 'Hubungi Sales')}
                            </span>
                            {product.price_numeric > 0 && <span className="text-xs text-[#6B7280]">/ {product.unit}</span>}
                          </div>
                          
                          <button 
                            onClick={() => initiatePurchase(product)}
                            className="w-full py-3 rounded-xl bg-[#EDF1E4] hover:bg-[#374F3B] text-[#374F3B] hover:text-white font-bold text-sm transition-all duration-200 active:scale-95 text-center flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Beli Sekarang ↗
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* CARA PENGGUNAAN SECTION */}
            <section id="edukasi" className="py-16 md:py-24 border-t border-[#E5E7EB]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6 flex flex-col gap-6">
                  <div>
                    <span className="text-xs font-bold tracking-widest text-[#A3B18A] uppercase">Edukasi Mudah</span>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0A0A0A] mt-2">Cara Penggunaan Elova</h2>
                    <p className="text-[#6B7280] text-sm md:text-base mt-2">Sangat mudah dialihkan bagi pemula kebun rumahan hingga pertanian besar.</p>
                  </div>

                  <div className="flex flex-col gap-4 mt-4">
                    {tutorialSteps.map((step) => {
                      const isActive = activeStep === step.id;
                      return (
                        <div 
                          key={step.id}
                          onClick={() => setActiveStep(step.id)}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-[#EDF1E4] border-[#374F3B] shadow-sm' 
                              : 'bg-white border-[#E5E7EB] hover:border-[#374F3B]/50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`text-lg font-bold ${isActive ? 'text-[#374F3B]' : 'text-[#A3B18A]'}`}>
                              {step.num}
                            </span>
                            <h3 className={`font-bold text-md ${isActive ? 'text-[#374F3B]' : 'text-[#0A0A0A]'}`}>
                              {step.title}
                            </h3>
                          </div>
                          {isActive && (
                            <p className="text-[#374F3B]/90 text-sm leading-relaxed mt-3 pl-8 animate-fadeIn">
                              {step.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E5E7EB] p-8 flex flex-col items-center justify-center min-h-[380px]">
                  <div className="w-full max-w-xs flex flex-col items-center gap-4">
                    {tutorialSteps.find(s => s.id === activeStep)?.svg}
                    <span className="text-xs font-bold text-[#A3B18A] uppercase tracking-wider">Visual Panduan Langkah {activeStep}</span>
                  </div>
                </div>
              </div>
            </section>
          </main>

          {/* FOOTER */}
          <footer className="bg-[#374F3B] text-white border-t border-[#EDF1E4]/10 py-16 mt-16 relative z-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://amxvgzrrikccjgtfktpa.supabase.co/storage/v1/object/public/elova-media/logo.png"
                    alt="Elova Logo"
                    className="w-10 h-10 object-cover"
                  />
                  <span className="font-semibold text-2xl tracking-tight text-white">Elova</span>
                </div>
                <p className="text-[#EDF1E4]/80 text-sm max-w-md leading-relaxed mt-2">
                  Elova berkomitmen menghadirkan produk budidaya organik bebas plastik berbasis bahan pelepah pisang demi menyembuhkan bumi Indonesia.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#A3B18A] text-sm uppercase tracking-wider mb-4">Navigasi</h4>
                <ul className="flex flex-col gap-2.5 text-sm text-[#EDF1E4]/80">
                  <li><a href="#hero" className="hover:text-white">Home</a></li>
                  <li><a href="#sejarah" className="hover:text-white">Sejarah</a></li>
                  <li><a href="#katalog" className="hover:text-white">Katalog</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-[#A3B18A] text-sm uppercase tracking-wider mb-4">Portal Internal</h4>
                <p className="text-xs text-[#EDF1E4]/60 mb-3">Tautan khusus manajemen admin.</p>
                <a href="#/login" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-[#EDF1E4] text-xs font-semibold rounded-lg transition-colors w-fit">
                  <HiLockClosed /> Portal Admin Elova
                </a>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-[#EDF1E4]/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#EDF1E4]/60">
              <p>© 2026 Elova Indonesia. Seluruh hak cipta dilindungi.</p>
            </div>
          </footer>
        </>
      )}

      {/* =========================================
          VIEW 2: SECURE LOGIN PAGE
          ========================================= */}
      {currentView === 'login' && (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6 relative">
          <div className="absolute inset-0 bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-[#EDF1E4]/40 via-transparent to-transparent pointer-events-none" />
          
          <div className="bg-white rounded-3xl border border-[#E5E7EB] w-full max-w-md p-8 shadow-sm relative z-10">
            <div className="flex flex-col items-center text-center gap-3 mb-8">
              <img 
                src="https://amxvgzrrikccjgtfktpa.supabase.co/storage/v1/object/public/elova-media/logo.png"
                alt="Elova Logo"
                className="w-12 h-12 object-cover"
              />
              <h2 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">Portal Admin Elova</h2>
              <p className="text-xs text-[#6B7280] max-w-xs">
                Masukkan kredensial admin Anda untuk memantau data pesanan dan aktivitas konversi WhatsApp.
              </p>
            </div>

            {authError && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-200 leading-relaxed mb-5 font-medium flex items-center gap-2">
                <HiExclamation /> {authError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#374F3B] uppercase mb-1.5 tracking-wider">Email Admin</label>
                <input 
                  type="email" 
                  required
                  placeholder="admin@elova.id"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full text-sm px-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#374F3B] text-[#0A0A0A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374F3B] uppercase mb-1.5 tracking-wider">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-sm px-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#374F3B] text-[#0A0A0A]"
                />
              </div>

              <button 
                type="submit" 
                disabled={isAuthenticating}
                className="w-full py-3.5 rounded-xl bg-[#374F3B] hover:bg-[#A3B18A] text-white font-bold text-sm transition-all shadow-md active:scale-98 mt-2 cursor-pointer flex justify-center items-center gap-2"
              >
                {isAuthenticating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : 'Masuk Portal Admin'}
              </button>
            </form>

            <div className="text-center mt-6">
              <a href="#/" className="text-xs text-[#374F3B] hover:underline font-bold">
                ← Kembali ke Beranda Utama
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          VIEW 3: SECURE ADMIN DASHBOARD
          ========================================= */}
      {currentView === 'admin' && (
        <div className="min-h-screen bg-[#FAFAFA]">
          {/* Admin Bar */}
          <header className="bg-[#374F3B] text-white py-4 px-6 sticky top-0 z-30 shadow-md">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="https://amxvgzrrikccjgtfktpa.supabase.co/storage/v1/object/public/elova-media/logo.png"
                  alt="Elova Logo"
                  className="w-8 h-8 object-cover"
                />
                <div>
                  <span className="font-bold text-md tracking-tight">elova</span>
                  <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-widest">Dashboard Admin</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="hidden sm:inline text-white/80">Login as: {adminUser?.email}</span>
                <button 
                  onClick={handleAdminLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-2"
                >
                  <MdLogout /> Logout
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
            
            {/* KPI STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] flex flex-col justify-between">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Total Leads (Klik WA)</span>
                <span className="text-4xl font-extrabold text-[#374F3B] mt-2 block">
                  {totalLeadsCount} <span className="text-sm font-semibold text-[#6B7280]">Interaksi</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-medium mt-2 flex items-center gap-1"><HiCheck className="text-xs" /> Tercatat di Cloud Database</span>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] flex flex-col justify-between">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Nilai Estimasi Omset</span>
                <span className="text-4xl font-extrabold text-[#374F3B] mt-2 block">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalEstimatedRevenue)}
                </span>
                <span className="text-[10px] text-[#6B7280] mt-2">*Berdasarkan kuantitas yang dipilih pengunjung</span>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] flex flex-col justify-between">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Status Konektivitas</span>
                <span className="text-2xl font-bold text-emerald-700 mt-2 block flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Live database OK
                </span>
                <span className="text-[10px] text-[#6B7280] mt-2">Sinkronisasi otomatis berjalan</span>
              </div>
            </div>

            {/* LEADS TRACKER LIST TABLE */}
            <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#0A0A0A]">Riwayat Klik WhatsApp (Leads)</h3>
                  <p className="text-xs text-[#6B7280]">Data rincian pembelian yang dikirimkan langsung dari interaksi pengunjung landing page.</p>
                </div>
                <button 
                  onClick={() => fetchLeads(supabaseClient)}
                  className="px-4 py-2 border border-[#E5E7EB] hover:bg-[#EDF1E4] text-xs font-bold rounded-xl transition-all cursor-pointer self-start flex items-center gap-2"
                >
                  <MdRefresh /> Segarkan Data
                </button>
              </div>

              {isLoadingLeads ? (
                <div className="text-center py-12 text-[#6B7280] font-semibold flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-[#374F3B] border-t-transparent rounded-full animate-spin"></div>
                  Memuat log konversi...
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center gap-2 text-[#6B7280]">
                  <MdOutlineInbox className="text-4xl" />
                  <p className="font-semibold text-sm text-[#0A0A0A]">Belum Ada Leads Masuk</p>
                  <p className="text-xs max-w-xs leading-relaxed">Setelah pengunjung mengklik tombol pemesanan WhatsApp, datanya akan terhimpun otomatis di sini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                        <th className="py-3 px-4">Tanggal Masuk</th>
                        <th className="py-3 px-4">Nama Produk</th>
                        <th className="py-3 px-4 text-center">Jumlah Pesanan</th>
                        <th className="py-3 px-4 text-right">Estimasi Nominal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id} className="border-b border-[#FAFAFA] last:border-none hover:bg-[#FAFAFA] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-[#6B7280]">
                            {new Date(lead.created_at).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#0A0A0A]">{lead.product_title}</td>
                          <td className="py-3.5 px-4 text-center font-semibold text-[#374F3B]">{lead.quantity} pcs</td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#374F3B]">
                            {lead.total_price > 0 
                              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(lead.total_price) 
                              : 'Hubungi Sales'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* QUICK CATALOG REFERENCE - UPGRADED TO LIVE CATALOG CRUD MANAGER */}
            <div className="bg-white rounded-3xl border border-[#E5E7EB] p-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-[#E5E7EB] pb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#0A0A0A]">Manajemen Katalog Produk</h3>
                  <p className="text-xs text-[#6B7280]">Tambah, edit, atau hapus produk aktif yang dijual pada Landing Page Anda secara langsung.</p>
                </div>
                <button 
                  onClick={openAddProductModal}
                  className="px-5 py-2.5 bg-[#374F3B] hover:bg-[#A3B18A] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  Tambah Produk Baru ➕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map(p => (
                  <div key={p.id} className="p-5 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] flex flex-col justify-between group hover:border-[#374F3B] transition-all">
                    <div>
                      <div className="h-28 rounded-xl bg-slate-200 mb-4 overflow-hidden relative">
                        {p.image_url ? (
                          <img src={p.image_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#EDF1E4] text-xs font-semibold text-[#374F3B]">
                            Tanpa Foto (Fallback SVG Aktif)
                          </div>
                        )}
                        {p.badge && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-white text-[10px] font-bold text-[#374F3B] shadow-sm">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-[#0A0A0A]">{p.title}</h4>
                      <p className="text-xs text-[#6B7280] line-clamp-2 mt-1">{p.description}</p>
                      
                      <div className="mt-3 flex flex-wrap gap-1">
                        {p.benefits && p.benefits.map((b, idx) => (
                          <span key={idx} className="bg-white text-[10px] text-[#6B7280] px-2 py-0.5 rounded border border-[#E5E7EB]">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-[#E5E7EB] mt-4 flex flex-col gap-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Harga Utama</span>
                        <span className="font-bold text-sm text-[#374F3B]">
                          {p.price_formatted || (p.price_numeric > 0 ? `Rp ${p.price_numeric.toLocaleString('id-ID')}` : 'Hubungi Sales')}
                        </span>
                      </div>
                      
                      {/* Action buttons inside admin card catalog */}
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button 
                          onClick={() => openEditProductModal(p)}
                          className="py-2 text-center text-xs font-bold border border-[#E5E7EB] rounded-lg hover:bg-[#EDF1E4] hover:text-[#374F3B] transition-all cursor-pointer"
                        >
                          Ubah ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="py-2 text-center text-xs font-bold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                        >
                          Hapus 🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </main>
        </div>
      )}

      {/* =========================================
          GLOBAL CALCULATOR & WHATSAPP MODAL
          ========================================= */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-[#E5E7EB] flex flex-col animate-scaleUp">
            
            <div className="bg-[#374F3B] text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#A3B18A]">Detail Pembelian</span>
                  <h3 className="text-xl font-bold mt-1">{selectedProduct.title}</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-all text-sm h-8 w-8 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-5">
              
              {selectedProduct.price_numeric > 0 ? (
                <div className="bg-[#FAFAFA] p-4 rounded-2xl border border-[#E5E7EB]">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                    Tentukan Jumlah Pembelian ({selectedProduct.unit})
                  </label>
                  
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" 
                      min="1"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="w-24 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#374F3B] font-bold text-[#0A0A0A]"
                    />
                    <div className="flex-grow flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-[#E5E7EB]">
                      <span className="text-xs text-[#6B7280]">Total Estimasi</span>
                      <span className="text-lg font-bold text-[#374F3B]">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(quantity * selectedProduct.price_numeric)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#EDF1E4] p-4 rounded-2xl border border-[#A3B18A]/30">
                  <p className="text-sm text-[#374F3B] leading-relaxed">
                    Untuk pemesanan kustomisasi ukuran atau pesanan partai besar (Nursery/Perkebunan), silakan klik konfirmasi di bawah untuk mulai berdiskusi langsung mengenai penawaran harga terbaik.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Draf Pesan WhatsApp Anda
                </label>
                <textarea 
                  rows="3"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] text-[#0A0A0A] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#374F3B]"
                />
              </div>

              <button 
                onClick={handleConfirmPurchase}
                className="w-full py-4 rounded-2xl bg-[#374F3B] text-white font-bold text-md hover:bg-[#A3B18A] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>💬</span> Kirim Pesan & Hubungi WhatsApp Elova
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* =========================================
          GLOBAL CRUD PRODUCT POPUP MODAL
          ========================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-[#E5E7EB] flex flex-col animate-scaleUp">
            
            <div className="bg-[#374F3B] text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#A3B18A]">Katalog Editor</span>
                  <h3 className="text-xl font-bold mt-1">
                    {editingProduct ? `Ubah Produk: ${editingProduct.title}` : 'Tambah Produk Baru ke Toko'}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-all text-sm h-8 w-8 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[500px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">Nama Produk *</label>
                  <input 
                    type="text" 
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Elova Seedling Cup 8cm"
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#374F3B] text-[#0A0A0A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">Tag / Badge Utama</label>
                  <input 
                    type="text" 
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="Contoh: Best Seller, Kustom, dll"
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#374F3B] text-[#0A0A0A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">Deskripsi Singkat *</label>
                <textarea 
                  required
                  rows="2"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Deskripsikan ukuran, kecocokan tanaman, dan daya urainya..."
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#374F3B] text-[#0A0A0A]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">Harga Angka (Rupiah) *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="Contoh: 2500 (Tulis 0 jika Hubungi Sales)"
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#374F3B] text-[#0A0A0A] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">Satuan Harga *</label>
                  <input 
                    type="text" 
                    required
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="Contoh: pcs, pack, set"
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#374F3B] text-[#0A0A0A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">URL Foto Produk asli (Optional)</label>
                <input 
                  type="url" 
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="Contoh: https://supabase.../pot-6cm.jpg"
                  className="w-full text-xs px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#374F3B] text-[#0A0A0A] font-mono"
                />
                <p className="text-[10px] text-[#6B7280] mt-1">Kosongkan jika ingin menggunakan visual gambar ikon generator bawaan.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1">Poin Kelebihan Produk (Pisahkan dengan tanda koma)</label>
                <input 
                  type="text" 
                  value={formBenefits}
                  onChange={(e) => setFormBenefits(e.target.value)}
                  placeholder="Bahan Pelepah, Diameter: 8cm, Pengurai Cepat"
                  className="w-full text-xs px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#374F3B] text-[#0A0A0A]"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                <button 
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold border border-[#E5E7EB] text-[#6B7280] rounded-xl hover:bg-[#FAFAFA] transition-all cursor-pointer"
                >
                  Batalkan
                </button>
                <button 
                  type="submit"
                  disabled={isLoadingProducts}
                  className="flex-1 py-3 text-sm font-bold bg-[#374F3B] text-white rounded-xl hover:bg-[#A3B18A] active:scale-98 transition-all cursor-pointer shadow-sm text-center"
                >
                  {isLoadingProducts ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}