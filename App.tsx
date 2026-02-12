import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FoodRecommendation } from './types';
import { fetchFoodRecommendation, generateFoodImage } from './services/geminiService';
import { getFavorites, addFavorite, removeFavorite, migrateFromLocalStorage } from './services/storage';
import LoadingSpinner from './components/LoadingSpinner';
import FoodDetails from './components/FoodDetails';
import FavoritesList from './components/FavoritesList';

type ViewMode = 'home' | 'favorites' | 'detail';

const App: React.FC = () => {
  // Data State
  const [food, setFood] = useState<FoodRecommendation | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // Favorites State
  const [favorites, setFavorites] = useState<FoodRecommendation[]>([]);
  const [selectedFavorite, setSelectedFavorite] = useState<FoodRecommendation | null>(null);

  // UI State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [view, setView] = useState<ViewMode>('home');
  
  const contentRef = useRef<HTMLDivElement>(null);

  // Load favorites from IndexedDB on mount
  useEffect(() => {
    const initStorage = async () => {
      try {
        // Check for old data to migrate first
        await migrateFromLocalStorage();
        // Load data from DB
        const stored = await getFavorites();
        // Sort by savedAt descending (newest first)
        const sorted = stored.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
        setFavorites(sorted);
      } catch (e) {
        console.error("Failed to load favorites database", e);
      }
    };
    initStorage();
  }, []);

  const loadRecommendation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFood(null);
    setImageUrl(null);
    setView('home');

    try {
      // 1. Fetch Text Data
      const data = await fetchFoodRecommendation();
      setFood(data);

      // 2. Start Image Generation
      const generatedImage = await generateFoodImage(data.name, data.description);
      setImageUrl(generatedImage);

    } catch (err: any) {
      console.error(err);
      setError("无法获取美食推荐，请稍后再试。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load only if not in favorites view initially (though we default to home)
    loadRecommendation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleFavorite = async () => {
    const currentFood = view === 'detail' ? selectedFavorite : food;
    const currentImage = view === 'detail' ? selectedFavorite?.savedImageUrl : imageUrl;

    if (!currentFood) return;

    const exists = favorites.some(f => f.name === currentFood.name);

    try {
      if (exists) {
        // Optimistic Update: Remove
        setFavorites(prev => prev.filter(f => f.name !== currentFood.name));
        // DB Update
        await removeFavorite(currentFood.name);
      } else {
        // Add
        const foodToSave: FoodRecommendation = {
          ...currentFood,
          savedImageUrl: currentImage || undefined,
          savedAt: Date.now()
        };
        
        // Optimistic Update: Add to top
        setFavorites(prev => [foodToSave, ...prev]);
        // DB Update
        await addFavorite(foodToSave);
      }
    } catch (e) {
      console.error("Failed to update favorite in DB", e);
      alert("操作失败：无法访问本地数据库");
      // Revert state if needed, but for simplicity we rely on next reload or ignore minor desync
    }
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    try {
      // Optimistic Update
      setFavorites(prev => prev.filter(f => f.name !== name));
      await removeFavorite(name);
    } catch (e) {
      console.error("Failed to remove favorite", e);
    }
  };

  const handleSelectFavorite = (fav: FoodRecommendation) => {
    setSelectedFavorite(fav);
    setView('detail');
  };

  const handleExport = async () => {
    // Determine which food object we are exporting
    const targetFood = view === 'detail' ? selectedFavorite : food;
    
    if (!contentRef.current || !targetFood) return;
    
    setExporting(true);
    try {
      const html2canvas = (window as any).html2canvas;
      if (!html2canvas) throw new Error("Export library not loaded");

      const canvas = await html2canvas(contentRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#fdfbf7',
        logging: false,
        onclone: (clonedDoc: Document) => {
           const element = clonedDoc.querySelector('.animate-fade-in') as HTMLElement;
           if (element) element.style.animation = 'none';
        }
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `GourmetGlobe-${targetFood.name}.png`;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      alert("导出图片失败，请重试。");
    } finally {
      setExporting(false);
    }
  };

  // Helper to determine if current item is favorite
  const isCurrentFavorite = () => {
    const target = view === 'detail' ? selectedFavorite : food;
    if (!target) return false;
    return favorites.some(f => f.name === target.name);
  };

  // Logic to determine what to render
  const renderContent = () => {
    if (view === 'favorites') {
      return (
        <FavoritesList 
          favorites={favorites} 
          onSelect={handleSelectFavorite} 
          onRemove={handleRemoveFavorite} 
        />
      );
    }

    // Home or Detail View
    const displayFood = view === 'detail' ? selectedFavorite : food;
    const displayImage = view === 'detail' ? selectedFavorite?.savedImageUrl : imageUrl;
    
    if (loading && view === 'home') {
      return <LoadingSpinner />;
    }

    if (!displayFood) return null;

    return (
      <div ref={contentRef} className="bg-culinary-cream p-1 sm:p-4 rounded-3xl">
        <div className="animate-fade-in space-y-8">
          {/* Hero Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl relative group">
            
            {/* Image Section */}
            <div className="relative h-64 md:h-96 w-full bg-stone-200">
              {displayImage ? (
                <img 
                  src={displayImage} 
                  alt={displayFood.name} 
                  crossOrigin="anonymous" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400">
                  Image unavailable
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              
              {/* Text Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-3 py-1 bg-culinary-accent/90 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                    {displayFood.countryOfOrigin}
                  </span>
                  {displayFood.region && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold shadow-sm border border-white/30">
                      {displayFood.region}
                    </span>
                  )}
                </div>
                <h2 className="text-3xl md:text-5xl font-serif font-bold mb-1 shadow-black drop-shadow-lg">
                  {displayFood.name}
                </h2>
                <p className="text-lg md:text-xl text-stone-200 font-serif italic mb-2">
                  {displayFood.originalName}
                </p>
                <p className="text-stone-100 max-w-2xl text-sm md:text-base leading-relaxed line-clamp-2 md:line-clamp-none">
                  {displayFood.description}
                </p>
              </div>

               {/* Favorite Button (Over Image) */}
               <button
                  onClick={handleToggleFavorite}
                  className="absolute top-4 right-4 p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-red-500 transition-all duration-300 shadow-lg active:scale-95 group/btn"
                >
                  {isCurrentFavorite() ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 fill-current" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover/btn:fill-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
            </div>

            {/* Popularity Bar */}
            <div className="bg-stone-50 px-6 py-3 border-t border-stone-100 flex items-center text-sm text-stone-500 overflow-x-auto whitespace-nowrap">
              <span className="font-bold mr-2 text-culinary-dark">流行于:</span> 
              {displayFood.popularIn.join(' • ')}
            </div>
          </div>

          {/* Details Content */}
          <FoodDetails food={displayFood} />

          {/* Footer for Screenshot */}
          <div className="text-center py-4 text-stone-400 text-xs font-serif italic border-t border-stone-100 mt-8">
            Gourmet Globe - 每日全球美食推荐
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header / Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            {/* Logo area */}
            <div 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => setView('home')}
            >
              <span className="text-3xl">🌍</span>
              <h1 className="text-2xl font-serif font-bold text-culinary-dark tracking-tight">
                Gourmet Globe
              </h1>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {/* Tab Switcher */}
              <div className="flex bg-stone-100 p-1 rounded-full mr-2">
                <button
                  onClick={() => setView('home')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    view === 'home' 
                    ? 'bg-white text-culinary-dark shadow-sm' 
                    : 'text-stone-500 hover:text-culinary-dark'
                  }`}
                >
                  每日推荐
                </button>
                <button
                  onClick={() => setView('favorites')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    view === 'favorites' || view === 'detail'
                    ? 'bg-white text-culinary-dark shadow-sm' 
                    : 'text-stone-500 hover:text-culinary-dark'
                  }`}
                >
                  我的收藏 ({favorites.length})
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 border-l border-stone-200 pl-4">
                {view !== 'favorites' && (view === 'detail' || (food && !loading)) && (
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="p-2 text-stone-500 hover:text-culinary-accent hover:bg-orange-50 rounded-full transition-colors"
                    title="导出图片"
                  >
                     <span className={`${exporting ? 'animate-pulse' : ''}`}>
                      {exporting ? '⏳' : '📸'}
                    </span>
                  </button>
                )}

                {view === 'home' && (
                  <button
                    onClick={loadRecommendation}
                    disabled={loading || exporting}
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full font-medium transition-all duration-300
                      ${(loading || exporting)
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed' 
                        : 'bg-culinary-accent text-white hover:bg-orange-600 hover:shadow-lg active:scale-95'
                      }
                    `}
                    title="换一个"
                  >
                    <span className={`${loading ? 'animate-spin' : ''}`}>
                      {loading ? '⏳' : '🔄'}
                    </span>
                  </button>
                )}
                
                {view === 'detail' && (
                   <button
                   onClick={() => setView('favorites')}
                   className="flex items-center px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors text-sm font-medium"
                 >
                   ↩ 返回
                 </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 mt-8">
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">⚠️</div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button 
                  onClick={loadRecommendation}
                  className="mt-2 text-sm text-red-700 font-bold hover:underline"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        )}

        {renderContent()}

      </main>

      <footer className="text-center py-12 text-stone-400 text-sm">
        <p>Powered by Google Gemini</p>
        <p className="mt-1">发现世界美食之旅</p>
      </footer>
    </div>
  );
};

export default App;