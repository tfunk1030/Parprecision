'use client'

import React, { useState, useCallback } from 'react'
import { useWidgetConfig } from '@/lib/widget-config-context'
import { useWidgetConfig } from '@/lib/widget-config-context'
interface WidgetWrapperProps {
  widget: {
    id: string;

interface WidgetWrapperProps {
  widget: {
    id: string;
    type: string;
    size?: { width: number; height: number };
  };
  onRemove: () => void;
  onSizeChange: () => void;
}

function WidgetWrapper({ widget, onRemove, onSizeChange }: WidgetWrapperProps) {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-200">{widget.type}</span>
          <div className="flex gap-2">
            <button
              onClick={onSizeChange}
              className="p-1 text-gray-400 hover:text-gray-200"
            >
              Resize
            </button>
            <button
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-gray-200"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  )
            <button
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-gray-200"
            >
  const { getConfig } = useWidgetConfig()
              Remove
            </button>
  const handleDragEnd = useCallback((result: DragEndEvent) => {
    if (!result.over || !activeLayout) return;

    const { active, over } = result;
    const widgets = Array.from(activeLayout.widgets);
    const oldIndex = widgets.findIndex(item => item.id === active.id);
    const newIndex = widgets.findIndex(item => item.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const [removed] = widgets.splice(oldIndex, 1);
      widgets.splice(newIndex, 0, removed);
      updateWidget(activeLayout.id, removed.id, { position: { x: newIndex, y: 0 } });
    const widgets = Array.from(activeLayout.widgets);
  }, [activeLayout, updateWidget]);

  const handleWidgetRemove = useCallback((widgetId: string) => {
    if (!activeLayout) return;
    removeWidget(activeLayout.id, widgetId);
  }, [activeLayout, removeWidget]);
  const handleSizeSelect = useCallback((widgetId: string, size: WidgetSize) => {
  const handleSizeSelect = useCallback((widgetId: string, size: WidgetSize) => {
    if (!activeLayout) return;
    updateWidget(activeLayout.id, widgetId, { size: WIDGET_SIZES[size] });
    setShowSizeOverlay(null);
  }, [activeLayout, updateWidget]);

  if (!activeLayout) return null;

  const overlayWidget = showSizeOverlay ? activeLayout.widgets.find(w => w.id === showSizeOverlay) : null;
            widget={widget}
            onRemove={() => handleWidgetRemove(widget.id)}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {activeLayout.widgets.map((widget) => (
        <div key={widget.id} className="relative">
          <WidgetWrapper
            widget={widget}
            onRemove={() => handleWidgetRemove(widget.id)}
            onSizeChange={() => setShowSizeOverlay(widget.id)}
          />
      ))}

      {showSizeOverlay && overlayWidget && (
          widgetId={showSizeOverlay}
          currentSize={overlayWidget.size || WIDGET_SIZES.small}
          onSizeSelect={(size) => handleSizeSelect(showSizeOverlay, size)}
          onClose={() => setShowSizeOverlay(null)}
  );