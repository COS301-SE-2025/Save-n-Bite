import React, { useState, useCallback } from 'react';
import GardenGrid from './GardenGrid';
import PlantInventory from './PlantInventory';
import PlantDetails from './PlantDetails';
import GardenStats from './GardenStats';
import useDigitalGarden from './hooks/useDigitalGarden';
import useGardenActions from './hooks/useGardenActions';
import './DigitalGarden.css';

const DigitalGarden = () => {
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [gardenMode, setGardenMode] = useState('view'); // 'view', 'place', 'move'
  const [showPlantDetails, setShowPlantDetails] = useState(false);
  const [selectedPlantForDetails, setSelectedPlantForDetails] = useState(null);
  const [notification, setNotification] = useState(null);

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
      if (actionType === 'place' && selectedPlant) {
        await placePlant(selectedPlant.plant, tile.row, tile.col);
      } else if (actionType === 'move' && sourceTile) {
        await movePlant(sourceTile.row, sourceTile.col, tile.row, tile.col);
      }
    } catch (error) {
      console.error('Tile action failed:', error);
    }
  }, [selectedPlant, placePlant, movePlant]);

  // Handle plant interaction (click for details)
  const handlePlantInteract = useCallback((plantData, tile) => {
    setSelectedPlantForDetails(plantData);
    setShowPlantDetails(true);
  }, []);

  // Handle inventory plant selection
  const handleInventoryPlantSelect = useCallback((inventoryItem) => {
    setSelectedPlant(inventoryItem);
    setGardenMode('place');
  }, []);

  // Handle mode changes
  const handleModeChange = useCallback((newMode) => {
    setGardenMode(newMode);
    setSelectedPlant(null);
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

  // Clear notifications
  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

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
          <h1>Welcome to Your Digital Garden! 🌱</h1>
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
      {/* Header */}
      <div className="garden-header">
        <h1>🌱 My Digital Garden</h1>
        <div className="garden-controls">
          <button
            className={`mode-btn ${gardenMode === 'view' ? 'active' : ''}`}
            onClick={() => handleModeChange('view')}
          >
            👁️ View
          </button>
          <button
            className={`mode-btn ${gardenMode === 'place' ? 'active' : ''}`}
            onClick={() => handleModeChange('place')}
            disabled={inventory.length === 0}
          >
            🌱 Place
          </button>
          <button
            className={`mode-btn ${gardenMode === 'move' ? 'active' : ''}`}
            onClick={() => handleModeChange('move')}
          >
            🔄 Move
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

      {/* Main content */}
      <div className="garden-main">
        {/* Left sidebar - Inventory */}
        <aside className="garden-sidebar">
          <PlantInventory
            inventory={inventory}
            selectedPlant={selectedPlant}
            onPlantSelect={handleInventoryPlantSelect}
            mode={gardenMode}
          />
        </aside>

        {/* Center - Garden Grid */}
        <main className="garden-content">
          <GardenGrid
            gardenData={garden}
            selectedPlant={selectedPlant}
            onTileSelect={handleTileSelect}
            onPlantInteract={handlePlantInteract}
            mode={gardenMode}
          />

          {/* Mode instructions */}
          <div className="mode-instructions">
            {gardenMode === 'view' && (
              <p>Click on plants to see their details and growing tips!</p>
            )}
            {gardenMode === 'place' && !selectedPlant && (
              <p>Select a plant from your inventory to place it in the garden.</p>
            )}
            {gardenMode === 'place' && selectedPlant && (
              <p>Click on an empty tile to place your {selectedPlant.plant_details?.name}.</p>
            )}
            {gardenMode === 'move' && (
              <p>Click a plant to select it, then click an empty tile to move it there.</p>
            )}
          </div>
        </main>

        {/* Right sidebar - Stats */}
        <aside className="garden-stats-sidebar">
          <GardenStats stats={stats} garden={garden} />
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