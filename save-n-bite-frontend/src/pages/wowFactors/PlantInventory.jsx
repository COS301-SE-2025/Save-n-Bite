import React, { useEffect } from 'react';
import PlantCard from '../../components/garden/PlantCard';
import useMobileDragDrop from '../../hooks/useMobileDragDrop';
import './PlantInventory.css';

const PlantInventory = ({ 
  inventory, 
  selectedPlant, 
  onPlantSelect, 
  onDragStart,
  onDragEnd,
  onMobilePlantDrop, // New prop for mobile drop handling
  supportsDragDrop = false,
  mode 
}) => {
  const {
    draggedItem,
    isDragging,
    handleDragStart: mobileHandleDragStart,
    handleDragMove,
    handleDragEnd: mobileHandleDragEnd,
    handleDragCancel
  } = useMobileDragDrop();

  // Add global event listeners for mobile drag
  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => handleDragMove(e);
      const handleEnd = (e) => mobileHandleDragEnd(e, onMobilePlantDrop);
      const handleCancel = () => handleDragCancel();

      // Add touch and mouse event listeners
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('scroll', handleCancel, true);
      
      // Prevent body scroll during drag
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('touchend', handleEnd);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('scroll', handleCancel, true);
        
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      };
    }
  }, [isDragging, handleDragMove, mobileHandleDragEnd, handleDragCancel, onMobilePlantDrop]);

  if (!inventory || inventory.length === 0) {
    return (
      <div className="plant-inventory empty">
        <h3>Plant Inventory</h3>
        <div className="empty-inventory">
          <div className="empty-icon">🌱</div>
          <p>No plants in inventory</p>
          <small>Complete orders to earn plants!</small>
        </div>
      </div>
    );
  }

  // Handle the start of dragging for both desktop and mobile
  const handleDragStartUnified = (item, event) => {
    // For touch devices, use our custom mobile drag
    if (event.type === 'touchstart') {
      mobileHandleDragStart(item, event);
      if (onDragStart) onDragStart(item);
    } 
    // For desktop, use traditional HTML5 drag and drop
    else if (event.type === 'dragstart') {
      if (onDragStart) onDragStart(item);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.id);
    }
  };

  const handleDragEndUnified = (event) => {
    // Only handle desktop drag end here, mobile is handled by global listeners
    if (event.type === 'dragend' && onDragEnd) {
      onDragEnd();
    }
  };

  return (
    <div className="plant-inventory">
      <h3>Plant Inventory ({inventory.length})</h3>
      
      {supportsDragDrop && (
        <div className="inventory-instruction">
          <p>
            {window.innerWidth <= 768 
              ? "Touch and hold plants to drag them to your garden" 
              : "Drag plants to place them in your garden"}
          </p>
        </div>
      )}

      <div className="inventory-grid">
        {inventory.map((item) => (
          <div
            key={item.id}
            draggable={supportsDragDrop}
            onDragStart={(e) => handleDragStartUnified(item, e)}
            onDragEnd={handleDragEndUnified}
            onTouchStart={(e) => supportsDragDrop && handleDragStartUnified(item, e)}
            onMouseDown={(e) => supportsDragDrop && handleDragStartUnified(item, e)}
            className={`inventory-item ${supportsDragDrop ? 'draggable' : ''} ${
              draggedItem?.id === item.id ? 'currently-dragging' : ''
            }`}
          >
            <PlantCard
              inventoryItem={item}
              isSelected={selectedPlant && selectedPlant.id === item.id}
              onClick={() => onPlantSelect && onPlantSelect(item)}
              showQuantity={true}
              showDragIndicator={supportsDragDrop}
              className={supportsDragDrop ? 'draggable-card' : ''}
            />
          </div>
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