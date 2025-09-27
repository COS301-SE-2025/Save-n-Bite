// src/components/badges/BadgeSVG.jsx
import React, { useState, useEffect } from 'react';

const BadgeSVG = ({ badge, className = "w-full h-full", fallbackIcon = null }) => {
  const [svgContent, setSvgContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadSvgImage();
    // eslint-disable-next-line
  }, [badge?.badge_type?.svg_filename, badge?.badge_type?.name]);
console.log("BadgeSVG rendered", badge);

  const loadSvgImage = async () => {
    if (!badge?.badge_type) {
      setError(true);
      setSvgContent(null);
      return;
    }

    let imagePath = null;
    if (badge.badge_type.svg_filename) {
      imagePath = `/assets/images/badges/${badge.badge_type.svg_filename}`;
    } else {
      const cleanName = badge.badge_type.name.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/-/g, '_');
      imagePath = `/assets/images/badges/${cleanName}.svg`;
    }

    setLoading(true);
    setError(false);
    setSvgContent(null);

    try {
      console.log("BadgeSVG: Fetching SVG from", imagePath);
      const response = await fetch(imagePath);
      if (!response.ok) {
        throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
      }
      const svgText = await response.text();
      if (!svgText.includes('<svg')) {
        throw new Error('SVG content invalid');
      }
      setSvgContent(svgText);
    } catch (err) {
      console.warn(`BadgeSVG: Failed to load SVG for badge ${badge.badge_type.name} from ${imagePath}:`, err);
      setError(true);
      setSvgContent(null);
    } finally {
      setLoading(false);
    }
  };

  // Fallback icon logic (unchanged)
  const getRarityColor = (rarity) => {
    const colors = {
      common: '#6B7280',
      uncommon: '#10B981', 
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B'
    };
    return colors[rarity] || colors.common;
  };

  const getFallbackIcon = () => {
    if (fallbackIcon) return fallbackIcon;
    const category = badge?.badge_type?.category || 'milestone';
    const rarity = badge?.badge_type?.rarity || 'common';
    const color = getRarityColor(rarity);
    const icons = {
      performance: (
        <svg viewBox="0 0 24 24" fill={color} className={className}>
          <path d="M12 2L13.09 8.26L22 9L16 14L18 22L12 18.5L6 22L8 14L2 9L10.91 8.26L12 2Z"/>
        </svg>
      ),
      milestone: (
        <svg viewBox="0 0 24 24" fill={color} className={className}>
          <circle cx="12" cy="12" r="3" fill={color}/>
          <path d="M12 1L15.09 8.26L22 9L16 14L18 22L12 18L6 22L8 14L2 9L8.91 8.26L12 1Z" stroke={color} strokeWidth="1" fill="none"/>
        </svg>
      ),
      recognition: (
        <svg viewBox="0 0 24 24" fill={color} className={className}>
          <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z"/>
        </svg>
      ),
      monthly: (
        <svg viewBox="0 0 24 24" fill={color} className={className}>
          <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM12 8L7 13H17L12 8Z"/>
        </svg>
      ),
      special: (
        <svg viewBox="0 0 24 24" fill={color} className={className}>
          <path d="M12 2L13.09 8.26L22 9L16 14L18 22L12 18.5L6 22L8 14L2 9L10.91 8.26L12 2Z"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
      )
    };
    return icons[category] || icons.milestone;
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    );
  }

  if (error || !svgContent) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        {getFallbackIcon()}
        <span className="text-xs text-red-500 ml-1">Badge image unavailable</span>
      </div>
    );
  }

  // Only render if svgContent is valid
  return (
    <span
      className="svg-wrapper"
      dangerouslySetInnerHTML={{
        __html: svgContent.replace(
          /<svg([^>]*)>/i,
          `<svg$1 class="${className}"`
        ),
      }}
    />
  );
};

export default BadgeSVG;