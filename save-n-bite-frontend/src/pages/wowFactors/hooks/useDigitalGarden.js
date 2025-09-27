import { useState, useEffect, useCallback } from 'react';
import gardenAPI from '../../../services/gardenAPI';

export const useDigitalGarden = () => {
  const [garden, setGarden] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data
  const loadGardenData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [gardenData, inventoryData, statsData, plantsData] = await Promise.all([
        gardenAPI.getGarden().catch(() => null),
        gardenAPI.getInventory().catch(() => []),
        gardenAPI.getStats().catch(() => null),
        gardenAPI.getPlants().catch(() => []),
      ]);

      setGarden(gardenData);
      setInventory(inventoryData);
      setStats(statsData);
      setPlants(plantsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize garden if it doesn't exist
  const initializeGarden = useCallback(async (gardenName = 'My Garden') => {
    try {
      setLoading(true);
      const newGarden = await gardenAPI.createGarden(gardenName);
      setGarden(newGarden);
      return newGarden;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh specific data
  const refreshGarden = useCallback(async () => {
    try {
      const gardenData = await gardenAPI.getGarden();
      setGarden(gardenData);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    try {
      const inventoryData = await gardenAPI.getInventory();
      setInventory(inventoryData);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const statsData = await gardenAPI.getStats();
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadGardenData();
  }, [loadGardenData]);

  return {
    garden,
    inventory,
    stats,
    plants,
    loading,
    error,
    actions: {
      loadGardenData,
      initializeGarden,
      refreshGarden,
      refreshInventory,
      refreshStats,
    },
  };
};

export default useDigitalGarden;