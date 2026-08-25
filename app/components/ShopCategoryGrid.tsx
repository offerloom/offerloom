import { shopCategoryTiles } from "../lib/hero-categories";

type ShopCategoryGridProps = {
  variant?: "default" | "compact" | "sidebar";
  heading?: string;
};

export default function ShopCategoryGrid({ variant = "default", heading }: ShopCategoryGridProps) {
  return (
    <div className={`shopCategoryWrap shopCategoryWrap-${variant}`}>
      {heading ? <strong className="shopCategoryHeading">{heading}</strong> : null}
      <div className={`shopCategoryGrid shopCategoryGrid-${variant}`}>
        {shopCategoryTiles.map((tile) => (
          <a
            className={`shopCategoryTile tile-${tile.theme}`}
            href={tile.amazonUrl}
            key={tile.id}
            rel="sponsored noopener noreferrer"
            target="_blank"
          >
            <span className="shopTileArt" style={{ backgroundImage: `url(${tile.image})` }} aria-hidden="true" />
            <span className="shopTileBody">
              <span className="shopTileIcon" aria-hidden="true">{tile.icon}</span>
              <strong>{tile.name}</strong>
              <small>Amazon →</small>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
