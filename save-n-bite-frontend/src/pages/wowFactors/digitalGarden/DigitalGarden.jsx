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

const DigitalGarden = () => {
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [gardenMode, setGardenMode] = useState('view'); // 'view', 'move'
  const [showPlantDetails, setShowPlantDetails] = useState(false);
  const [selectedPlantForDetails, setSelectedPlantForDetails] = useState(null);
  const [notification, setNotification] = useState(null);
  const [draggedPlant, setDraggedPlant] = useState(null);
  
  // New state for move mode prompts
  const [movePrompt, setMovePrompt] = useState('');
  const [selectedPlantForMove, setSelectedPlantForMove] = useState(null);

  // Main garden hook
  const {
    garden,
    inventory,
    stats,
    plants,
    loading,
    error,
    actions: { refreshGarden, refreshInventory, refreshStats, initializeGarden }
  } = useDigitalGarden();

  // Garden actions hook
  const { actionLoading, placePlant, removePlant, movePlant } = useGardenActions(
    // onSuccess callback
    useCallback((action, result) => {
      setNotification({
        type: 'success',
        message: `${action.charAt(0).toUpperCase() + action.slice(1)} successful!`
      });
      refreshGarden();
      refreshInventory();
      setGardenMode('view');
      setSelectedPlant(null);
      setDraggedPlant(null);
      setSelectedPlantForMove(null);
      setMovePrompt('');
    }, [refreshGarden, refreshInventory]),

    // onError callback
    useCallback((action, error) => {
      setNotification({
        type: 'error',
        message: `Failed to ${action}: ${error.message}`
      });
    }, [])
  );

  // Handle tile selection in garden
  const handleTileSelect = useCallback(async (tile, actionType, sourceTile = null) => {
    try {
      if (actionType === 'select') {
        // Plant selected for moving
        setSelectedPlantForMove(tile);
        setMovePrompt('Select the block in which you would like to place the plant');
        
        // Auto-hide prompt after 4 seconds
        setTimeout(() => {
          setMovePrompt('');
        }, 4000);
      } else if (actionType === 'move' && sourceTile) {
        await movePlant(sourceTile.row, sourceTile.col, tile.row, tile.col);
      }
    } catch (error) {
      console.error('Tile action failed:', error);
    }
  }, [movePlant]);

  // Handle plant interaction (click for details) - Only in view mode
  const handlePlantInteract = useCallback((plantData, tile) => {
    if (gardenMode === 'view') {
      setSelectedPlantForDetails(plantData);
      setShowPlantDetails(true);
    }
    // In move mode, this does nothing - plant selection is handled by handleTileSelect
  }, [gardenMode]);

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
        await placePlant(draggedPlant.plant, tile.row, tile.col);
      } catch (error) {
        console.error('Plant placement failed:', error);
      }
    }
  }, [draggedPlant, placePlant]);

  // Handle mode changes - Toggle between view and move
  const handleModeToggle = useCallback(() => {
    const newMode = gardenMode === 'view' ? 'move' : 'view';
    setGardenMode(newMode);
    setSelectedPlant(null);
    setSelectedPlantForMove(null);
    setMovePrompt('');
    
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
          <h1>My Digital Garden</h1>
        </div>
        <div className="garden-controls">
          {/* Toggle button instead of separate View/Move buttons */}
          <button
            className={`mode-toggle ${gardenMode === 'move' ? 'active' : ''}`}
            onClick={handleModeToggle}
            disabled={actionLoading}
          >
            {gardenMode === 'view' ? 'Switch to Move Mode' : 'Switch to View Mode'}
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
          />

          {/* Garden Overview beneath the garden */}
          {garden && (
            <div className="garden-overview">
              <h3>Garden Overview</h3>
              <div className="overview-stats">
                <div className="stat-item">
                  <span className="stat-label">Plants Earned:</span>
                  <span className="stat-value">{garden.total_plants_earned || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Plants Placed:</span>
                  <span className="stat-value">{garden.total_plants_placed || 0}/64</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completion:</span>
                  <span className="stat-value">
                    {garden.completion_percentage?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Garden Level:</span>
                  <span className="stat-value">{garden.garden_level || 1}</span>
                </div>
              </div>
            </div>
          )}

          {/* Mode instructions */}
          <div className="mode-instructions">
            {gardenMode === 'view' && !selectedPlantForMove && (
              <p>Click on plants to see their details and growing tips!</p>
            )}
            {gardenMode === 'move' && !selectedPlantForMove && (
              <p>Click a plant to select it for moving.</p>
            )}
            {gardenMode === 'move' && selectedPlantForMove && (
              <p>Now click an empty tile to move your selected plant there.</p>
            )}
            {draggedPlant && (
              <p>Drag your {draggedPlant.plant_details?.name} to an empty tile to place it.</p>
            )}
          </div>
        </main>

        {/* Right sidebar container - Stack vertically */}
        <div className="garden-sidebar-container">
          {/* Plant Inventory with SVG background */}
          <aside 
            className="garden-inventory-sidebar"
            style={{
              backgroundImage: `url(${panelBackgroundSvg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'transparent'
            }}
          >
            <PlantInventory
              inventory={inventory}
              selectedPlant={selectedPlant}
              onPlantSelect={setSelectedPlant}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              supportsDragDrop={true}
              mode={gardenMode}
            />
          </aside>

          {/* Garden Stats with SVG background */}
          <aside 
            className="garden-stats-sidebar"
            style={{
              backgroundImage: `url(${panelBackgroundSvg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'transparent'
            }}
          >
            <GardenStats 
              stats={stats} 
              garden={garden} 
              compactMode={true}
            />
          </aside>
        </div>
      </div>

      {/* Plant Details Modal - Only shows in view mode */}
      {showPlantDetails && selectedPlantForDetails && gardenMode === 'view' && (
        <PlantDetails
          plant={selectedPlantForDetails}
          onClose={() => {
            setShowPlantDetails(false);
            setSelectedPlantForDetails(null);
          }}
        />
      )}

      {/* Action loading overlay */}
      {actionLoading && (
        <div className="action-loading-overlay">
          <div className="action-loading-content">
            <div className="loading-spinner"></div>
            <p>Processing garden action...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalGarden;