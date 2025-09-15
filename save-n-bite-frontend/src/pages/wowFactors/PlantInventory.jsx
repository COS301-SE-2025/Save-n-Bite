import React from 'react';
import PlantCard from '../../components/garden/PlantCard';
import './PlantInventory.css';

const PlantInventory = ({ 
  inventory, 
  selectedPlant, 
  onPlantSelect, 
  mode 
}) => {
  if (!inventory || inventory.length === 0) {
    return (
      <div className="plant-inventory empty">
        <h3>🎒 Plant Inventory</h3>
        <div className="empty-inventory">
          <div className="empty-icon">🌱</div>
          <p>No plants in inventory</p>
          <small>Complete orders to earn plants!</small>
        </div>
      </div>
    );
  }

  return (
    <div className="plant-inventory">
      <h3>🎒 Plant Inventory ({inventory.length})</h3>
      
      {mode === 'place' && (
        <div className="inventory-instruction">
          <p>Select a plant to place in your garden:</p>
        </div>
      )}

      <div className="inventory-grid">
        {inventory.map((item) => (
          <PlantCard
            key={item.id}
            inventoryItem={item}
            isSelected={selectedPlant && selectedPlant.id === item.id}
            onClick={() => onPlantSelect(item)}
            showQuantity={true}
            className={mode === 'place' ? 'selectable' : ''}
          />
        ))}
      </div>

      {/* Inventory summary */}
      <div className="inventory-summary">
        <div className="rarity-counts">
          {getRarityCounts(inventory).map(({ rarity, count }) => (
            <div key={rarity} className={`rarity-count ${rarity}`}>
              <span className="rarity-name">{rarity}</span>
              <span className="count">{count}</span>
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