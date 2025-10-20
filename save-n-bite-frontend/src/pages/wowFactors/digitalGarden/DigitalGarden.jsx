import React, { useState, useCallback, useEffect } from 'react';
import CustomerNavBar from '../../../components/auth/CustomerNavBar';
import GardenGrid from '../GardenGrid';
import PlantInventory from '../PlantInventory';
import PlantDetails from '../PlantDetails';
import GardenStats from '../GardenStats';
import useDigitalGarden from '../hooks/useDigitalGarden';
import useGardenActions from '../hooks/useGardenAction';
import { useGardenSounds } from '../../../hooks/useGardenSounds';
import useMobilePlantSelection from '../../../hooks/useMobilePlantSelection';
import panelBackgroundSvg from '../../../assets/images/backgrounds/panel-background.svg';
import headerBackgroundSvg from '../../../assets/images/backgrounds/garden-background.svg';
import './DigitalGarden.css';
import './RarityTallies.css';

const DigitalGarden = () => {
  // State declarations
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [gardenMode, setGardenMode] = useState('view');
  const [showPlantDetails, setShowPlantDetails] = useState(false);
  const [selectedPlantForDetails, setSelectedPlantForDetails] = useState(null);
  const [notification, setNotification] = useState(null);
  const [draggedPlant, setDraggedPlant] = useState(null);
  
  // Mode prompts state
  const [movePrompt, setMovePrompt] = useState('');
  const [harvestPrompt, setHarvestPrompt] = useState('');
  const [plantingPrompt, setPlantingPrompt] = useState('');
  const [selectedPlantForMove, setSelectedPlantForMove] = useState(null);
  const [selectedPlantForHarvest, setSelectedPlantForHarvest] = useState(null);
  
  // Tour state
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Hooks
  const {
    selectedPlantItem,
    isPlantingMode,
    startPlantingMode,
    exitPlantingMode,
    selectPlantForPlanting,
    handleTilePlacement
  } = useMobilePlantSelection();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { playSound } = useGardenSounds();

  const {
    garden,
    inventory,
    stats,
    plants,
    loading,
    error,
    actions: { refreshGarden, refreshInventory, initializeGarden }
  } = useDigitalGarden();

  // Responsive design effect
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
  // Only run once when component mounts
  const tourSeenValue = localStorage.getItem('digitalGardenTourSeen');
  
  // If tour was marked as seen but user has no plants placed, they probably haven't actually seen it
  if (tourSeenValue === 'true' && garden && inventory) {
    const hasPlacedPlants = garden.garden_tiles && 
                           garden.garden_tiles.some(tile => tile.plant !== null && tile.plant !== undefined);
    
    const hasPlantsInInventory = inventory && inventory.length > 0;
    
    // If user has plants but hasn't placed any, they probably haven't seen the tour
    if (hasPlantsInInventory && !hasPlacedPlants) {
      console.log('🔄 Resetting tour flag - user has plants but no placements, probably never saw tour');
      localStorage.removeItem('digitalGardenTourSeen');
    }
  }
}, [garden, inventory]); 

// Tour effect with debugging - UPDATED VERSION
useEffect(() => {
  console.log('🔍 TOUR DEBUG - loading:', loading, 'has garden:', !!garden, 'inventory length:', inventory?.length);
  
  // Only check for tour after loading is complete and we have data
  if (loading) {
    console.log('🔍 Still loading...');
    return;
  }

  if (!garden) {
    console.log('🔍 Missing garden data - waiting for garden to load');
    return;
  }

  // DEBUG: Check what's actually in localStorage
  const tourSeenValue = localStorage.getItem('digitalGardenTourSeen');
  console.log('🔍 RAW localStorage value for digitalGardenTourSeen:', tourSeenValue);
  
  const hasSeenTour = tourSeenValue === 'true';
  const hasPlantsInInventory = inventory && inventory.length > 0;
  
  // Check if any plants are actually placed in the garden
  const hasPlacedPlants = garden.garden_tiles && 
                         garden.garden_tiles.some(tile => tile.plant !== null && tile.plant !== undefined);

  console.log('🔍 Tour conditions - hasSeenTour:', hasSeenTour, 'hasPlantsInInventory:', hasPlantsInInventory, 'hasPlacedPlants:', hasPlacedPlants);
  console.log('🔍 Garden tiles:', garden.garden_tiles);

  // Show tour if: user hasn't seen it before AND has plants in inventory AND no plants placed
  if (!hasSeenTour && hasPlantsInInventory && !hasPlacedPlants) {
    console.log('🎯 Showing garden tour!');
    setShowTour(true);
    setTourStep(0);
  } else {
    console.log('🔍 Not showing tour - conditions not met');
  }
}, [loading, inventory, garden]);

