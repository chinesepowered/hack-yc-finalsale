import type { GarmentType, TryOnRoute } from "./types";

/** Which YouCam API dresses the shopper in this garment. Decided in code from the listing reader's garment type. */
export function tryOnRouteFor(type: GarmentType): TryOnRoute {
  switch (type) {
    case "jacket":
    case "coat":
    case "vest":
      return { endpoint: "cloth-v4", garment_category: "outer", layer: 3, label: "AI Clothes, outerwear" };
    case "sweater":
    case "cardigan":
    case "top":
    case "shirt":
    case "tshirt":
    case "blouse":
      return { endpoint: "cloth-v4", garment_category: "upper_body", layer: 2, label: "AI Clothes, upper body" };
    case "dress":
    case "jumpsuit":
      return { endpoint: "cloth-v4", garment_category: "full_body", layer: 0, label: "AI Clothes, full body" };
    case "skirt":
    case "pants":
    case "jeans":
    case "shorts":
      return { endpoint: "cloth-v4", garment_category: "lower_body", layer: 1, label: "AI Clothes, lower body" };
    case "shoes":
    case "boots":
    case "sneakers":
    case "sandals":
      return { endpoint: "shoes-transfer", layer: 4, label: "AI Shoes" };
    case "bag":
      return { endpoint: "bag", layer: 5, label: "AI Bag" };
    default:
      return { endpoint: "cloth-v4", garment_category: "auto", layer: 2, label: "AI Clothes, auto" };
  }
}

/** Put two garments in dressing order: dress or bottoms first, then tops, outerwear, shoes, bag. */
export function layerOrder<T extends { route: TryOnRoute }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.route.layer - b.route.layer);
}

export function endpointName(endpoint: TryOnRoute["endpoint"]) {
  return endpoint === "cloth-v4" ? "YouCam AI Clothes" : endpoint === "shoes-transfer" ? "YouCam AI Shoes" : "YouCam AI Bag";
}
