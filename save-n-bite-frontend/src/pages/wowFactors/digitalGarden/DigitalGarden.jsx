import React, { useState, useCallback, useEffect } from 'react';
import CustomerNavBar from '../../../components/auth/CustomerNavBar';
import GardenGrid from '../GardenGrid';
import PlantInventory from '../PlantInventory';
import PlantDetails from '../PlantDetails';
import GardenStats from '../GardenStats';
import useDigitalGarden from '../hooks/useDigitalGarden';
import useGardenActions from '../hooks/useGardenAction';
import panelBackgroundSvg from '../../../assets/images/backgrounds/panel-background.svg';
import headerBackgroundSvg from '../../../assets/images/backgrounds/garden-background.svg';
import './DigitalGarden.css';
import './RarityTallies.css';

const DigitalGarden = () => {
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [gardenMode, setGardenMode] = useState('view'); // 'view', 'move', 'harvest'
  const [showPlantDetails, setShowPlantDetails] = useState(false);
  const [selectedPlantForDetails, setSelectedPlantForDetails] = useState(null);
  const [notification, setNotification] = useState(null);
  const [draggedPlant, setDraggedPlant] = useState(null);
  
  // State for mode prompts
  const [movePrompt, setMovePrompt] = useState('');
  const [harvestPrompt, setHarvestPrompt] = useState('');
  const [selectedPlantForMove, setSelectedPlantForMove] = useState(null);
  const [selectedPlantForHarvest, setSelectedPlantForHarvest] = useState(null);

  // Main garden hook
  const {
    garden,
    inventory,
    stats,
    plants,
    loading,
    error,
    actions: { refreshGarden, refreshInventory, initializeGarden }
  } = useDigitalGarden();

  // Garden actions hook
  const { actionLoading, placePlant, harvestPlant, movePlant } = useGardenActions(
    // onSuccess callback
    useCallback((action, result) => {
      let message = `${action.charAt(0).toUpperCase() + action.slice(1)} successful!`;
      
      if (action === 'harvest' && result?.plant) {
        message = `${result.plant.name} harvested and returned to inventory!`;
      } else if (action === 'remove' && result?.plant) {
        message = `${result.plant.name} removed from garden and returned to inventory!`;
      }
      
      setNotification({
        type: 'success',
        message: message
      });
      refreshGarden();
      refreshInventory();
      setGardenMode('view');
      setSelectedPlant(null);
      setDraggedPlant(null);
      setSelectedPlantForMove(null);
      setSelectedPlantForHarvest(null);
      setMovePrompt('');
      setHarvestPrompt('');
    }, [refreshGarden, refreshInventory]),

    // onError callback
    useCallback((action, error) => {
      setNotification({
        type: 'error',
        message: `Failed to ${action}: ${error.message}`
      });
    }, [])
  );

  // Calculate total plants earned
  const calculateTotalPlantsEarned = useCallback(() => {
    return garden?.total_plants_earned || 0;
  }, [garden]);

  // Calculate unique plant types earned  
  const calculateUniquePlantsEarned = useCallback(() => {
    if (!garden?.garden_tiles) return 0;
    
    const uniqueInventoryPlants = new Set();
    if (inventory && inventory.length > 0) {
      inventory.forEach(item => uniqueInventoryPlants.add(item.plant));
    }
    
    const placedPlantIds = new Set();
    garden.garden_tiles.forEach(tile => {
      if (tile.plant) {
        placedPlantIds.add(tile.plant);
      }
    });
    
    const allUniquePlants = new Set([...uniqueInventoryPlants, ...placedPlantIds]);
    return allUniquePlants.size;
  }, [inventory, garden]);

  // Calculate rarity tallies
  const calculateRarityTallies = useCallback(() => {
    const tallies = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    };

    if (inventory && inventory.length > 0) {
      inventory.forEach(item => {
        const rarity = item.plant_details?.rarity;
        if (tallies.hasOwnProperty(rarity)) {
          tallies[rarity] += item.quantity;
        }
      });
    }

    if (garden?.garden_tiles) {
      garden.garden_tiles.forEach(tile => {
        if (tile.plant_details?.rarity) {
          const rarity = tile.plant_details.rarity;
          if (tallies.hasOwnProperty(rarity)) {
            tallies[rarity] += 1;
          }
        }
      });
    }

    return tallies;
  }, [inventory, garden]);

  // Handle tile selection in garden
  const handleTileSelect = useCallback(async (tile, actionType, sourceTile = null) => {
    try {
      if (actionType === 'select') {
        if (gardenMode === 'move') {
          setSelectedPlantForMove(tile);
          setMovePrompt('Select the block in which you would like to place the plant');
          
          setTimeout(() => {
            setMovePrompt('');
          }, 4000);
        } else if (gardenMode === 'harvest') {
          setSelectedPlantForHarvest(tile);
          setHarvestPrompt('Click the plant again to confirm harvest (This will return the seeds to your inventory)');
          
          setTimeout(() => {
            setHarvestPrompt('');
          }, 4000);
        }
      } else if (actionType === 'move' && sourceTile) {
        await movePlant(sourceTile.row, sourceTile.col, tile.row, tile.col);
      } else if (actionType === 'harvest' && tile.plant_details) {
        const result = await harvestPlant(tile.row, tile.col);
      }
    } catch (error) {
      console.error('Tile action failed:', error);
    }
  }, [movePlant, harvestPlant, gardenMode]);

  // Handle plant interaction (click for details)
  const handlePlantInteract = useCallback((plantData, tile) => {
    if (gardenMode === 'view') {
      setSelectedPlantForDetails(plantData);
      setShowPlantDetails(true);
    } else if (gardenMode === 'harvest') {
      if (selectedPlantForHarvest && selectedPlantForHarvest.id === tile.id) {
        handleTileSelect(tile, 'harvest');
      } else {
        handleTileSelect(tile, 'select');
      }
    }
  }, [gardenMode, selectedPlantForHarvest, handleTileSelect]);

  // Handle drag and drop functionality (desktop)
  const handleDragStart = useCallback((inventoryItem) => {
    setDraggedPlant(inventoryItem);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedPlant(null);
  }, []);

  const handleDrop = useCallback(async (tile) => {
    if (draggedPlant && !tile.plant_details) {
      try {
        const plantId = draggedPlant.plant_details?.id || draggedPlant.plant;
        
        if (!plantId) {
          console.error('No plant ID found in draggedPlant:', draggedPlant);
          return;
        }
        
        await placePlant(plantId, tile.row, tile.col);
      } catch (error) {
        console.error('Plant placement failed:', error);
      }
    }
  }, [draggedPlant, placePlant]);

  // NEW: Handle mobile plant drop
  const handleMobilePlantDrop = useCallback(async (inventoryItem, tileData) => {
    if (!tileData.isEmpty) {
      setNotification({
        type: 'error',
        message: 'Cannot place plant on occupied tile'
      });
      return;
    }

    try {
      const plantId = inventoryItem.plant_details?.id || inventoryItem.plant;
      
      if (!plantId) {
        console.error('No plant ID found in inventory item:', inventoryItem);
        return;
      }
      
      await placePlant(plantId, tileData.row, tileData.col);
    } catch (error) {
      console.error('Mobile plant placement failed:', error);
    }
  }, [placePlant]);

  // Handle mode changes
  const handleModeToggle = useCallback(() => {
    const newMode = gardenMode === 'view' ? 'move' : 'view';
    setGardenMode(newMode);
    setSelectedPlant(null);
    setSelectedPlantForMove(null);
    setSelectedPlantForHarvest(null);
    setMovePrompt('');
    setHarvestPrompt('');
    
    if (newMode === 'move') {
      setMovePrompt('Select the plant you would like to move');
      setTimeout(() => {
        if (gardenMode === 'move' && !selectedPlantForMove) {
          setMovePrompt('');
        }
      }, 3000);
    }
  }, [gardenMode, selectedPlantForMove]);

  // Handle harvest mode toggle
  const handleHarvestToggle = useCallback(() => {
    const newMode = gardenMode === 'harvest' ? 'view' : 'harvest';
    setGardenMode(newMode);
    setSelectedPlant(null);
    setSelectedPlantForMove(null);
    setSelectedPlantForHarvest(null);
    setMovePrompt('');
    setHarvestPrompt('');
    
    if (newMode === 'harvest') {
      setHarvestPrompt('Select the plant you wish to harvest! (This will return the seeds to your inventory)');
      setTimeout(() => {
        if (gardenMode === 'harvest' && !selectedPlantForHarvest) {
          setHarvestPrompt('');
        }
      }, 4000);
    }
  }, [gardenMode, selectedPlantForHarvest]);

  // Clear notification helper
  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Handle garden initialization
  const handleInitializeGarden = useCallback(async () => {
    try {
      await initializeGarden();
      setNotification({
        type: 'success',
        message: 'Garden created successfully!'
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Failed to create garden'
      });
    }
  }, [initializeGarden]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="loading-content text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h2 className="text-gray-800 dark:text-gray-100">Loading your digital garden...</h2>
          <p className="text-gray-600 dark:text-gray-300">Preparing your plants and garden space</p>
        </div>
      </div>
    );
  }

  if (error && !garden) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="error-content bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unable to load garden</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button onClick={handleInitializeGarden} className="btn-primary">
            Create New Garden
          </button>
        </div>
      </div>
    );
  }

  if (!garden) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="welcome-content bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Your Digital Garden!</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Start your gardening journey by creating your personal 8×8 garden space.</p>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Complete orders to earn plants and build your collection!</p>
          <button onClick={handleInitializeGarden} className="btn-primary btn-large">
            Create My Garden
          </button>
        </div>
      </div>
    );
  }

  const totalPlantsEarned = calculateTotalPlantsEarned();
  const uniquePlantsEarned = calculateUniquePlantsEarned();
  const rarityTallies = calculateRarityTallies();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <CustomerNavBar />
      
      {/* Header with SVG background */}
      <div 
        className="garden-header relative"
        style={{
          backgroundImage: `url(${headerBackgroundSvg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="header-left">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'whitesmoke' }}>My Digital Garden</h1>
        </div>
        <div className="garden-controls flex gap-2">
          <button
            className={`mode-toggle ${gardenMode === 'move' ? 'active' : ''} bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800 rounded-lg px-4 py-2 transition-colors`}
            onClick={handleModeToggle}
            disabled={actionLoading}
          >
            {gardenMode === 'view' ? 'Switch to Move Mode' : 'Switch to View Mode'}
          </button>
          
          <button
            className={`mode-toggle harvest-toggle ${gardenMode === 'harvest' ? 'active' : ''} bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700 rounded-lg px-4 py-2 transition-colors`}
            onClick={handleHarvestToggle}
            disabled={actionLoading}
          >
            {gardenMode === 'harvest' ? 'Exit Harvest Mode' : 'Harvest Plants'}
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type} fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg px-6 py-3 flex items-center gap-4`}>
          <span className={`font-medium ${notification.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{notification.message}</span>
          <button onClick={clearNotification} className="ml-auto text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl">&times;</button>
        </div>
      )}

      {/* Mode Prompts */}
      {movePrompt && (
        <div className="move-prompt fixed top-28 left-1/2 transform -translate-x-1/2 z-40 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-6 py-2 rounded-lg shadow">
          <span>{movePrompt}</span>
        </div>
      )}

      {harvestPrompt && (
        <div className="harvest-prompt fixed top-36 left-1/2 transform -translate-x-1/2 z-40 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-6 py-2 rounded-lg shadow">
          <span>{harvestPrompt}</span>
        </div>
      )}

      {/* Main content */}
      <div className="garden-main flex flex-col md:flex-row gap-6 max-w-7xl mx-auto px-4 py-8">
        {/* Center - Garden Grid */}
        <main className="garden-content flex-1">
          <GardenGrid
            gardenData={garden}
            selectedPlant={draggedPlant}
            onTileSelect={handleTileSelect}
            onPlantInteract={handlePlantInteract}
            onDrop={handleDrop}
            draggedPlant={draggedPlant}
            mode={gardenMode}
            selectedTileForMove={selectedPlantForMove}
            selectedTileForHarvest={selectedPlantForHarvest}
          />

          {/* Garden Overview */}
          {garden && (
            <div className="garden-overview mt-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Garden Overview</h3>
              <div className="overview-stats flex flex-wrap gap-6 mb-4">
                <div className="stat-item">
                  <span className="stat-label text-gray-600 dark:text-gray-300">Unique Plants:</span>
                  <span className="stat-value text-gray-900 dark:text-gray-100 font-semibold ml-2">{uniquePlantsEarned}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label text-gray-600 dark:text-gray-300">Plants Placed:</span>
                  <span className="stat-value text-gray-900 dark:text-gray-100 font-semibold ml-2">{garden.total_plants_placed || 0}/64</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label text-gray-600 dark:text-gray-300">Completion:</span>
                  <span className="stat-value text-gray-900 dark:text-gray-100 font-semibold ml-2">
                    {Math.round(((garden.total_plants_placed || 0) / 64) * 100)}%
                  </span>
                </div>
              </div>
              <div className="rarity-tallies">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Plants by Rarity</h4>
                <div className="rarity-breakdown flex flex-wrap gap-4">
                  {Object.entries(rarityTallies).map(([rarity, count]) => (
                  <div key={rarity} className={`rarity-stat ${rarity} flex items-center gap-2`}>
                    <span className="rarity-label">{rarity.charAt(0).toUpperCase() + rarity.slice(1)}:</span>
                    <span className="rarity-count font-semibold">{count}</span>
                  </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="garden-sidebar-container flex flex-col gap-6 w-full md:w-80">
          <div 
            className="garden-inventory-sidebar bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow"
            style={{
              backgroundImage: `url(${panelBackgroundSvg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <PlantInventory
              inventory={inventory}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onMobilePlantDrop={handleMobilePlantDrop}
              loading={loading}
              supportsDragDrop={true}
              mode={gardenMode}
            />
          </div>

          <div 
            className="garden-stats-sidebar bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow"
            style={{
              backgroundImage: `url(${panelBackgroundSvg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <GardenStats stats={stats} loading={loading} />
          </div>
        </aside>
      </div>

      {/* Plant Details Modal */}
      {showPlantDetails && selectedPlantForDetails && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl p-6 max-w-lg w-full">
            <PlantDetails
              plant={selectedPlantForDetails}
              onClose={() => {
                setShowPlantDetails(false);
                setSelectedPlantForDetails(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalGarden;