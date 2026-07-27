"use client";

import { useEffect, useRef } from "react";
import { Group, Rect, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { CanvasElement } from "../types";

interface Props {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<CanvasElement>) => void;
  onTransformEnd: (attrs: { x: number; y: number; width: number; height: number; rotation: number }) => void;
  onDblClick?: () => void;
}

export function ButtonElement({ element, isSelected, onSelect, onChange, onTransformEnd, onDblClick }: Props) {
  const groupRef = useRef<any>(null);
  const e = element as any;

  useEffect(() => {
    if (isSelected && groupRef.current) {
      groupRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, e.text, e.backgroundColor]);

  return (
    <Group
      id={element.id}
      ref={groupRef}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.opacity}
      visible={element.visible}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDblClick}
      onDblTap={onDblClick}
      onDragStart={onSelect}
      onDragEnd={(ev: KonvaEventObject<DragEvent>) => {
        onChange({ x: ev.target.x(), y: ev.target.y() } as any);
      }}
      onTransformEnd={(ev: KonvaEventObject<Event>) => {
        const node = ev.target;
        onTransformEnd({
          x: node.x(),
          y: node.y(),
          width: node.width() * node.scaleX(),
          height: node.height() * node.scaleY(),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    >
      <Rect
        width={element.width}
        height={element.height}
        fill={e.backgroundColor || "#11ABC4"}
        cornerRadius={e.borderRadius || 12}
        stroke={isSelected ? "#11ABC4" : "transparent"}
        strokeWidth={isSelected ? 2 : 0}
      />
      <Text
        text={e.text || "Botón"}
        width={element.width}
        height={element.height}
        fontSize={e.fontSize || 18}
        fontFamily={e.fontFamily || "Nunito"}
        fontStyle={(e.fontWeight || "700") === "700" ? "bold" : "normal"}
        fill={e.textColor || "#FFFFFF"}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
}
