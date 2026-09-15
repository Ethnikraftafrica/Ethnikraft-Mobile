export interface CraftCategory {
  id: string;
  name: string;
  value: string;
  iconName: string;
  tagline: string;
  accentColor: string;
}

export const CRAFT_CATEGORIES: CraftCategory[] = [
  {
    id: 'wears',
    name: 'Wears & Apparel',
    value: 'WEARS',
    iconName: 'shirt-outline',
    tagline: 'Agbada, Kaftans, Aso-Oke, Dresses',
    accentColor: '#C46C27',
  },
  {
    id: 'shoes',
    name: 'Shoes & Footwear',
    value: 'SHOES',
    iconName: 'footsteps-outline',
    tagline: 'Handmade Leather Loafers, Slippers',
    accentColor: '#8B5A2B',
  },
  {
    id: 'bags',
    name: 'Bags & Satchels',
    value: 'BAGS',
    iconName: 'bag-handle-outline',
    tagline: 'Full-Grain Leather Totes, Clutches',
    accentColor: '#A0522D',
  },
  {
    id: 'accessories',
    name: 'Jewelry & Beads',
    value: 'ACCESSORIES',
    iconName: 'diamond-outline',
    tagline: 'Coral Beads, Brass Filigree, Gems',
    accentColor: '#B8860B',
  },
  {
    id: 'paintings',
    name: 'Art & Paintings',
    value: 'PAINTINGS',
    iconName: 'color-palette-outline',
    tagline: 'Canvas Murals, Oil Portraits, Mixed Media',
    accentColor: '#CD853F',
  },
  {
    id: 'antiques',
    name: 'Antiques & Relics',
    value: 'ANTIQUES',
    iconName: 'trophy-outline',
    tagline: 'Bronze Castings, Restored Relics',
    accentColor: '#704214',
  },
  {
    id: 'crafts',
    name: 'Handicrafts',
    value: 'CRAFTS',
    iconName: 'hammer-outline',
    tagline: 'Pottery, Wood Sculptures, Woven Art',
    accentColor: '#556B2F',
  },
];

export const CATEGORY_MATERIALS: Record<string, { type: string; materials: string[] }[]> = {
  WEARS: [
    {
      type: 'African Fabrics',
      materials: ['Ankara Fabric', 'Kente Fabric', 'Aso Oke', 'Adire', 'Mud Cloth', 'Shweshwe'],
    },
    {
      type: 'Natural Fabrics',
      materials: ['Pure Linen', 'Egyptian Cotton', 'Raw Silk', 'Cashmere Wool', 'Hemp'],
    },
    {
      type: 'Luxury & Special',
      materials: ['Embroidered Brocade', 'Silk Velvet', 'Italian Satin', 'Premium Denim', 'Soft Suede'],
    },
  ],
  SHOES: [
    {
      type: 'Heritage Materials',
      materials: ['Kano Pull-up Leather', 'Raffia Weave', 'Aso Oke Accents', 'Hand-stitched Beads', 'Calabash Accents'],
    },
    {
      type: 'Modern Leather & Textiles',
      materials: ['Full-Grain Calfskin', 'Italian Suede', 'Waxed Canvas', 'Nubuck'],
    },
  ],
  BAGS: [
    {
      type: 'Heritage Materials',
      materials: ['Vegetable-Tanned Leather', 'Handwoven Raffia', 'Jute & Sisal', 'Ankara Trim Leather', 'Beaded Panels'],
    },
    {
      type: 'Modern Leather',
      materials: ['Full-Grain Leather', 'Suede', 'Waxed Heavy Canvas', 'Brass Hardware Insets'],
    },
  ],
  ACCESSORIES: [
    {
      type: 'Precious & Cultural',
      materials: ['Natural Edo Coral Beads', 'Carved Brass', 'Cast Bronze', '24k Gold Plated Filigree', 'Sterling Silver', 'Cowrie Shells'],
    },
    {
      type: 'Stones & Organic',
      materials: ['Turquoise Stones', 'Carved Hardwood', 'Glass Krobo Beads', 'Amber Resin'],
    },
  ],
  PAINTINGS: [
    {
      type: 'Canvas & Surfaces',
      materials: ['Linen Canvas', 'Textured Hardwood Panel', 'African Parchment Paper', 'Calabash Plate', 'Bark Cloth'],
    },
    {
      type: 'Mediums',
      materials: ['Heavy Body Acrylic', 'Oil Paint', 'Natural Earth Pigments', 'Charcoal & Gold Leaf', 'Mixed Media Sand'],
    },
  ],
  ANTIQUES: [
    {
      type: 'Metals & Alloys',
      materials: ['Lost-Wax Cast Bronze', 'Forged Brass', 'Copper Filigree', 'Wrought Iron'],
    },
    {
      type: 'Earthen & Wood',
      materials: ['Terracotta', 'Aged Mahogany Wood', 'Ebony Wood', 'Granite Stone'],
    },
  ],
  CRAFTS: [
    {
      type: 'Plant & Fibers',
      materials: ['Handwoven Raffia', 'Sisal Twine', 'Palm Frond Weave', 'Carved Teak Wood'],
    },
    {
      type: 'Earthen & Ceramic',
      materials: ['Hand-thrown Clay', 'Stoneware Glaze', 'Glass Mosaic Beads', 'Carved Calabash'],
    },
  ],
};

export const CATEGORY_CONFIG: Record<
  string,
  {
    sizes: string[];
    measurementPlaceholder: string;
    showSize: boolean;
    showMeasurements: boolean;
    titlePlaceholder: string;
    detailsPlaceholder: string;
    ctaLabel: string;
  }
> = {
  WEARS: {
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Custom / Free Size'],
    measurementPlaceholder: 'e.g. Chest: 42in, Waist: 34in, Height: 5ft 11in, Trouser Length: 40in',
    showSize: true,
    showMeasurements: true,
    titlePlaceholder: 'e.g. Royal Magenta Aso-Oke Agbada Set',
    detailsPlaceholder: 'Describe the embroidery style, collar cut, sleeve fullness, pockets, and occasion...',
    ctaLabel: 'Find Master Tailor',
  },
  SHOES: {
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45', '46', 'Custom Size'],
    measurementPlaceholder: 'e.g. Foot Length: 27.5cm, Foot Width: 10.2cm, Instep: High',
    showSize: true,
    showMeasurements: true,
    titlePlaceholder: 'e.g. Handcrafted Leather Monkstrap Loafers',
    detailsPlaceholder: 'Specify sole type (leather/rubber), buckle metal, insole cushioning, stitching...',
    ctaLabel: 'Find Master Cobbler',
  },
  BAGS: {
    sizes: ['Compact / Clutch', 'Medium Daily', 'Large Weekend Tote', 'Custom Dimension'],
    measurementPlaceholder: 'e.g. Width: 36cm, Height: 28cm, Depth: 14cm',
    showSize: true,
    showMeasurements: true,
    titlePlaceholder: 'e.g. Vintage Full-Grain Leather Weekender Tote',
    detailsPlaceholder: 'Mention internal laptop sleeve, strap length, brass zipper brand, lining fabric...',
    ctaLabel: 'Find Leather Artisan',
  },
  ACCESSORIES: {
    sizes: ['Adjustable', 'Standard Fit', 'Custom Sizing'],
    measurementPlaceholder: 'e.g. Neck: 16 inches, Wrist: 7.5 inches',
    showSize: true,
    showMeasurements: true,
    titlePlaceholder: 'e.g. 3-Tiered Edo Royal Coral Wedding Necklace',
    detailsPlaceholder: 'Include bead diameter preference, clasp locking style, spacer accents...',
    ctaLabel: 'Find Jewelry Artisan',
  },
  PAINTINGS: {
    sizes: ['16x20 in', '24x36 in', '36x48 in', '48x60 in', 'Custom Wall Dimensions'],
    measurementPlaceholder: 'e.g. Canvas Dimensions: 30x40 inches, Framed',
    showSize: true,
    showMeasurements: true,
    titlePlaceholder: 'e.g. African Heritage Cultural Canvas Mural',
    detailsPlaceholder: 'Specify focal subject, mood palette, texture style, floating frame inclusion...',
    ctaLabel: 'Find Fine Artist',
  },
  ANTIQUES: {
    sizes: ['Tabletop Display', 'Floor Standing', 'Wall Mount', 'Custom Artifact'],
    measurementPlaceholder: 'e.g. Height: 45cm, Base Diameter: 20cm',
    showSize: false,
    showMeasurements: true,
    titlePlaceholder: 'e.g. Benin Bronze King Head Reproduction',
    detailsPlaceholder: 'Provide era styling, patina finish preference, mounting stand requirements...',
    ctaLabel: 'Find Heritage Restorer',
  },
  CRAFTS: {
    sizes: ['Small Decor', 'Medium Accent', 'Large Statement Piece', 'Custom Craft'],
    measurementPlaceholder: 'e.g. Diameter: 35cm, Depth: 12cm',
    showSize: false,
    showMeasurements: false,
    titlePlaceholder: 'e.g. Hand-carved Mahogany Wall Mask',
    detailsPlaceholder: 'Describe traditional wood finishing, symbolic motifs, hanging hardware...',
    ctaLabel: 'Find Master Craftsman',
  },
};

export const MOCK_ARTISANS: Array<{
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  location: string;
  specialty: string;
  avatar: string;
  isAvailable: boolean;
  startingPrice: number;
  deliverySpeed: string;
}> = [
  {
    id: 'v-01',
    name: 'Adeola Royal Couturiers',
    category: 'WEARS',
    rating: 4.9,
    reviewCount: 48,
    location: 'Ikeja, Lagos',
    specialty: 'Royal Agbada, Kaftan & Ceremonial Regalia',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    isAvailable: true,
    startingPrice: 35000,
    deliverySpeed: '7 - 14 Days',
  },
  {
    id: 'v-02',
    name: 'Kano Tannery & Co.',
    category: 'BAGS',
    rating: 4.95,
    reviewCount: 112,
    location: 'Victoria Island, Lagos',
    specialty: 'Full-Grain Vegetable Tanned Leather Goods',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    isAvailable: true,
    startingPrice: 40000,
    deliverySpeed: '5 - 10 Days',
  },
  {
    id: 'v-03',
    name: 'Benin Royal Bronze Foundry',
    category: 'ANTIQUES',
    rating: 4.88,
    reviewCount: 64,
    location: 'Benin City, Edo',
    specialty: 'Lost-Wax Bronze Sculptures & Coral Regalia',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    isAvailable: true,
    startingPrice: 65000,
    deliverySpeed: '14 - 21 Days',
  },
  {
    id: 'v-04',
    name: 'Oshodi Heritage Stitches',
    category: 'WEARS',
    rating: 4.82,
    reviewCount: 39,
    location: 'Lekki Phase 1, Lagos',
    specialty: 'Contemporary African Dresses & Adire Sets',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    isAvailable: true,
    startingPrice: 28000,
    deliverySpeed: '7 - 10 Days',
  },
  {
    id: 'v-05',
    name: 'Eko Master Cobblers',
    category: 'SHOES',
    rating: 4.92,
    reviewCount: 76,
    location: 'Surulere, Lagos',
    specialty: 'Custom Leather Loafers & Beaded Slippers',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    isAvailable: true,
    startingPrice: 32000,
    deliverySpeed: '7 - 12 Days',
  },
];
