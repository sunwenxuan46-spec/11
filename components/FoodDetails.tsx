import React from 'react';
import { FoodRecommendation } from '../types';

interface FoodDetailsProps {
  food: FoodRecommendation;
}

const FoodDetails: React.FC<FoodDetailsProps> = ({ food }) => {
  const bilibiliSearchUrl = `https://search.bilibili.com/all?keyword=${encodeURIComponent(food.name + " 做法")}`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(food.name + " recipe")}`;
  const encyclopediaUrl = food.encyclopediaUrl || `https://baike.baidu.com/item/${encodeURIComponent(food.name)}`;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* External Links Section */}
      <section className="flex flex-wrap gap-3 justify-center md:justify-start">
        <a 
          href={bilibiliSearchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 bg-pink-100 text-pink-600 rounded-full font-bold hover:bg-pink-200 transition-colors text-sm"
        >
          <span className="mr-2">📺</span> 视频教程 (B站)
        </a>
        <a 
          href={youtubeSearchUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 bg-red-100 text-red-600 rounded-full font-bold hover:bg-red-200 transition-colors text-sm"
        >
          <span className="mr-2">🎬</span> Video (YouTube)
        </a>
        <a 
          href={encyclopediaUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-full font-bold hover:bg-blue-200 transition-colors text-sm"
        >
          <span className="mr-2">📖</span> 百科详情
        </a>
      </section>

      {/* History Section */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
        <h3 className="text-xl font-serif font-bold text-culinary-dark mb-4 flex items-center">
          <span className="bg-culinary-gold/20 p-2 rounded-lg mr-3 text-2xl">📜</span>
          历史故事
        </h3>
        <p className="text-stone-600 leading-relaxed text-lg text-justify">
          {food.history}
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ingredients Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
          <h3 className="text-xl font-serif font-bold text-culinary-dark mb-4 flex items-center">
            <span className="bg-green-100 p-2 rounded-lg mr-3 text-2xl">🥕</span>
            主要食材
          </h3>
          <ul className="space-y-3">
            {food.ingredients.map((ing, idx) => (
              <li key={idx} className="flex justify-between items-center border-b border-stone-100 pb-2 last:border-0">
                <span className="text-stone-700 font-medium">{ing.item}</span>
                <span className="text-stone-500 text-sm">{ing.amount}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Steps Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
          <h3 className="text-xl font-serif font-bold text-culinary-dark mb-4 flex items-center">
            <span className="bg-red-100 p-2 rounded-lg mr-3 text-2xl">👨‍🍳</span>
            制作方法
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {food.cookingSteps.map((step) => (
              <div key={step.stepNumber} className="flex">
                <div className="flex-shrink-0 mr-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-culinary-dark text-white text-sm font-bold">
                    {step.stepNumber}
                  </span>
                </div>
                <p className="text-stone-600 pt-1 leading-snug">{step.instruction}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Flavor Profile */}
      <section className="flex flex-wrap gap-2 justify-center py-4">
        {food.flavorProfile.map((flavor, idx) => (
          <span key={idx} className="px-4 py-1 bg-stone-200 text-stone-700 rounded-full text-sm font-medium">
            #{flavor}
          </span>
        ))}
        <span className="px-4 py-1 bg-stone-200 text-stone-700 rounded-full text-sm font-medium">
          ⏱️ {food.prepTime}
        </span>
      </section>
    </div>
  );
};

export default FoodDetails;