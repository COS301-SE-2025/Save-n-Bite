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

// FIXED: Calculate total plants earned
const calculateTotalPlantsEarned = useCallback(() => {
  // Use the backend's calculated value since inventory might be empty when all plants are placed
  return garden?.total_plants_earned || 0;
}, [garden]);

// FIXED: Calculate unique plant types earned  
const calculateUniquePlantsEarned = useCallback(() => {
  if (!garden?.garden_tiles) return 0;
  
  // Get unique plant IDs from inventory
  const uniqueInventoryPlants = new Set();
  if (inventory && inventory.length > 0) {
    inventory.forEach(item => uniqueInventoryPlants.add(item.plant));
  }
  
  // Get unique plant IDs from placed plants in garden
  const placedPlantIds = new Set();
  garden.garden_tiles.forEach(tile => {
    if (tile.plant) {
      placedPlantIds.add(tile.plant);
    }
  });
  
  // Combine both sets to get total unique plants
  const allUniquePlants = new Set([...uniqueInventoryPlants, ...placedPlantIds]);
  return allUniquePlants.size;
}, [inventory, garden]);

// FIXED: Calculate rarity tallies
const calculateRarityTallies = useCallback(() => {
  const tallies = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  };

  // Count from inventory
  if (inventory && inventory.length > 0) {
    inventory.forEach(item => {
      const rarity = item.plant_details?.rarity;
      if (tallies.hasOwnProperty(rarity)) {
        tallies[rarity] += item.quantity;
      }
    });
  }

  // Count from placed plants in garden
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
    //consolee.log('handleTileSelect called:', { actionType, gardenMode, tile: `${tile.row},${tile.col}`, hasPlant: !!tile.plant_details });


    
    try {
      if (actionType === 'select') {
        if (gardenMode === 'move') {
          // Plant selected for moving
          setSelectedPlantForMove(tile);
          setMovePrompt('Select the block in which you would like to place the plant');
          
          // Auto-hide prompt after 4 seconds
          setTimeout(() => {
            setMovePrompt('');
          }, 4000);
        } else if (gardenMode === 'harvest') {
          //consolee.log('Setting plant for harvest selection');
          // Plant selected for harvesting
          setSelectedPlantForHarvest(tile);
          setHarvestPrompt('Click the plant again to confirm harvest (This will return the seeds to your inventory)');
          
          // Auto-hide prompt after 4 seconds
          setTimeout(() => {
            setHarvestPrompt('');
          }, 4000);
        }
      } else if (actionType === 'move' && sourceTile) {
        //consolee.log('Executing move action');
        await movePlant(sourceTile.row, sourceTile.col, tile.row, tile.col);
      } else if (actionType === 'harvest' && tile.plant_details) {
        //consolee.log('Executing harvest action');
        // Perform harvest using dedicated harvest function
        const result = await harvestPlant(tile.row, tile.col);
        //consolee.log('Harvest result:', result);
        // The success callback will handle the notification and state cleanup
      }
    } catch (error) {
      consolee.error('Tile action failed:', error);
    }
  }, [movePlant, harvestPlant, gardenMode]);

  // Handle plant interaction (click for details) - Only in view mode
  const handlePlantInteract = useCallback((plantData, tile) => {
    //console.log('handlePlantInteract called:', { gardenMode, plantData: plantData?.name, tile: `${tile.row},${tile.col}` });
    
    if (gardenMode === 'view') {
      setSelectedPlantForDetails(plantData);
      setShowPlantDetails(true);
    } else if (gardenMode === 'harvest') {
      // console.log('In harvest mode, handling plant interaction');
      // console.log('selectedPlantForHarvest:', selectedPlantForHarvest);
      // console.log('Current tile:', tile);
      
      // Handle harvest confirmation
      if (selectedPlantForHarvest && selectedPlantForHarvest.id === tile.id) {
        //console.o('Confirming harvest for selected plant');
        // Confirm harvest
        handleTileSelect(tile, 'harvest');
      } else {
        //console.o('Selecting plant for harvest');
        // Select for harvest
        handleTileSelect(tile, 'select');
      }
    }
    // In move mode, this does nothing - plant selection is handled by handleTileSelect
  }, [gardenMode, selectedPlantForHarvest, handleTileSelect]);

  // Handle drag and drop functionality
  const handleDragStart = useCallback((inventoryItem) => {
    setDraggedPlant(inventoryItem);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedPlant(null);
  }, []);

  const handleDrop = useCallback(async (tile) => {
    if (draggedPlant && !tile.plant_details) {
      try {
        // The backend view code expects plant_id (the plant type ID), not inventory_id
        // From debug: draggedPlant.plant_details.id is the plant ID we need
        const plantId = draggedPlant.plant_details?.id || draggedPlant.plant;
        // console.log('Using plant ID:', plantId);
        // console.log('Tile position:', { row: tile.row, col: tile.col });
        
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

  // Handle mode changes - Toggle between view, move, and harvest
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
      // Auto-hide initial prompt after 3 seconds
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
      // Auto-hide initial prompt after 4 seconds
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
//  TEMPORARY debug code
//console.o('=== DEBUG INFO ===');
//console.o('Garden object:', garden);
//console.o('Inventory array:', inventory);
if (garden) {
  //console.o('Garden keys:', Object.keys(garden));
  //console.o('Garden tiles:', garden.tiles);
  //console.o('Garden garden_tiles:', garden.garden_tiles);
}
if (inventory && inventory.length > 0) {
  //console.o('First inventory item:', inventory[0]);
  //console.o('Inventory item keys:', Object.keys(inventory[0]));
}
//console.o('=== END DEBUG ===');
//console.o('First garden tile:', garden.garden_tiles[0]);
//console.o('A garden tile with plant:', garden.garden_tiles.find(tile => tile.plant));

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
          {/* Toggle button for Move/View mode */}
          <button
            className={`mode-toggle ${gardenMode === 'move' ? 'active' : ''} bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800 rounded-lg px-4 py-2 transition-colors`}
            onClick={handleModeToggle}
            disabled={actionLoading}
          >
            {gardenMode === 'view' ? 'Switch to Move Mode' : 'Switch to View Mode'}
          </button>
          
          {/* Harvest button */}
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

      {/* Move Mode Prompt */}
      {movePrompt && (
        <div className="move-prompt fixed top-28 left-1/2 transform -translate-x-1/2 z-40 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-6 py-2 rounded-lg shadow">
          <span>{movePrompt}</span>
        </div>
      )}

      {/* Harvest Mode Prompt */}
      {harvestPrompt && (
        <div className="harvest-prompt fixed top-36 left-1/2 transform -translate-x-1/2 z-40 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-6 py-2 rounded-lg shadow">
          <span>{harvestPrompt}</span>
        </div>
      )}

      {/* Main content */}
      <div className="garden-main flex flex-col md:flex-row gap-6 max-w-7xl mx-auto px-4 py-8">
        {/* Center - Garden Grid (enlarged) */}
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

{/* Garden Overview beneath the garden */}
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