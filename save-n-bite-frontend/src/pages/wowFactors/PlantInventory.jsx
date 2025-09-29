import React from 'react';
import PlantCard from '../../components/garden/PlantCard';
import './PlantInventory.css';

const PlantInventory = ({ 
  inventory, 
  selectedPlant, 
  onPlantSelect, 
  onDragStart,
  onDragEnd,
  supportsDragDrop = false,
  mode,
  isPlantingMode = false,
  selectedPlantItem = null,
  isMobile = false
}) => {
  if (!inventory || inventory.length === 0) {
    return (
      <div className="plant-inventory empty">
        <h3 className={`${isMobile ? 'text-sm' : 'text-lg'}`}>Plant Inventory</h3>
        <div className="empty-inventory">
          <div className={`empty-icon ${isMobile ? 'text-3xl' : 'text-5xl'}`}>🌱</div>
          <p className={`${isMobile ? 'text-sm' : 'text-base'}`}>No plants in inventory</p>
          <small className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Complete orders to earn plants!</small>
        </div>
      </div>
    );
  }

  const handleDragStart = (e, item) => {
    if (supportsDragDrop && onDragStart && !isMobile) {
      onDragStart(item);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.id);
    }
  };

  const handleDragEnd = (e) => {
    if (supportsDragDrop && onDragEnd && !isMobile) {
      onDragEnd();
    }
  };

  const handlePlantClick = (item) => {
    if (onPlantSelect) {
      onPlantSelect(item);
    }
  };

  const getInstructionText = () => {
    if (isMobile && isPlantingMode) {
      return "Click on a plant to select it, then click on an empty garden tile to plant it";
    } else if (!isMobile && supportsDragDrop) {
      return "Drag plants to place them in your garden";
    }
    return null;
  };

  const instructionText = getInstructionText();

  return (
    <div className="plant-inventory">
      <h3 className={`plant-inventory-title ${isMobile ? 'text-sm py-2 px-3' : 'text-lg py-3 px-4'}`}>
        Plant Inventory ({inventory.length})
      </h3>
      
      {instructionText && (
        <div className={`inventory-instruction ${isMobile ? 'p-2 mb-2' : 'p-3 mb-3'}`}>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
            {instructionText}
          </p>
        </div>
      )}

      <div className={`inventory-grid ${isMobile ? 'gap-2' : 'gap-3'}`}>
        {inventory.map((item) => (
          <div
            key={item.id}
            draggable={supportsDragDrop && !isMobile}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onClick={() => handlePlantClick(item)}
            className={`inventory-item ${
              supportsDragDrop && !isMobile ? 'draggable' : ''
            } ${
              selectedPlantItem?.id === item.id ? 'selected-for-planting' : ''
            } ${
              isMobile ? 'mobile-inventory-item' : ''
            }`}
          >
            <PlantCard
              inventoryItem={item}
              isSelected={selectedPlant && selectedPlant.id === item.id}
              showQuantity={true}
              showDragIndicator={supportsDragDrop && !isMobile}
              className={`${supportsDragDrop && !isMobile ? 'draggable-card' : ''} ${
                isMobile ? 'mobile-plant-card' : ''
              }`}
              isMobile={isMobile}
            />
          </div>
        ))}
      </div>

      {/* Inventory summary */}
      <div className={`inventory-summary ${isMobile ? 'p-2 mt-2' : 'p-4 mt-4'}`}>
        <div className={`rarity-counts ${isMobile ? 'mobile-rarity-counts' : ''}`}>
          {getRarityCounts(inventory).map(({ rarity, count }) => (
            <div key={rarity} className={`rarity-count ${rarity} ${isMobile ? 'mobile-rarity-count' : ''}`}>
              <span className={`rarity-name ${isMobile ? 'text-xs' : 'text-sm'}`}>{rarity}</span>
              <span className={`count ${isMobile ? 'text-xs px-1' : 'text-sm px-2'}`}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to count plants by rarity
const getRarityCounts = (inventory) => {
  const counts = inventory.reduce((acc, item) => {
    const rarity = item.plant_details.rarity;
    acc[rarity] = (acc[rarity] || 0) + item.quantity;
    return acc;
  }, {});

  return Object.entries(counts).map(([rarity, count]) => ({
    rarity,
    count
  }));
};

export default PlantInventory;