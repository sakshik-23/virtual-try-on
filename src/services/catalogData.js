// Spectra Optics - Eyewear Catalog & Domain Models
// Encapsulates physical dimensions (mm), 3D geometries, and face shape recommendations

export class EyewearItem {
  constructor({
    id,
    sku,
    name,
    brand,
    price,
    originalPrice,
    rating,
    reviewsCount,
    shape,
    type,
    size,
    dimensions,
    recommendedFaceShapes,
    tags,
    description,
    availableColors,
    availableLensTints,
    defaultColor,
    defaultLens,
    image,
    frontImage
  }) {
    this.id = id;
    this.sku = sku;
    this.name = name;
    this.brand = brand;
    this.price = price;
    this.originalPrice = originalPrice;
    this.rating = rating;
    this.reviewsCount = reviewsCount;
    this.shape = shape; // 'wayfarer' | 'round' | 'cat-eye' | 'rectangle'
    this.type = type;   // 'eyeglasses' | 'sunglasses'
    this.size = size;   // 'Narrow' | 'Medium' | 'Wide'
    this.dimensions = dimensions; // { lensWidth, bridgeWidth, templeLength, frameWidth } in mm
    this.recommendedFaceShapes = recommendedFaceShapes;
    this.tags = tags;
    this.description = description;
    this.availableColors = availableColors;
    this.availableLensTints = availableLensTints;
    this.defaultColor = defaultColor;
    this.defaultLens = defaultLens;
    this.image = image || '/images/eyewear/wayfarer_black.jpg';
    this.frontImage = frontImage || '/images/eyewear/exact_cutouts/exact_wayfarer_black.png';
  }

  get discountPercent() {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }

  matchesFaceShape(detectedShape) {
    if (!detectedShape) return false;
    return this.recommendedFaceShapes.includes(detectedShape);
  }
}

