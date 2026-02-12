import React from 'react';
import { FoodRecommendation } from '../types';

interface FavoritesListProps {
  favorites: FoodRecommendation[];
  onSelect: (food: FoodRecommendation) => void;
  onRemove: (e: React.MouseEvent, name: string) => void;
}

const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, onSelect, onRemove }) => {
  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400">
        <span className="text-6xl mb-4 opacity-50">💔</span>
        <p className="text-xl font-serif">暂无收藏美食</p>
        <p className="text-sm mt-2">快去探索并收藏你喜欢的美味吧！</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
      {favorites.map((food) => (
        <div 
          key={food.name}
          onClick={() => onSelect(food)}
          className="group bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
        >
          <div className="relative h-48 bg-stone-200 overflow-hidden">
            {food.savedImageUrl ? (
              <img 
                src={food.savedImageUrl} 
                alt={food.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100">
                <span className="text-4xl">🥘</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <h3 className="font-bold text-lg truncate shadow-black drop-shadow-sm">{food.name}</h3>
              <p className="text-xs text-stone-200 truncate">{food.countryOfOrigin}</p>
            </div>

            <button
              onClick={(e) => onRemove(e, food.name)}
              className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:scale-110 shadow-sm"
              title="取消收藏"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="p-4">
             <div className="flex flex-wrap gap-2 text-xs text-stone-500 mb-2">
               {food.flavorProfile.slice(0, 2).map((flavor, i) => (
                 <span key={i} className="bg-stone-100 px-2 py-1 rounded-md">#{flavor}</span>
               ))}
             </div>
             <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed">
               {food.description}
             </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FavoritesList;