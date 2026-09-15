import { useCallback, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  useGetFavoritesQuery,
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
  FavoriteItem,
} from '@/store/api/profileApi';
import { syncFavoritesCount } from '@/store/slices/profileSlice';

export function useFavorites() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const {
    data: favorites = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetFavoritesQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [addToFavoritesApi] = useAddToFavoritesMutation();
  const [removeFromFavoritesApi] = useRemoveFromFavoritesMutation();

  const favoriteIdsSet = useMemo(() => {
    const set = new Set<string>();
    favorites.forEach((fav) => {
      if (fav.productId) set.add(fav.productId);
      if (fav.product?.id) set.add(fav.product.id);
    });
    return set;
  }, [favorites]);

  const isFavorited = useCallback(
    (productId?: string) => {
      if (!productId || !isAuthenticated) return false;
      return favoriteIdsSet.has(productId);
    },
    [favoriteIdsSet, isAuthenticated]
  );

  const toggleFavorite = useCallback(
    async (productId?: string, onAuthRequired?: () => void) => {
      if (!productId) return false;

      if (!isAuthenticated) {
        if (onAuthRequired) {
          onAuthRequired();
        }
        return false;
      }

      const currentlyFav = favoriteIdsSet.has(productId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        if (currentlyFav) {
          await removeFromFavoritesApi(productId).unwrap();
          dispatch(syncFavoritesCount(Math.max(0, favorites.length - 1)));
          return false;
        } else {
          await addToFavoritesApi(productId).unwrap();
          dispatch(syncFavoritesCount(favorites.length + 1));
          return true;
        }
      } catch (error) {
        console.warn('Failed to toggle favorite on server', error);
        return currentlyFav;
      }
    },
    [isAuthenticated, favoriteIdsSet, addToFavoritesApi, removeFromFavoritesApi, dispatch, favorites.length]
  );

  return {
    favorites,
    favoritesCount: favorites.length,
    isLoading,
    isFetching,
    refetch,
    isFavorited,
    toggleFavorite,
    isAuthenticated,
  };
}