// Fix garden initialization - only initialize if truly missing
useEffect(() => {
  // Only try to initialize if we're done loading and definitely have no garden
  if (!loading && !garden && error) {
    console.log('🔄 No garden found and error present, initializing automatically...');
    initializeGarden().catch(error => {
      // If it's "already exists" error, that means the garden exists but wasn't loaded properly
      if (error.message.includes('already exists')) {
        console.log('🔄 Garden exists but loading failed, refreshing instead...');
        refreshGarden(); // Try to refresh instead
      } else {
        console.error('Failed to auto-initialize garden:', error);
      }
    });
  }
}, [loading, garden, error, initializeGarden, refreshGarden]);

const nextTourStep = useCallback(() => {
  if (tourStep < 4) {
    setTourStep(tourStep + 1);
  } else {
    setShowTour(false);
    localStorage.setItem('digitalGardenTourSeen', 'true'); // Only set when completed
    console.log('🎯 Tour completed');
  }
}, [tourStep]);

const skipTour = useCallback(() => {
  setShowTour(false);
  localStorage.setItem('digitalGardenTourSeen', 'true'); // Only set when skipped
  console.log('🎯 Tour skipped');
}, []);

  // Garden actions with sounds
  const { actionLoading, placePlant, harvestPlant, movePlant } = useGardenActions(
    useCallback((action, result) => {
      console.log('🔊 Action completed:', action);
      
      let message = `${action.charAt(0).toUpperCase() + action.slice(1)} successful!`;
      
      // Play sounds based on action
      if (action === 'place') {
        playSound('plant');
        console.log('🔊 Playing plant sound');
      } else if (action === 'move') {
        playSound('move');
        console.log('🔊 Playing move sound');
      } else if (action === 'harvest') {
        playSound('harvest');
        console.log('🔊 Playing harvest sound');
      }

      // Handle specific message types
      if (action === 'harvest' && result?.plant) {
        message = `${result.plant.name} harvested and returned to inventory!`;
      } else if (action === 'remove' && result?.plant) {
        message = `${result.plant.name} removed from garden and returned to inventory!`;
      } else if (action === 'place') {
        let plantName = null;
        
        if (result?.plant?.name) {
          plantName = result.plant.name;
        } else if (result?.plant_details?.name) {
          plantName = result.plant_details.name;
        } else if (result?.tile?.plant_details?.name) {
          plantName = result.tile.plant_details.name;
        } else if (selectedPlantItem?.plant_details?.name) {
          plantName = selectedPlantItem.plant_details.name;
        } else if (draggedPlant?.plant_details?.name) {
          plantName = draggedPlant.plant_details.name;
        }
        
        message = plantName ? `${plantName} planted successfully!` : `Plant placed successfully!`;
      }
      
      setNotification({
        type: 'success',
        message: message
      });

      setTimeout(() => setNotification(null), 2000);

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
      
      if (isPlantingMode) {
        exitPlantingMode();
      }
    }, [playSound, refreshGarden, refreshInventory, isPlantingMode, exitPlantingMode, selectedPlantItem, draggedPlant]),

    useCallback((action, error) => {
      setNotification({
        type: 'error',
        message: `Failed to ${action}: ${error.message}`
      });
    }, [])
  );

  // Calculation functions
  const calculateTotalPlantsEarned = useCallback(() => {
    return garden?.total_plants_earned || 0;
  }, [garden]);

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
    
    return new Set([...uniqueInventoryPlants, ...placedPlantIds]).size;
  }, [inventory, garden]);

  const calculateRarityTallies = useCallback(() => {
    const tallies = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };

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

  // Event handlers
  const handleTileSelect = useCallback(async (tile, actionType, sourceTile = null) => {
    if (isPlantingMode) {
      const success = await handleTilePlacement(tile, placePlant);
      if (success) setPlantingPrompt('');
      return;
    }

    try {
      if (actionType === 'select') {
        if (gardenMode === 'move') {
          setSelectedPlantForMove(tile);
          setMovePrompt('Select the block in which you would like to place the plant');
          setTimeout(() => setMovePrompt(''), 4000);
        } else if (gardenMode === 'harvest') {
          setSelectedPlantForHarvest(tile);
          setHarvestPrompt('Click the plant again to confirm harvest (This will return the seeds to your inventory)');
          setTimeout(() => setHarvestPrompt(''), 4000);
        }
      } else if (actionType === 'move' && sourceTile) {
        await movePlant(sourceTile.row, sourceTile.col, tile.row, tile.col);
      } else if (actionType === 'harvest' && tile.plant_details) {
        await harvestPlant(tile.row, tile.col);
      }
    } catch (error) {
      console.error('Tile action failed:', error);
    }
  }, [movePlant, harvestPlant, gardenMode, isPlantingMode, handleTilePlacement, placePlant]);

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

  const handlePlantSelect = useCallback((inventoryItem) => {
    if (isPlantingMode) {
      selectPlantForPlanting(inventoryItem);
      setPlantingPrompt(`Selected ${inventoryItem.plant_details.name}. Click on an empty garden tile to plant it.`);
    }
  }, [isPlantingMode, selectPlantForPlanting]);

  const handleModeToggle = useCallback(() => {
    const newMode = gardenMode === 'view' ? 'move' : 'view';
    setGardenMode(newMode);
    setSelectedPlant(null);
    setSelectedPlantForMove(null);
    setSelectedPlantForHarvest(null);
    setMovePrompt('');
    setHarvestPrompt('');
    setPlantingPrompt('');
    
    if (isPlantingMode) exitPlantingMode();
    
    if (newMode === 'move') {
      setMovePrompt('Select the plant you would like to move');
      setTimeout(() => {
        if (gardenMode === 'move' && !selectedPlantForMove) setMovePrompt('');
      }, 3000);
    }
  }, [gardenMode, selectedPlantForMove, isPlantingMode, exitPlantingMode]);

  const handleHarvestToggle = useCallback(() => {
    const newMode = gardenMode === 'harvest' ? 'view' : 'harvest';
    setGardenMode(newMode);
    setSelectedPlant(null);
    setSelectedPlantForMove(null);
    setSelectedPlantForHarvest(null);
    setMovePrompt('');
    setHarvestPrompt('');
    setPlantingPrompt('');
    
    if (isPlantingMode) exitPlantingMode();
    
    if (newMode === 'harvest') {
      setHarvestPrompt('Select the plant you wish to harvest! (This will return the seeds to your inventory)');
      setTimeout(() => {
        if (gardenMode === 'harvest' && !selectedPlantForHarvest) setHarvestPrompt('');
      }, 4000);
    }
  }, [gardenMode, selectedPlantForHarvest, isPlantingMode, exitPlantingMode]);

  const handlePlantingToggle = useCallback(() => {
    if (isPlantingMode) {
      exitPlantingMode();
      setPlantingPrompt('');
    } else {
      setGardenMode('view');
      setSelectedPlantForMove(null);
      setSelectedPlantForHarvest(null);
      setMovePrompt('');
      setHarvestPrompt('');
      startPlantingMode();
      setPlantingPrompt('Select a plant from your inventory, then click on an empty garden tile to plant it.');
      setTimeout(() => {
        if (isPlantingMode && !selectedPlantItem) setPlantingPrompt('');
      }, 5000);
    }
  }, [isPlantingMode, exitPlantingMode, startPlantingMode, selectedPlantItem]);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

const handleInitializeGarden = useCallback(async () => {
  try {
    await initializeGarden();
    setNotification({
      type: 'success',
      message: 'Garden created successfully!'
    });
    // Force refresh to ensure we have the latest data
    setTimeout(() => {
      refreshGarden();
      refreshInventory();
    }, 500);
  } catch (error) {
    if (error.message.includes('already exists')) {
      // Garden exists but maybe wasn't loaded properly
      setNotification({
        type: 'info',
        message: 'Garden already exists, refreshing...'
      });
      refreshGarden();
    } else {
      setNotification({
        type: 'error',
        message: 'Failed to create garden: ' + error.message
      });
    }
  }
}, [initializeGarden, refreshGarden, refreshInventory]);

  // Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="error-content bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unable to load garden</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button onClick={handleInitializeGarden} className="btn-primary">Create New Garden</button>
        </div>
      </div>
    );
  }

  if (!garden) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="welcome-content bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Your Digital Garden!</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Start your gardening journey by creating your personal 8×8 garden space.</p>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Complete orders to earn plants and build your collection!</p>
          <button onClick={handleInitializeGarden} className="btn-primary btn-large">Create My Garden</button>
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
      
      {/* Header */}
      <div 
        className="garden-header relative"
        style={{ backgroundImage: `url(${headerBackgroundSvg})` }}
      >
        <div className="header-left">
          <h1 className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl md:text-3xl'}`} style={{ color: 'whitesmoke' }}>
            My Digital Garden
          </h1>
        </div>
        <div className="garden-controls flex gap-1 md:gap-2">
          <button
            className={`mode-toggle ${isPlantingMode ? 'active' : ''} bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors`}
            onClick={handlePlantingToggle}
            disabled={actionLoading}
          >
            {isPlantingMode ? 'Exit Plant Mode' : 'Get Planting'}
          </button>
          <button
            className={`mode-toggle ${gardenMode === 'move' ? 'active' : ''} bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors`}
            onClick={handleModeToggle}
            disabled={actionLoading}
          >
            {gardenMode === 'view' ? 'Move Plants' : 'Exit Move Mode'}
          </button>
          <button
            className={`mode-toggle harvest-toggle ${gardenMode === 'harvest' ? 'active' : ''} bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors`}
            onClick={handleHarvestToggle}
            disabled={actionLoading}
          >
            {gardenMode === 'harvest' ? 'Exit Harvest' : 'Harvest Plants'}
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type} fixed ${isMobile ? 'top-16 left-2 right-2' : 'top-20 left-1/2 transform -translate-x-1/2'} z-50`}>
          <span className={`font-medium text-sm md:text-base ${notification.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {notification.message}
          </span>
          <button onClick={clearNotification} className="ml-auto text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg md:text-xl">
            &times;
          </button>
        </div>
      )}

      {/* Mode Prompts */}
      {movePrompt && (
        <div className={`move-prompt fixed ${isMobile ? 'top-24 left-2 right-2' : 'top-28 left-1/2 transform -translate-x-1/2'} z-40`}>
          <span>{movePrompt}</span>
        </div>
      )}

      {harvestPrompt && (
        <div className={`harvest-prompt fixed ${isMobile ? 'top-32 left-2 right-2' : 'top-36 left-1/2 transform -translate-x-1/2'} z-40`}>
          <span>{harvestPrompt}</span>
        </div>
      )}

      {plantingPrompt && (
        <div className={`planting-prompt fixed ${isMobile ? 'top-24 left-2 right-2' : 'top-28 left-1/2 transform -translate-x-1/2'} z-40`}>
          <span>{plantingPrompt}</span>
        </div>
      )}

      {/* Tour - KEEP YOUR EXISTING TOUR JSX HERE - it's correct */}
      {showTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-auto">
            {/* Your existing tour steps here - they are correct */}
          </div>
        </div>
      )}

      {showTour && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-auto">
      {/* Tour Content */}
      {tourStep === 0 && (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Plant Collection</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            These are the plants you've earned by completing orders and reaching milestones! 
            Each plant has a rarity level that makes your garden unique.
          </p>
          <div className="flex justify-between">
            <button 
              onClick={skipTour}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Skip Tour
            </button>
            <button 
              onClick={nextTourStep}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {tourStep === 1 && (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Garden Tools</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Use these buttons to manage your garden:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 mb-4 space-y-2">
            <li>• <strong>Get Planting</strong>: Select plants and place them in your garden</li>
            <li>• <strong>Move Plants</strong>: Rearrange plants in your garden</li>
            <li>• <strong>Harvest Plants</strong>: Return plants to inventory to replant elsewhere</li>
          </ul>
          <div className="flex justify-between">
            <button 
              onClick={() => setTourStep(0)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Back
            </button>
            <button 
              onClick={nextTourStep}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {tourStep === 2 && (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Garden Progress</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Track your gardening achievements here! Plants are sorted by rarity, and your progress shows how close you are to filling your 8×8 garden.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Rarer plants are harder to get but make your garden more valuable and unique!
          </p>
          <div className="flex justify-between">
            <button 
              onClick={() => setTourStep(1)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Back
            </button>
            <button 
              onClick={nextTourStep}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* NEW STEP - Plant Details */}
      {tourStep === 3 && (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">4</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Plant Details</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Click on any plant in your garden to see its details! The Plant Card shows you:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 mb-4 space-y-2">
            <li>• <strong>Plant Name & Rarity</strong>: Learn about your plant's uniqueness</li>
            <li>• <strong>Description</strong>: Discover interesting facts about your plant</li>
            <li>• <strong>Growth Details</strong>: See when and how you earned this plant</li>
            <li>• <strong>Special Traits</strong>: Find out what makes each plant special</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Explore your plants to learn more about your growing collection!
          </p>
          <div className="flex justify-between">
            <button 
              onClick={() => setTourStep(2)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Back
            </button>
            <button 
              onClick={nextTourStep}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {tourStep === 4 && (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">5</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Progress & Milestones</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your garden statistics show your overall progress! Complete orders, try different restaurants, 
            and reach spending milestones to earn more plants.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            The more you use the app, the more diverse and beautiful your garden becomes!
          </p>
          <div className="flex justify-between">
            <button 
              onClick={() => setTourStep(3)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Back
            </button>
            <button 
              onClick={nextTourStep}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              Start Gardening!
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}

      {/* Main content */}
      <div className={`garden-main ${isMobile ? 'flex flex-col gap-4 px-2 py-4' : 'flex flex-col md:flex-row gap-6 max-w-7xl mx-auto px-4 py-8'}`}>
        <main className="garden-content flex-1">
          {/* Garden Overview */}
          {garden && (
            <div className="garden-overview-grid">
              <div className={`garden-intro-section ${isMobile ? 'mb-3 p-3' : 'mb-6 p-4'} bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow`}>
                <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900 dark:text-white mb-2`}>
                  Garden Progress
                </h3>
                <div className={`overview-stats ${isMobile ? 'grid grid-cols-2 gap-2 text-xs' : 'grid grid-cols-3 gap-3'} mb-3`}>
                  <div className="stat-item text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
                    <span className="stat-label text-gray-600 dark:text-gray-300 text-xs">Unique Plants</span>
                    <div className="stat-value text-emerald-600 dark:text-emerald-400 font-bold text-base">
                      {uniquePlantsEarned}
                    </div>
                  </div>
                  <div className="stat-item text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <span className="stat-label text-gray-600 dark:text-gray-300 text-xs">Plants Placed</span>
                    <div className="stat-value text-blue-600 dark:text-blue-400 font-bold text-base">
                      {garden.total_plants_placed || 0}/64
                    </div>
                  </div>
                  <div className="stat-item text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                    <span className="stat-label text-gray-600 dark:text-gray-300 text-xs">Completion</span>
                    <div className="stat-value text-purple-600 dark:text-purple-400 font-bold text-base">
                      {Math.round(((garden.total_plants_placed || 0) / 64) * 100)}%
                    </div>
                  </div>     
                </div>
                
                <div className="rarity-progress">
                  <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-white mb-1`}>
                    Collection by Rarity
                  </h4>
                  <div className={`rarity-breakdown ${isMobile ? 'grid grid-cols-3 gap-1 text-xs' : 'flex justify-between gap-1'}`}>
                    {Object.entries(rarityTallies).map(([rarity, count]) => (
                      <div key={rarity} className={`rarity-stat ${rarity} ${isMobile ? 'p-1' : 'flex-1 text-center p-2'} rounded-md`}>
                        <span className="rarity-label block text-xs font-semibold">
                          {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                        </span>
                        <span className="rarity-count font-bold text-xs">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <GardenGrid
            gardenData={garden}
            selectedPlant={draggedPlant}
            onTileSelect={handleTileSelect}
            onPlantInteract={handlePlantInteract}
            mode={gardenMode}
            selectedTileForMove={selectedPlantForMove}
            selectedTileForHarvest={selectedPlantForHarvest}
            isPlantingMode={isPlantingMode}
            selectedPlantItem={selectedPlantItem}
            isMobile={isMobile}
          />
        </main>

        {/* Sidebar */}
        <aside className={`garden-sidebar-container ${isMobile ? 'flex flex-col gap-4' : 'flex flex-col gap-6 w-full md:w-80'}`}>
          <div 
            className={`garden-inventory-sidebar bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow ${isMobile ? 'p-3' : 'p-6'}`}
            style={{ backgroundImage: `url(${panelBackgroundSvg})` }}
          >
            <PlantInventory
              inventory={inventory}
              onPlantSelect={handlePlantSelect}
              loading={loading}
              supportsDragDrop={false}
              mode={gardenMode}
              isPlantingMode={isPlantingMode}
              selectedPlantItem={selectedPlantItem}
              isMobile={isMobile}
            />
          </div>

          <div 
            className={`garden-stats-sidebar bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow ${isMobile ? 'p-3' : 'p-6'}`}
            style={{ backgroundImage: `url(${panelBackgroundSvg})` }}
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