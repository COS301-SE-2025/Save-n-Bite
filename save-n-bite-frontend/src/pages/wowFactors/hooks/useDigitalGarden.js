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

const ensureGardenInitialized = useCallback(async () => {
  try {
    // First try to get the existing garden
    const existingGarden = await gardenAPI.getGarden();
    console.log('✅ Garden loaded successfully:', existingGarden);
    console.log('📊 Garden has', existingGarden.garden_tiles?.length || 0, 'tiles');
    
    // CRITICAL: Check if garden has all 64 tiles
    if (!existingGarden.garden_tiles || existingGarden.garden_tiles.length === 0) {
      console.error('❌ CRITICAL: Garden exists but has NO tiles in database!');
      console.error('❌ This means tiles were never created during garden initialization.');
      console.error('❌ Attempting to reinitialize garden...');
      
      // Force backend to reinitialize by calling the initialize endpoint
      // This will trigger the service's initialize_customer_garden which now checks tile count
      try {
        // Call the garden endpoint again - this should trigger the tile creation logic
        await gardenAPI.getGarden();
        
        // If still no tiles, we need to create the garden fresh
        const retryGarden = await gardenAPI.getGarden();
        if (!retryGarden.garden_tiles || retryGarden.garden_tiles.length < 64) {
          throw new Error(
            'Garden tile initialization failed. ' +
            'Please run: python manage.py fix_garden_tiles ' +
            'Or delete and recreate your garden.'
          );
        }
        
        console.log('✅ Garden tiles initialized successfully');
        return retryGarden;
      } catch (reinitError) {
        console.error('❌ Failed to reinitialize garden:', reinitError);
        throw new Error(
          'Your garden exists but has no tiles. ' +
          'Please contact support or try logging out and back in.'
        );
      }
    }
    
    // Verify we have exactly 64 tiles
    if (existingGarden.garden_tiles.length !== 64) {
      console.warn(
        `⚠️ Garden has ${existingGarden.garden_tiles.length} tiles instead of 64. ` +
        'Some tiles may be missing.'
      );
    }
    
    return existingGarden;
  } catch (error) {
    // If garden doesn't exist, create it
    if (error.message.includes('not found') || error.message.includes('404')) {
      console.log('🔄 Garden not found, creating new garden...');
      const newGarden = await gardenAPI.createGarden();
      console.log('✅ New garden created:', newGarden);
      console.log('📊 New garden has', newGarden.garden_tiles?.length || 0, 'tiles');
      
      // Verify tiles were created
      if (!newGarden.garden_tiles || newGarden.garden_tiles.length !== 64) {
        throw new Error(
          `New garden created but has ${newGarden.garden_tiles?.length || 0}/64 tiles. ` +
          'Backend initialization failed. Please contact support.'
        );
      }
      
      return newGarden;
    }
    console.error('❌ Error loading garden:', error);
    throw error;
  }
}, []);

// Initialize garden if it doesn't exist
const initializeGarden = useCallback(async () => {
  try {
    console.log('🔄 Initializing garden...');
    const gardenData = await ensureGardenInitialized();
    setGarden(gardenData);
    console.log('✅ Garden initialized and set in state');
    return gardenData;
  } catch (error) {
    console.error('❌ Failed to initialize garden:', error);
    setError(error.message);
    throw error;
  }
}, [ensureGardenInitialized]);



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