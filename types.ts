export interface Ingredient {
  item: string;
  amount: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface FoodRecommendation {
  name: string;
  originalName: string;
  countryOfOrigin: string;
  region?: string;
  popularIn: string[];
  description: string;
  history: string;
  ingredients: Ingredient[];
  cookingSteps: RecipeStep[];
  flavorProfile: string[];
  prepTime: string;
  encyclopediaUrl?: string;
  // Optional field to store the image URL when saving to favorites
  savedImageUrl?: string; 
  // Timestamp for sorting
  savedAt?: number;
}

export interface AppState {
  food: FoodRecommendation | null;
  imageUrl: string | null;
  loading: boolean;
  imageLoading: boolean;
  error: string | null;
}