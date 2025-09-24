import React from 'react';
import './PlantCard.css';

const PlantCard = ({ 
  inventoryItem, 
  isSelected = false, 
  onClick, 
  showQuantity = false,
  className = ""
}) => {
  const { plant_details, quantity, earned_reason, earned_at } = inventoryItem;

  const handleClick = () => {
    if (onClick) onClick(inventoryItem);
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#4CAF50',
      uncommon: '#2196F3',
      rare: '#9C27B0',
      epic: '#FF9800',
      legendary: '#F44336'
    };
    return colors[rarity] || '#666';
  };

  const getEarnedReasonText = (reason) => {
    const reasons = {
      order: 'Order Reward',
      milestone_orders: 'Order Milestone',
      milestone_amount: 'Amount Milestone',
      milestone_businesses: 'Business Milestone',
      special_event: 'Special Event',
      admin_grant: 'Admin Grant'
    };
    return reasons[reason] || reason;
  };

  return (
    <div 
      className={`plant-card ${className} ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      style={{ '--rarity-color': getRarityColor(plant_details.rarity) }}
    >
      {/* Plant image/icon placeholder */}
      <div 
        className="plant-image"
        style={{ backgroundColor: plant_details.icon_color }}
      >
        <span className="plant-emoji">🌱</span>
      </div>

      {/* Plant info */}
      <div className="plant-info">
        <h4 className="plant-name">{plant_details.name}</h4>
        <div className="plant-rarity">
          <span className={`rarity-badge ${plant_details.rarity}`}>
            {plant_details.rarity}
          </span>
        </div>
        
        {showQuantity && quantity > 1 && (
          <div className="quantity-badge">
            ×{quantity}
          </div>
        )}
      </div>

      {/* Earned info */}
      <div className="earned-info">
        <small className="earned-reason">
          {getEarnedReasonText(earned_reason)}
        </small>
        <small className="earned-date">
          {new Date(earned_at).toLocaleDateString()}
        </small>
      </div>

      {/* Hover overlay */}
      <div className="card-overlay">
        <div className="overlay-content">
          <p className="plant-category">{plant_details.category}</p>
          <p className="plant-description">
            {plant_details.description.substring(0, 100)}...
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlantCard;