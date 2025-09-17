import React, { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import GardenGrid from '../GardenGrid';
import PlantInventory from '../PlantInventory';
import PlantDetails from '../PlantDetails';
import GardenStats from '../GardenStats';
import useDigitalGarden from '../hooks/useDigitalGarden';
import useGardenActions from '../hooks/useGardenAction';
import './DigitalGarden.css';

const DigitalGarden = () => {
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [gardenMode, setGardenMode] = useState('view'); // 'view', 'move'
  const [showPlantDetails, setShowPlantDetails] = useState(false);
  const [selectedPlantForDetails, setSelectedPlantForDetails] = useState(null);
  const [notification, setNotification] = useState(null);
  const [draggedPlant, setDraggedPlant] = useState(null);

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
      if (actionType === 'move' && sourceTile) {
        await movePlant(sourceTile.row, sourceTile.col, tile.row, tile.col);
      }
    } catch (error) {
      console.error('Tile action failed:', error);
    }
  }, [movePlant]);

  // Handle plant interaction (click for details)
  const handlePlantInteract = useCallback((plantData, tile) => {
    setSelectedPlantForDetails(plantData);
    setShowPlantDetails(true);
  }, []);

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

  // Handle back button (you'll need to implement navigation)
  const handleGoBack = useCallback(() => {
    // Implement navigation back to previous page
    // For example: navigate('/dashboard')
    console.log('Navigate back to previous page');
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
      {/* Header */}
      <div className="garden-header">
        <div className="header-left">
          <button onClick={handleGoBack} className="back-button">
            <ArrowLeft size={20} />
          </button>
          <h1>My Digital Garden</h1>
        </div>
        <div className="garden-controls">
          <button
            className={`mode-btn ${gardenMode === 'view' ? 'active' : ''}`}
            onClick={() => handleModeChange('view')}
          >
            View
          </button>
          <button
            className={`mode-btn ${gardenMode === 'move' ? 'active' : ''}`}
            onClick={() => handleModeChange('move')}
          >
            Move
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
            {gardenMode === 'view' && (
              <p>Click on plants to see their details and growing tips!</p>
            )}
            {gardenMode === 'move' && (
              <p>Click a plant to select it, then click an empty tile to move it there.</p>
            )}
            {draggedPlant && (
              <p>Drag your {draggedPlant.plant_details?.name} to an empty tile to place it.</p>
            )}
          </div>
        </main>

        {/* Right sidebar container - Stack vertically */}
        <div className="garden-sidebar-container">
          {/* Plant Inventory (top) */}
          <aside className="garden-inventory-sidebar">
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

          {/* Garden Stats (bottom) */}
          <aside className="garden-stats-sidebar">
            <GardenStats 
              stats={stats} 
              garden={garden} 
              compactMode={true}
            />
          </aside>
        </div>
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