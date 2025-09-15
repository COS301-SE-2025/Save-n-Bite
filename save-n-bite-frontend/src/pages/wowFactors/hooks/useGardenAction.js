import { useState, useCallback } from 'react';
import gardenAPI from '../../../services/gardenAPI';

export const useGardenActions = (onSuccess, onError) => {
  const [actionLoading, setActionLoading] = useState(false);

  const placePlant = useCallback(async (plantId, row, col, customData = {}) => {
    setActionLoading(true);
    try {
      const result = await gardenAPI.placePlant(plantId, row, col, customData);
      if (onSuccess) onSuccess('place', result);
      return result;
    } catch (error) {
      if (onError) onError('place', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, [onSuccess, onError]);

  const removePlant = useCallback(async (row, col) => {
    setActionLoading(true);
    try {
      const result = await gardenAPI.removePlant(row, col);
      if (onSuccess) onSuccess('remove', result);
      return result;
    } catch (error) {
      if (onError) onError('remove', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, [onSuccess, onError]);

  const movePlant = useCallback(async (fromRow, fromCol, toRow, toCol) => {
    setActionLoading(true);
    try {
      const result = await gardenAPI.movePlant(fromRow, fromCol, toRow, toCol);
      if (onSuccess) onSuccess('move', result);
      return result;
    } catch (error) {
      if (onError) onError('move', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, [onSuccess, onError]);

  const bulkActions = useCallback(async (actions) => {
    setActionLoading(true);
    try {
      const result = await gardenAPI.bulkActions(actions);
      if (onSuccess) onSuccess('bulk', result);
      return result;
    } catch (error) {
      if (onError) onError('bulk', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, [onSuccess, onError]);

  return {
    actionLoading,
    placePlant,
    removePlant,
    movePlant,
    bulkActions,
  };
};

export default useGardenActions;