export const EYEWEAR_CATALOG = [
  new EyewearItem({
    id: "sp-wayfarer-01",
    sku: "SP-WF-101",
    name: "Spectra Classic Wayfarer",
    brand: "Spectra Signature",
    price: 1999,
    originalPrice: 3500,
    rating: 4.8,
    reviewsCount: 1420,
    shape: "wayfarer",
    type: "eyeglasses",
    size: "Medium",
    dimensions: {
      lensWidth: 52,
      bridgeWidth: 18,
      templeLength: 142,
      frameWidth: 138
    },
    recommendedFaceShapes: ["Oval", "Round", "Diamond"],
    tags: ["Bestseller", "Ultra Comfort"],
    description: "Iconic hand-finished acetate rims with flex-action titanium hinges for all-day ergonomic fit.",
    availableColors: [
      { id: "black", name: "Matte Black", hex: "#1c1c1e", metalness: 0.1, roughness: 0.6 },
      { id: "tortoise", name: "Havana Tortoise", hex: "#4a2c11", metalness: 0.15, roughness: 0.4 },
      { id: "navy", name: "Deep Navy", hex: "#1a2a3a", metalness: 0.2, roughness: 0.5 },
      { id: "crystal", name: "Transparent Crystal", hex: "#e2e8f0", metalness: 0.05, roughness: 0.1 }
    ],
    availableLensTints: [
      { id: "clear", name: "Clear Blue-Cut", hex: "#cffafe", opacity: 0.15, roughness: 0.05 },
      { id: "smoke", name: "Charcoal Sunglass", hex: "#1e293b", opacity: 0.85, roughness: 0.1 },
      { id: "amber", name: "Sunset Amber", hex: "#b45309", opacity: 0.75, roughness: 0.1 }
    ],
    defaultColor: "black",
    defaultLens: "clear",
    image: "/images/eyewear/wayfarer_black.jpg",
    frontImage: "/images/eyewear/exact_cutouts/exact_wayfarer_black.png"
  }),
  new EyewearItem({
    id: "sp-round-03",
    sku: "LU-RD-303",
    name: "Lumina Rimless Round Flex",
    brand: "Lumina Air",
    price: 1499,
    originalPrice: 2800,
    rating: 4.7,
    reviewsCount: 2310,
    shape: "round",
    type: "eyeglasses",
    size: "Medium",
    dimensions: {
      lensWidth: 49,
      bridgeWidth: 20,
      templeLength: 140,
      frameWidth: 134
    },
    recommendedFaceShapes: ["Square", "Oblong", "Diamond"],
    tags: ["Featherlight", "Ultra Slim"],
    description: "Minimalist circular geometry that softens angular jawlines with surgical steel flexibility.",
    availableColors: [
      { id: "rosegold", name: "Rose Gold", hex: "#b76e79", metalness: 0.8, roughness: 0.25 },
      { id: "gold", name: "Polished Gold", hex: "#eab308", metalness: 0.85, roughness: 0.2 },
      { id: "black", name: "Matte Black", hex: "#18181b", metalness: 0.4, roughness: 0.5 }
    ],
    availableLensTints: [
      { id: "clear", name: "Anti-Glare Clear", hex: "#e0f2fe", opacity: 0.12, roughness: 0.05 },
      { id: "rose", name: "Blush Tint", hex: "#f43f5e", opacity: 0.45, roughness: 0.08 }
    ],
    defaultColor: "rosegold",
    defaultLens: "clear",
    image: "/images/eyewear/round_rosegold.jpg",
    frontImage: "/images/eyewear/exact_cutouts/exact_round_rosegold.png"
  }),
  new EyewearItem({
    id: "sp-cateye-04",
    sku: "VG-CE-404",
    name: "Vogue Glam Winged Cat-Eye",
    brand: "Vogue Couture",
    price: 2299,
    originalPrice: 4200,
    rating: 4.9,
    reviewsCount: 1670,
    shape: "cat-eye",
    type: "eyeglasses",
    size: "Narrow",
    dimensions: {
      lensWidth: 53,
      bridgeWidth: 17,
      templeLength: 138,
      frameWidth: 136
    },
    recommendedFaceShapes: ["Round", "Oval", "Heart"],
    tags: ["Trending", "Statement Look"],
    description: "Sculpted winged silhouettes designed to lift facial features and accentuate cheekbones.",
    availableColors: [
      { id: "black", name: "Gloss Onyx", hex: "#09090b", metalness: 0.2, roughness: 0.2 },
      { id: "burgundy", name: "Wine Red", hex: "#831843", metalness: 0.2, roughness: 0.3 },
      { id: "tortoise", name: "Honey Tortoise", hex: "#78350f", metalness: 0.1, roughness: 0.4 }
    ],
    availableLensTints: [
      { id: "clear", name: "Digital Shield", hex: "#e0f2fe", opacity: 0.15, roughness: 0.05 },
      { id: "gradient-brown", name: "Warm Mocha", hex: "#451a03", opacity: 0.78, roughness: 0.1 }
    ],
    defaultColor: "black",
    defaultLens: "clear",
    image: "/images/eyewear/cateye_halfrim.jpg",
    frontImage: "/images/eyewear/exact_cutouts/exact_cateye_halfrim.png"
  }),
  new EyewearItem({
    id: "sp-rectangle-06",
    sku: "MV-RC-606",
    name: "Maven Executive Rectangle",
    brand: "Maven Studio",
    price: 1799,
    originalPrice: 3200,
    rating: 4.6,
    reviewsCount: 1150,
    shape: "rectangle",
    type: "eyeglasses",
    size: "Medium",
    dimensions: {
      lensWidth: 54,
      bridgeWidth: 17,
      templeLength: 142,
      frameWidth: 140
    },
    recommendedFaceShapes: ["Round", "Oval", "Diamond"],
    tags: ["Office", "Lightweight"],
    description: "Clean rectangular profile designed for professional confidence with flex memory metal temples.",
    availableColors: [
      { id: "black", name: "Matte Charcoal", hex: "#1f2937", metalness: 0.1, roughness: 0.7 },
      { id: "gunmetal", name: "Gunmetal", hex: "#64748b", metalness: 0.8, roughness: 0.3 },
      { id: "brown", name: "Espresso Brown", hex: "#3b2314", metalness: 0.1, roughness: 0.6 }
    ],
    availableLensTints: [
      { id: "clear", name: "Computer Blue-Light", hex: "#dbeafe", opacity: 0.12, roughness: 0.05 },
      { id: "dark-smoke", name: "Drive Shield", hex: "#111827", opacity: 0.8, roughness: 0.1 }
    ],
    defaultColor: "black",
    defaultLens: "clear",
    image: "/images/eyewear/rectangle_charcoal.jpg",
    frontImage: "/images/eyewear/exact_cutouts/exact_rectangle_charcoal.png"
  }),
  new EyewearItem({
    id: "sp-clubmaster-07",
    sku: "SP-CM-707",
    name: "Spectra Clubmaster Vintage Browline",
    brand: "Spectra Heritage",
    price: 2499,
    originalPrice: 4200,
    rating: 4.9,
    reviewsCount: 1840,
    shape: "wayfarer",
    type: "eyeglasses",
    size: "Medium",
    dimensions: {
      lensWidth: 51,
      bridgeWidth: 21,
      templeLength: 145,
      frameWidth: 139
    },
    recommendedFaceShapes: ["Oval", "Round", "Diamond"],
    tags: ["Vintage Icon", "Handcrafted Acetate"],
    description: "Classic 1950s browline silhouette featuring glossy Italian acetate upper arches and polished champagne gold wire rims.",
    availableColors: [
      { id: "black-gold", name: "Gloss Black & Gold", hex: "#1c1c1e", metalness: 0.6, roughness: 0.3 },
      { id: "tortoise-gold", name: "Havana & Gold", hex: "#5a3418", metalness: 0.6, roughness: 0.3 }
    ],
    availableLensTints: [
      { id: "clear", name: "Blue-Cut Shield", hex: "#cffafe", opacity: 0.15, roughness: 0.05 },
      { id: "amber", name: "Topaz Tint", hex: "#d97706", opacity: 0.7, roughness: 0.08 }
    ],
    defaultColor: "black-gold",
    defaultLens: "clear",
    image: "/images/eyewear/clubmaster_black.jpg",
    frontImage: "/images/eyewear/exact_cutouts/exact_clubmaster_black.png"
  }),
  new EyewearItem({
    id: "sp-wayfarer-tortoise",
    sku: "SP-WF-102",
    name: "Spectra Artisan Havana Tortoise",
    brand: "Spectra Signature",
    price: 2199,
    originalPrice: 3800,
    rating: 4.9,
    reviewsCount: 960,
    shape: "wayfarer",
    type: "eyeglasses",
    size: "Medium",
    dimensions: {
      lensWidth: 52,
      bridgeWidth: 18,
      templeLength: 142,
      frameWidth: 138
    },
    recommendedFaceShapes: ["Oval", "Round", "Diamond"],
    tags: ["Artisan Edition", "Warm Amber"],
    description: "Hand-polished warm Havana tortoise acetate with silver hinge pin accents and flexible memory hinges.",
    availableColors: [
      { id: "tortoise", name: "Warm Havana Tortoise", hex: "#5c3317", metalness: 0.15, roughness: 0.35 }
    ],
    availableLensTints: [
      { id: "clear", name: "Clear Blue-Cut", hex: "#cffafe", opacity: 0.15, roughness: 0.05 }
    ],
    defaultColor: "tortoise",
    defaultLens: "clear",
    image: "/images/eyewear/wayfarer_tortoise.jpg",
    frontImage: "/images/eyewear/exact_cutouts/exact_wayfarer_tortoise.png"
  }),
  new EyewearItem({
    id: "sp-round-gold",
    sku: "LU-RD-304",
    name: "Lumina 24K Polished Gold Round",
    brand: "Lumina Air",
    price: 1899,
    originalPrice: 3100,
    rating: 4.8,
    reviewsCount: 1120,
    shape: "round",
    type: "eyeglasses",
    size: "Narrow",
    dimensions: {
      lensWidth: 48,
      bridgeWidth: 20,
      templeLength: 140,
      frameWidth: 132
    },
    recommendedFaceShapes: ["Square", "Oblong", "Diamond"],
    tags: ["Pure Gold Finish", "Featherlight"],
    description: "Ultra-slender 24K electroplated gold circular wireframes with hypoallergenic silicone bridge pads.",
    availableColors: [
      { id: "gold", name: "24K Polished Gold", hex: "#d4af37", metalness: 0.9, roughness: 0.15 }
    ],
    availableLensTints: [
      { id: "clear", name: "Anti-Glare Clear", hex: "#e0f2fe", opacity: 0.12, roughness: 0.05 }
    ],
    defaultColor: "gold",
    defaultLens: "clear",
    image: "/images/eyewear/round_gold.jpg",
    frontImage: "/images/eyewear/exact_cutouts/exact_round_gold.png"
  })
];

