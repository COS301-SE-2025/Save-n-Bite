import React, { useState, useCallback, useEffect } from 'react';
import CustomerNavBar from '../../../components/auth/CustomerNavBar';
import GardenGrid from '../GardenGrid';
import PlantInventory from '../PlantInventory';
import PlantDetails from '../PlantDetails';
import GardenStats from '../GardenStats';
import useDigitalGarden from '../hooks/useDigitalGarden';
import useGardenActions from '../hooks/useGardenAction';
import useMobilePlantSelection from '../../../hooks/useMobilePlantSelection';
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
  const [plantingPrompt, setPlantingPrompt] = useState('');
  const [selectedPlantForMove, setSelectedPlantForMove] = useState(null);
  const [selectedPlantForHarvest, setSelectedPlantForHarvest] = useState(null);

  // Mobile plant selection hook
  const {
    selectedPlantItem,
    isPlantingMode,
    startPlantingMode,
    exitPlantingMode,
    selectPlantForPlanting,
    handleTilePlacement
  } = useMobilePlantSelection();

  // Check if mobile device
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  // onSuccess callback - FIXED
  useCallback((action, result) => {
    let message = `${action.charAt(0).toUpperCase() + action.slice(1)} successful!`;
    
    if (action === 'harvest' && result?.plant) {
      message = `${result.plant.name} harvested and returned to inventory!`;
    } else if (action === 'remove' && result?.plant) {
      message = `${result.plant.name} removed from garden and returned to inventory!`;
    } else if (action === 'place') {
      // FIXED: Handle plant placement notification properly
      // Check multiple possible response structures
      let plantName = null;
      
      if (result?.plant?.name) {
        plantName = result.plant.name;
      } else if (result?.plant_details?.name) {
        plantName = result.plant_details.name;
      } else if (result?.tile?.plant_details?.name) {
        plantName = result.tile.plant_details.name;
      } else if (selectedPlantItem?.plant_details?.name) {
        // Fallback to the selected plant from mobile mode
        plantName = selectedPlantItem.plant_details.name;
      } else if (draggedPlant?.plant_details?.name) {
        // Fallback to the dragged plant from desktop mode
        plantName = draggedPlant.plant_details.name;
      }
      
      if (plantName) {
        message = `${plantName} planted successfully!`;
      } else {
        message = `Plant placed successfully!`;
      }
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
    setPlantingPrompt('');
    
    // Exit mobile planting mode after successful placement
    if (isPlantingMode) {
      exitPlantingMode();
    }
  }, [refreshGarden, refreshInventory, isPlantingMode, exitPlantingMode, selectedPlantItem, draggedPlant]),

  // onError callback (unchanged)
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
    // Handle mobile planting mode
    if (isMobile && isPlantingMode) {
      const success = await handleTilePlacement(tile, placePlant);
      if (success) {
        setPlantingPrompt('');
      }
      return;
    }

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
        await harvestPlant(tile.row, tile.col);
      }
    } catch (error) {
      console.error('Tile action failed:', error);
    }
  }, [movePlant, harvestPlant, gardenMode, isMobile, isPlantingMode, handleTilePlacement, placePlant]);

  // Handle plant interaction (click for details)
  const handlePlantInteract = useCallback((plantData, tile) => {
    if (gardenMode === 'view' && !isPlantingMode) {
      setSelectedPlantForDetails(plantData);
      setShowPlantDetails(true);
    } else if (gardenMode === 'harvest') {
      if (selectedPlantForHarvest && selectedPlantForHarvest.id === tile.id) {
        handleTileSelect(tile, 'harvest');
      } else {
        handleTileSelect(tile, 'select');
      }
    }
  }, [gardenMode, selectedPlantForHarvest, handleTileSelect, isPlantingMode]);

  // Handle plant inventory selection
  const handlePlantSelect = useCallback((inventoryItem) => {
    if (isMobile && isPlantingMode) {
      selectPlantForPlanting(inventoryItem);
      setPlantingPrompt(`Selected ${inventoryItem.plant_details.name}. Click on an empty garden tile to plant it.`);
    }
  }, [isMobile, isPlantingMode, selectPlantForPlanting]);

  // Handle desktop drag and drop
  const handleDragStart = useCallback((inventoryItem) => {
    if (!isMobile) {
      setDraggedPlant(inventoryItem);
    }
  }, [isMobile]);

  const handleDragEnd = useCallback(() => {
    if (!isMobile) {
      setDraggedPlant(null);
    }
  }, [isMobile]);

  const handleDrop = useCallback(async (tile) => {
    if (!isMobile && draggedPlant && !tile.plant_details) {
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
  }, [isMobile, draggedPlant, placePlant]);

  // Handle mode changes
  const handleModeToggle = useCallback(() => {
    const newMode = gardenMode === 'view' ? 'move' : 'view';
    setGardenMode(newMode);
    setSelectedPlant(null);
    setSelectedPlantForMove(null);
    setSelectedPlantForHarvest(null);
    setMovePrompt('');
    setHarvestPrompt('');
    setPlantingPrompt('');
    
    // Exit mobile planting mode when switching modes
    if (isPlantingMode) {
      exitPlantingMode();
    }
    
    if (newMode === 'move') {
      setMovePrompt('Select the plant you would like to move');
      setTimeout(() => {
        if (gardenMode === 'move' && !selectedPlantForMove) {
          setMovePrompt('');
        }
      }, 3000);
    }
  }, [gardenMode, selectedPlantForMove, isPlantingMode, exitPlantingMode]);

  // Handle harvest mode toggle
  const handleHarvestToggle = useCallback(() => {
    const newMode = gardenMode === 'harvest' ? 'view' : 'harvest';
    setGardenMode(newMode);
    setSelectedPlant(null);
    setSelectedPlantForMove(null);
    setSelectedPlantForHarvest(null);
    setMovePrompt('');
    setHarvestPrompt('');
    setPlantingPrompt('');
    
    // Exit mobile planting mode when switching modes
    if (isPlantingMode) {
      exitPlantingMode();
    }
    
    if (newMode === 'harvest') {
      setHarvestPrompt('Select the plant you wish to harvest! (This will return the seeds to your inventory)');
      setTimeout(() => {
        if (gardenMode === 'harvest' && !selectedPlantForHarvest) {
          setHarvestPrompt('');
        }
      }, 4000);
    }
  }, [gardenMode, selectedPlantForHarvest, isPlantingMode, exitPlantingMode]);

  // Handle mobile planting mode toggle
  const handlePlantingToggle = useCallback(() => {
    if (isPlantingMode) {
      exitPlantingMode();
      setPlantingPrompt('');
    } else {
      // Exit other modes first
      setGardenMode('view');
      setSelectedPlantForMove(null);
      setSelectedPlantForHarvest(null);
      setMovePrompt('');
      setHarvestPrompt('');
      
      startPlantingMode();
      setPlantingPrompt('Select a plant from your inventory, then click on an empty garden tile to plant it.');
      
      setTimeout(() => {
        if (isPlantingMode && !selectedPlantItem) {
          setPlantingPrompt('');
        }
      }, 5000);
    }
  }, [isPlantingMode, exitPlantingMode, startPlantingMode, selectedPlantItem]);

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
          <h1 className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl md:text-3xl'}`} style={{ color: 'whitesmoke' }}>
            My Digital Garden
          </h1>
        </div>
        <div className="garden-controls flex gap-1 md:gap-2">
          {/* Mobile: Show Get Planting button instead of drag instructions */}
          {isMobile && (
            <button
              className={`mode-toggle ${isPlantingMode ? 'active' : ''} bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors`}
              onClick={handlePlantingToggle}
              disabled={actionLoading}
            >
              {isPlantingMode ? 'Exit Plant Mode' : 'Get Planting'}
            </button>
          )}
          
          <button
            className={`mode-toggle ${gardenMode === 'move' ? 'active' : ''} bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors`}
            onClick={handleModeToggle}
            disabled={actionLoading}
          >
            {gardenMode === 'view' ? (isMobile ? 'Move' : 'Switch to Move Mode') : (isMobile ? 'View' : 'Switch to View Mode')}
          </button>
          
          <button
            className={`mode-toggle harvest-toggle ${gardenMode === 'harvest' ? 'active' : ''} bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors`}
            onClick={handleHarvestToggle}
            disabled={actionLoading}
          >
            {gardenMode === 'harvest' ? (isMobile ? 'Exit Harvest' : 'Exit Harvest Mode') : (isMobile ? 'Harvest' : 'Harvest Plants')}
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type} fixed ${isMobile ? 'top-16 left-2 right-2' : 'top-20 left-1/2 transform -translate-x-1/2'} z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg px-4 py-2 md:px-6 md:py-3 flex items-center gap-2 md:gap-4`}>
          <span className={`font-medium text-sm md:text-base ${notification.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{notification.message}</span>
          <button onClick={clearNotification} className="ml-auto text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg md:text-xl">&times;</button>
        </div>
      )}

      {/* Mode Prompts */}
      {movePrompt && (
        <div className={`move-prompt fixed ${isMobile ? 'top-24 left-2 right-2' : 'top-28 left-1/2 transform -translate-x-1/2'} z-40 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-4 py-2 rounded-lg shadow text-sm`}>
          <span>{movePrompt}</span>
        </div>
      )}

      {harvestPrompt && (
        <div className={`harvest-prompt fixed ${isMobile ? 'top-32 left-2 right-2' : 'top-36 left-1/2 transform -translate-x-1/2'} z-40 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-lg shadow text-sm`}>
          <span>{harvestPrompt}</span>
        </div>
      )}

      {plantingPrompt && (
        <div className={`planting-prompt fixed ${isMobile ? 'top-24 left-2 right-2' : 'top-28 left-1/2 transform -translate-x-1/2'} z-40 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg shadow text-sm`}>
          <span>{plantingPrompt}</span>
        </div>
      )}

      {/* Main content */}
      <div className={`garden-main ${isMobile ? 'flex flex-col gap-4 px-2 py-4' : 'flex flex-col md:flex-row gap-6 max-w-7xl mx-auto px-4 py-8'}`}>
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
            isPlantingMode={isPlantingMode}
            selectedPlantItem={selectedPlantItem}
            isMobile={isMobile}
          />

          {/* Garden Overview */}
          {garden && (
            <div className={`garden-overview ${isMobile ? 'mt-4 p-4' : 'mt-8 p-6'} bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow`}>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white mb-3`}>Garden Overview</h3>
              <div className={`overview-stats ${isMobile ? 'grid grid-cols-2 gap-3 text-sm' : 'flex flex-wrap gap-6'} mb-4`}>
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
                <h4 className={`${isMobile ? 'text-sm' : 'text-md'} font-semibold text-gray-900 dark:text-white mb-2`}>Plants by Rarity</h4>
                <div className={`rarity-breakdown ${isMobile ? 'grid grid-cols-3 gap-2 text-xs' : 'flex flex-wrap gap-4'}`}>
                  {Object.entries(rarityTallies).map(([rarity, count]) => (
                  <div key={rarity} className={`rarity-stat ${rarity} ${isMobile ? 'p-2' : 'flex items-center gap-2'}`}>
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
        <aside className={`garden-sidebar-container ${isMobile ? 'flex flex-col gap-4' : 'flex flex-col gap-6 w-full md:w-80'}`}>
          <div 
            className={`garden-inventory-sidebar bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow ${isMobile ? 'p-3' : 'p-6'}`}
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
              onPlantSelect={handlePlantSelect}
              loading={loading}
              supportsDragDrop={!isMobile}
              mode={gardenMode}
              isPlantingMode={isPlantingMode}
              selectedPlantItem={selectedPlantItem}
              isMobile={isMobile}
            />
          </div>

          <div 
            className={`garden-stats-sidebar bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow ${isMobile ? 'p-3' : 'p-6'}`}
            style={{
              backgroundImage: `url(${panelBackgroundSvg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <GardenStats stats={stats} loading={loading} isMobile={isMobile} />
          </div>
        </aside>
      </div>

      {/* Plant Details Modal */}
      {showPlantDetails && selectedPlantForDetails && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl ${isMobile ? 'w-full max-w-sm' : 'max-w-lg w-full'} p-6`}>
            <PlantDetails
              plant={selectedPlantForDetails}
              onClose={() => {
                setShowPlantDetails(false);
                setSelectedPlantForDetails(null);
              }}
              isMobile={isMobile}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalGarden;