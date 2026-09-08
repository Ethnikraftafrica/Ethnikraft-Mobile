import { Product } from '@/store/api/productApi';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'd63eaef9-a7eb-47f6-bc90-676f9d8bdde8',
    productCategory: 'WEARS',
    name: 'Unisex Aso oke Jorts (Loose-fit pants)',
    price: '54000',
    basePrice: '45000',
    stockQuantity: 0,
    condition: 'new',
    mainImage:
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1781276755/ethnikraft/products/dmfjyrvvk6iaiydrtmsx.jpg',
    imageList: [
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1781276755/ethnikraft/products/dmfjyrvvk6iaiydrtmsx.jpg',
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1781278649/ethnikraft/products/toqsouycscgnkjl0sbsc.jpg',
    ],
    isCustomizable: true,
    isRequestable: true,
    estimatedProductionDays: 3,
    description:
      'Crafted from high quality Aso oke fabric.\nElasticated waist with adjustable drawstring.\nDeep patch pocket designed with tassels.\nThe hem of the Jorts is frayed for added flair.\nJorts is unisex with relaxed, oversized 3/4 length silhouette.',
    details: {
      size: 'custom_free_size',
      sizeOptions: ['S', 'M', 'L', 'XL', 'Custom Free Size'],
      colorOptions: [
        'Black',
        'Blue',
        'Gold',
        'Gray',
        'Magenta',
        'Maroon',
        'Brown',
        'Cyan',
        'Green',
      ],
      materialList: ['Aso Oke', 'Cotton'],
      materialType: 'AFRICAN FABRICS',
    },
    vendor: {
      id: 'cmmxkztun002ooa52niipt7lr',
      businessName: 'Faustaze',
      rating: 4.9,
      businessLogo:
        'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773932466/ethnikraft/blpnbion0svvsozsskzi.jpg',
    },
    isTrending: true,
    isBestseller: true,
  },
  {
    id: 'cbe34120-83ef-4318-93bd-53b018598ef1',
    productCategory: 'WEARS',
    name: 'Ankara Relaxed Shirt',
    price: '32400',
    basePrice: '32400',
    stockQuantity: 12,
    condition: 'new',
    mainImage:
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773941000/ethnikraft/products/ankara-shirt-main.jpg',
    imageList: [
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773941000/ethnikraft/products/ankara-shirt-main.jpg',
    ],
    isCustomizable: false,
    isRequestable: false,
    description:
      'Premium 100% cotton Ankara shirt finished with folded cuff sleeves, structured point collar, and durable buttons. Relaxed breathable fit for warm weather comfort.',
    details: {
      sizeOptions: ['S', 'M', 'L', 'XL', 'XXL'],
      colorOptions: ['Navy / Gold Striped', 'Earth Brown', 'Indigo'],
      materialList: ['Ankara Cotton'],
      materialType: 'AFRICAN FABRICS',
    },
    vendor: {
      id: 'cmmxkztun002ooa52niipt7lr',
      businessName: 'Ethnikraft Heritage',
      rating: 4.8,
    },
    isNewArrival: true,
  },
  {
    id: 'f872da10-91cd-4019-a6f7-7b89c09d8112',
    productCategory: 'WEARS',
    name: 'Striped Aso Oke Palazzo Trousers',
    price: '48000',
    basePrice: '40000',
    stockQuantity: 8,
    condition: 'new',
    mainImage:
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773942000/ethnikraft/products/striped-aso-oke-pants.jpg',
    imageList: [
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773942000/ethnikraft/products/striped-aso-oke-pants.jpg',
    ],
    isCustomizable: true,
    isRequestable: true,
    estimatedProductionDays: 5,
    description:
      'Masterfully handwoven striped Aso Oke trousers with wide-leg cut and elasticated high-rise drawstring waist. Versatile luxury for casual and ceremonial wear.',
    details: {
      sizeOptions: ['Free Size', 'Custom Fit'],
      colorOptions: ['Navy / Crimson / Mustard', 'Black & White Monochrome'],
      materialList: ['Handwoven Aso Oke'],
      materialType: 'AFRICAN FABRICS',
    },
    vendor: {
      id: 'cmmxkztun002ooa52niipt7lr',
      businessName: 'Faustaze',
      rating: 4.9,
    },
    isHeritagemaster: true,
  },
  {
    id: 'a910bf23-88cd-41e9-91ef-0129cd8a7199',
    productCategory: 'BAGS',
    name: 'Handcrafted Beaded Leather Tote',
    price: '68000',
    basePrice: '60000',
    stockQuantity: 5,
    condition: 'new',
    mainImage:
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773943000/ethnikraft/products/beaded-tote.jpg',
    imageList: [
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773943000/ethnikraft/products/beaded-tote.jpg',
    ],
    isCustomizable: true,
    isRequestable: true,
    estimatedProductionDays: 7,
    description:
      'Structured genuine leather tote bag adorned with traditional Yoruba glass seed bead patterns on the front panel. Features reinforced brass hardware and zipped interior pockets.',
    details: {
      sizeOptions: ['Medium (14x11 in)', 'Large (18x14 in)'],
      colorOptions: ['Ebony Black', 'Tan Leather', 'Terracotta'],
      materialList: ['Full Grain Leather', 'Glass Seed Beads', 'Brass Hardware'],
      bagType: 'Tote Bag',
    },
    vendor: {
      id: 'cmmxkztun002ooa52niipt7lr',
      businessName: 'Oyo Artisan Guild',
      rating: 5.0,
    },
    isBestseller: true,
  },
  {
    id: 'b1239c81-77ad-4560-bf81-9988cc1100aa',
    productCategory: 'SHOES',
    name: 'Handmade Leather Kobo Slippers',
    price: '28500',
    basePrice: '25000',
    stockQuantity: 14,
    condition: 'new',
    mainImage:
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773944000/ethnikraft/products/leather-slippers.jpg',
    imageList: [
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773944000/ethnikraft/products/leather-slippers.jpg',
    ],
    isCustomizable: false,
    isRequestable: false,
    description:
      'Classic North African inspired cross-strap slide sandals hand-stitched from supple vegetable-tanned cowhide. Cushioned footbed with anti-slip rubber outsole.',
    details: {
      sizeOptions: ['40', '41', '42', '43', '44', '45'],
      colorOptions: ['Dark Mahogany', 'Natural Tan', 'Black'],
      materialList: ['Vegetable Tanned Leather', 'Rubber Outsole'],
      shoeType: 'Slippers',
    },
    vendor: {
      id: 'cmmxkztun002ooa52niipt7lr',
      businessName: 'Kano Leatherworks',
      rating: 4.7,
    },
    isOnDeals: true,
  },
  {
    id: 'd9980124-66ef-4981-b512-8811ee3344bb',
    productCategory: 'CRAFTS',
    name: 'Benin Bronze Casting Figurine',
    price: '115000',
    basePrice: '110000',
    stockQuantity: 2,
    condition: 'new',
    mainImage:
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773945000/ethnikraft/products/benin-bronze.jpg',
    imageList: [
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773945000/ethnikraft/products/benin-bronze.jpg',
    ],
    isCustomizable: false,
    isRequestable: true,
    estimatedProductionDays: 14,
    description:
      'Authentic lost-wax bronze casting celebrating the historic Royal Court of Benin. Cast by master guild artisans in Igun Street, Benin City.',
    details: {
      sizeOptions: ['Standard (12 inches)'],
      colorOptions: ['Antique Patina Bronze'],
      materialList: ['Solid Cast Bronze'],
      craftType: 'Metalwork / Lost-Wax Casting',
    },
    vendor: {
      id: 'cmmxkztun002ooa52niipt7lr',
      businessName: 'Igun Guild Masters',
      rating: 5.0,
    },
    isHeritagemaster: true,
  },
  {
    id: 'e4561230-11ff-4890-a332-7766dd9988cc',
    productCategory: 'ACCESSORIES',
    name: 'Royal Coral Bead Collar (Iyun)',
    price: '95000',
    basePrice: '85000',
    stockQuantity: 4,
    condition: 'new',
    mainImage:
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773946000/ethnikraft/products/coral-collar.jpg',
    imageList: [
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773946000/ethnikraft/products/coral-collar.jpg',
    ],
    isCustomizable: true,
    isRequestable: true,
    estimatedProductionDays: 7,
    description:
      'Multi-strand natural barrel coral necklace reserved for royal chieftains and grand matrimonial ceremonies. Hand-threaded with 18K gold-plated accents.',
    details: {
      sizeOptions: ['Standard Length (18 in)', 'Chieftain Length (22 in)'],
      colorOptions: ['Natural Deep Crimson'],
      materialList: ['Natural Branch Coral', 'Gold-plated spacer beads'],
      accessoryType: 'Necklace',
    },
    vendor: {
      id: 'cmmxkztun002ooa52niipt7lr',
      businessName: 'Royal Adornments Guild',
      rating: 4.9,
    },
    isWomenInCraft: true,
  },
  {
    id: 'f7893214-55dd-4771-bc29-4433aa7766dd',
    productCategory: 'PAINTINGS',
    name: 'Dusk over Oshogbo Sacred Grove',
    price: '180000',
    basePrice: '165000',
    stockQuantity: 1,
    condition: 'new',
    mainImage:
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773947000/ethnikraft/products/sacred-grove-painting.jpg',
    imageList: [
      'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1773947000/ethnikraft/products/sacred-grove-painting.jpg',
    ],
    isCustomizable: false,
    isRequestable: true,
    estimatedProductionDays: 21,
    description:
      'Original acrylic on stretched canvas depicting ancestral spirits and folklore creatures under the canopy of Osun Oshogbo grove. Signed and certified.',
    details: {
      sizeOptions: ['36 x 48 inches (Stretched Canvas)'],
      colorOptions: ['Original Vibrant Palette'],
      materialList: ['Acrylic on Belgian Linen', 'Teak Wood Floating Frame'],
      artworkType: 'Original Canvas Painting',
    },
    vendor: {
      id: 'cmmxkztun002ooa52niipt7lr',
      businessName: 'New Sacred Art Movement',
      rating: 5.0,
    },
    isMixedMediaInnovator: true,
  },
];
