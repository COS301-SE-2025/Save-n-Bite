// hooks/useMobileDragDrop.js
import { useState, useRef, useCallback } from 'react';

const useMobileDragDrop = () => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [targetElement, setTargetElement] = useState(null);
  const dragElementRef = useRef(null);
  const ghostElementRef = useRef(null);

  // Start dragging for both mouse and touch
  const handleDragStart = useCallback((item, event) => {
    event.preventDefault();
    
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    setDraggedItem(item);
    setIsDragging(true);
    setDragPosition({ x: clientX, y: clientY });
    
    // Create ghost element for visual feedback
    if (event.currentTarget && !ghostElementRef.current) {
      const ghost = event.currentTarget.cloneNode(true);
      ghost.style.position = 'fixed';
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '9999';
      ghost.style.opacity = '0.8';
      ghost.style.transform = 'scale(0.9)';
      ghost.style.transition = 'none';
      ghost.style.left = `${clientX - 50}px`;
      ghost.style.top = `${clientY - 50}px`;
      ghost.style.width = '100px';
      ghost.style.height = '100px';
      ghost.classList.add('dragging-ghost');
      
      document.body.appendChild(ghost);
      ghostElementRef.current = ghost;
    }
  }, []);

  // Handle dragging movement
  const handleDragMove = useCallback((event) => {
    if (!isDragging || !draggedItem) return;
    
    event.preventDefault();
    
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    setDragPosition({ x: clientX, y: clientY });
    
    // Update ghost element position
    if (ghostElementRef.current) {
      ghostElementRef.current.style.left = `${clientX - 50}px`;
      ghostElementRef.current.style.top = `${clientY - 50}px`;
    }
    
    // Find element under touch/mouse
    const elementBelow = document.elementFromPoint(clientX, clientY);
    const dropTarget = elementBelow?.closest('[data-drop-target]');
    
    if (dropTarget !== targetElement) {
      // Remove highlight from previous target
      if (targetElement) {
        targetElement.classList.remove('drag-over-mobile');
      }
      
      // Add highlight to new target
      if (dropTarget) {
        dropTarget.classList.add('drag-over-mobile');
      }
      
      setTargetElement(dropTarget);
    }
  }, [isDragging, draggedItem, targetElement]);

  // End dragging
  const handleDragEnd = useCallback((event, onDrop) => {
    if (!isDragging) return;
    
    event.preventDefault();
    
    const clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
    const clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
    
    // Find final drop target
    const elementBelow = document.elementFromPoint(clientX, clientY);
    const dropTarget = elementBelow?.closest('[data-drop-target]');
    
    // Handle drop
    if (dropTarget && draggedItem && onDrop) {
      const tileData = JSON.parse(dropTarget.dataset.tileData || '{}');
      onDrop(draggedItem, tileData);
    }
    
    // Cleanup
    if (ghostElementRef.current) {
      document.body.removeChild(ghostElementRef.current);
      ghostElementRef.current = null;
    }
    
    // Remove all drag highlights
    document.querySelectorAll('.drag-over-mobile').forEach(el => {
      el.classList.remove('drag-over-mobile');
    });
    
    setDraggedItem(null);
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
    setTargetElement(null);
  }, [isDragging, draggedItem]);

  // Cancel dragging (on scroll or other interruption)
  const handleDragCancel = useCallback(() => {
    if (ghostElementRef.current) {
      document.body.removeChild(ghostElementRef.current);
      ghostElementRef.current = null;
    }
    
    document.querySelectorAll('.drag-over-mobile').forEach(el => {
      el.classList.remove('drag-over-mobile');
    });
    
    setDraggedItem(null);
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
    setTargetElement(null);
  }, []);

  return {
    draggedItem,
    isDragging,
    dragPosition,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel
  };
};

export default useMobileDragDrop;