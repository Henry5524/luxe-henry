import { create } from 'zustand';

interface FavoritesStore {
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

const getStoredFavorites = (): string[] => {
  try {
    const stored = localStorage.getItem('favorites');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const useFavorites = create<FavoritesStore>((set, get) => ({
  favorites: getStoredFavorites(),
  toggleFavorite: (productId: string) => {
    set((state) => {
      const next = state.favorites.includes(productId)
        ? state.favorites.filter((id) => id !== productId)
        : [...state.favorites, productId];
      localStorage.setItem('favorites', JSON.stringify(next));
      return { favorites: next };
    });
  },
  isFavorite: (productId: string) => get().favorites.includes(productId),
}));
