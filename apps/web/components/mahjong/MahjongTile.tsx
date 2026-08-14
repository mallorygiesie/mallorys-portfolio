"use client";

export type NumberTile = { kind: "number"; suit: "bam" | "crak" | "dot"; value: 1|2|3|4|5|6|7|8|9 };
export type WindTile   = { kind: "wind";   value: "E" | "S" | "W" | "N" };
export type DragonTile = { kind: "dragon"; value: "R" | "G" | "Soap" };
export type Tile = NumberTile | WindTile | DragonTile;
export type TileSize = "sm" | "md" | "lg";

function tileFile(tile: Tile): string {
  if (tile.kind === "number") return `/tiles/${tile.suit}-${tile.value}.png`;
  if (tile.kind === "wind")   return `/tiles/wind-${tile.value}.png`;
  return `/tiles/dragon-${tile.value}.png`;
}

const SIZES: Record<TileSize, { w: number; h: number }> = {
  sm: { w: 28, h: 38 },
  md: { w: 36, h: 48 },
  lg: { w: 48, h: 64 },
};

interface Props {
  tile: Tile;
  size?: TileSize;
  rotate?: number;
  className?: string;
}

export default function MahjongTile({ tile, size = "md", rotate = 0, className = "" }: Props) {
  const { w, h } = SIZES[size];
  const src = tileFile(tile);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={w}
      height={h}
      className={`inline-block flex-shrink-0 rounded-sm object-cover ${className}`}
      style={{
        width: w,
        height: h,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    />
  );
}
