"use client";

import { useEffect, useRef } from "react";
import { Group, Rect, Image } from "react-konva";
import useImage from "use-image";
import type { KonvaEventObject } from "konva/lib/Node";
import type { CanvasElement } from "../types";

interface Props {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<CanvasElement>) => void;
  onTransformEnd: (attrs: { x: number; y: number; width: number; height: number; rotation: number }) => void;
}

export function ImageElement({ element, isSelected, onSelect, onChange, onTransformEnd }: Props) {
  const [image] = useImage((element as any).src || "");
  const shapeRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && shapeRef.current) {
      shapeRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <Group
      id={element.id}
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
      {isSelected && (
        <Rect
          width={element.width}
          height={element.height}
          fill="transparent"
          stroke="#11ABC4"
          strokeWidth={1}
          dash={[4, 4]}
        />
      )}
      {image ? (
        <Image
          ref={shapeRef}
          image={image}
          width={element.width}
          height={element.height}
        />
      ) : (
        <Rect width={element.width} height={element.height} fill="#f0f0f0" stroke="#ccc" strokeWidth={1} />
      )}
    </Group>
  );
}
