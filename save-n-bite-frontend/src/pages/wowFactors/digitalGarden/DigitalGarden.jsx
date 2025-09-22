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
      <div className="digital-garden-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>Loading your digital garden...</h2>
          <p>Preparing your plants and garden space</p>
        </div>
      </div>
    );
  }

  if (error && !garden) {
    return (
      <div className="digital-garden-error">
        <div className="error-content">
          <h2>Unable to load garden</h2>
          <p>{error}</p>
          <button onClick={handleInitializeGarden} className="btn-primary">
            Create New Garden
          </button>
        </div>
      </div>
    );
  }

  if (!garden) {
    return (
      <div className="digital-garden-welcome">
        <div className="welcome-content">
          <h1>Welcome to Your Digital Garden!</h1>
          <p>Start your gardening journey by creating your personal 8×8 garden space.</p>
          <p>Complete orders to earn plants and build your collection!</p>
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
    <div className="digital-garden">
      <CustomerNavBar />
      
      {/* Header with SVG background */}
      <div 
        className="garden-header"
        style={{
          backgroundImage: `url(${headerBackgroundSvg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="header-left">
          <h1 style={{ color: 'whitesmoke' }}>My Digital Garden</h1>
        </div>
        <div className="garden-controls">
          {/* Toggle button for Move/View mode */}
          <button
            className={`mode-toggle ${gardenMode === 'move' ? 'active' : ''}`}
            onClick={handleModeToggle}
            disabled={actionLoading}
          >
            {gardenMode === 'view' ? 'Switch to Move Mode' : 'Switch to View Mode'}
          </button>
          
          {/* Harvest button */}
          <button
            className={`mode-toggle harvest-toggle ${gardenMode === 'harvest' ? 'active' : ''}`}
            onClick={handleHarvestToggle}
            disabled={actionLoading}
          >
            {gardenMode === 'harvest' ? 'Exit Harvest Mode' : 'Harvest Plants'}
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={clearNotification}>×</button>
        </div>
      )}

      {/* Move Mode Prompt */}
      {movePrompt && (
        <div className="move-prompt">
          <span>{movePrompt}</span>
        </div>
      )}

      {/* Harvest Mode Prompt */}
      {harvestPrompt && (
        <div className="harvest-prompt">
          <span>{harvestPrompt}</span>
        </div>
      )}

      {/* Main content */}
      <div className="garden-main">
        {/* Center - Garden Grid (enlarged) */}
        <main className="garden-content">
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
            <div className="garden-overview">
              <h3>Garden Overview</h3>
              <div className="overview-stats">
                <div className="stat-item">
                  <span className="stat-label">Unique Plants:</span>
                  <span className="stat-value">{uniquePlantsEarned}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Plants Placed:</span>
                  <span className="stat-value">{garden.total_plants_placed || 0}/64</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completion:</span>
                  <span className="stat-value">
                    {Math.round(((garden.total_plants_placed || 0) / 64) * 100)}%
                  </span>
                </div>
              </div>
                           <div className="rarity-tallies">
                <h4>Plants by Rarity</h4>
                <div className="rarity-breakdown">
                  {Object.entries(rarityTallies).map(([rarity, count]) => (
                    <div key={rarity} className={`rarity-stat ${rarity}`}>
                      <span className="rarity-label">{rarity.charAt(0).toUpperCase() + rarity.slice(1)}:</span>
                      <span className="rarity-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="garden-sidebar-container">
          <div 
            className="garden-inventory-sidebar"
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
            className="garden-stats-sidebar"
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
        <PlantDetails
          plant={selectedPlantForDetails}
          onClose={() => {
            setShowPlantDetails(false);
            setSelectedPlantForDetails(null);
          }}
        />
      )}
    </div>
  );
};

export default DigitalGarden;