export const FACE_SHAPES_INFO = {
  Oval: {
    title: "Oval Face Shape",
    description: "Well-balanced proportions with gently curved jawline and slightly wider cheekbones. Most versatile shape!",
    recommendedFrames: ["Wayfarer", "Cat-Eye", "Rectangle", "Round"],
    bestStyles: ["sp-wayfarer-01", "sp-cateye-04", "sp-clubmaster-07"]
  },
  Round: {
    title: "Round Face Shape",
    description: "Soft curved angles with roughly equal width and length. Angular frames add definition and length.",
    recommendedFrames: ["Rectangle", "Wayfarer", "Cat-Eye"],
    bestStyles: ["sp-rectangle-06", "sp-wayfarer-01", "sp-cateye-04"]
  },
  Square: {
    title: "Square Face Shape",
    description: "Strong, prominent jawline with straight chin and broad forehead. Curved frames soften strong angles.",
    recommendedFrames: ["Round", "Wayfarer"],
    bestStyles: ["sp-round-03", "sp-round-gold", "sp-wayfarer-01"]
  },
  Heart: {
    title: "Heart Face Shape",
    description: "Broader forehead narrowing down to a delicate, tapered chin. Bottom-heavy or winged frames balance proportions.",
    recommendedFrames: ["Cat-Eye", "Round", "Wayfarer"],
    bestStyles: ["sp-cateye-04", "sp-round-03", "sp-round-gold"]
  },
  Diamond: {
    title: "Diamond Face Shape",
    description: "Dramatic high cheekbones with narrower forehead and jawline. Rimless or oval/cat-eye frames complement nicely.",
    recommendedFrames: ["Cat-Eye", "Round", "Wayfarer"],
    bestStyles: ["sp-round-03", "sp-wayfarer-01", "sp-cateye-04"]
  },
  Oblong: {
    title: "Oblong / Rectangle Face Shape",
    description: "Face length notably exceeds width, with straight cheek line. Deep, tall frames create horizontal harmony.",
    recommendedFrames: ["Round", "Wayfarer"],
    bestStyles: ["sp-round-03", "sp-wayfarer-01", "sp-round-gold"]
  }
};
