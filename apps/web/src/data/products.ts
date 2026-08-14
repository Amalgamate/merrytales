export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  startingPrice: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  bestseller?: boolean;
  customizable?: boolean;
  digital?: boolean;
}

export const products: Product[] = [
  {
    id: 'p1',
    slug: 'maji-labels-dusty-rose',
    name: 'Maji Labels - Dusty Rose',
    category: 'Wedding Details',
    subcategory: 'Water Bottle Labels',
    startingPrice: 2500,
    rating: 4.9,
    reviews: 112,
    image: '/printable_water_labels.png',
    images: [
      '/printable_water_labels.png',
      '/printable_water_labels_kenya.png',
      '/hero_vibrant.png',
      '/african_planning_hero.png'
    ],
    bestseller: true,
    customizable: true,
    digital: false
  },
  {
    id: 'p2',
    slug: 'invitation-suite-sage',
    name: 'Luxury Suite - Sage & Gold',
    category: 'Wedding Print',
    subcategory: 'Wedding Invitations',
    startingPrice: 15000,
    rating: 5.0,
    reviews: 84,
    image: '/printable_invitation_cards.png',
    images: [
      '/printable_invitation_cards.png',
      '/style_story_tale.png',
      '/african_stories_hero.png',
      '/style_memory_tale.png'
    ],
    bestseller: true,
    customizable: true,
    digital: false
  },
  {
    id: 'p3',
    slug: 'acrylic-welcome-sign',
    name: 'Gold Acrylic Welcome Sign',
    category: 'Wedding Print',
    subcategory: 'Welcome Signs',
    startingPrice: 8500,
    rating: 4.8,
    reviews: 56,
    image: '/printable_welcome_sign.png',
    images: [
      '/printable_welcome_sign.png',
      '/hero_vibrant.png',
      '/african_vendor_hero.png',
      '/african_garden_wedding.png'
    ],
    bestseller: false,
    customizable: true,
    digital: false
  },
  {
    id: 'p4',
    slug: 'table-numbers-blush',
    name: 'Tent-Fold Table Numbers',
    category: 'Wedding Print',
    subcategory: 'Table Numbers',
    startingPrice: 3500,
    rating: 4.7,
    reviews: 42,
    image: '/printable_table_cards.png',
    images: [
      '/printable_table_cards.png',
      '/printable_welcome_sign.png',
      '/african_planning_hero.png',
      '/printable_invitation_cards.png'
    ],
    bestseller: false,
    customizable: true,
    digital: false
  },
  {
    id: 'p5',
    slug: 'animated-story-tale',
    name: 'Story Tale Animation',
    category: 'Digital Invitations',
    subcategory: 'Animated Invitations',
    startingPrice: 5000,
    rating: 5.0,
    reviews: 205,
    image: '/style_story_tale.png',
    images: [
      '/style_story_tale.png',
      '/african_stories_hero.png',
      '/african_ruracio_story.png',
      '/style_memory_tale.png'
    ],
    bestseller: true,
    customizable: true,
    digital: true
  },
  {
    id: 'p6',
    slug: 'memory-tale-website',
    name: 'Memory Tale Event Website',
    category: 'Digital Invitations',
    subcategory: 'Wedding Websites',
    startingPrice: 7500,
    rating: 4.9,
    reviews: 140,
    image: '/style_memory_tale.png',
    images: [
      '/style_memory_tale.png',
      '/african_garden_wedding.png',
      '/african_stories_hero.png',
      '/style_story_tale.png'
    ],
    bestseller: true,
    customizable: true,
    digital: true
  },
  {
    id: 'p7',
    slug: 'event-branding-kit',
    name: 'Complete Event Branding Kit',
    category: 'Event Branding',
    subcategory: 'Wedding Logos',
    startingPrice: 12000,
    rating: 4.8,
    reviews: 65,
    image: '/event_branding_mockup.png',
    images: [
      '/event_branding_mockup.png',
      '/printable_water_labels_kenya.png',
      '/printable_invitation_cards.png',
      '/printable_welcome_sign.png'
    ],
    bestseller: false,
    customizable: true,
    digital: true
  },
  { id:'p8',slug:'corporate-welcome-kit',name:'Personalised Corporate Welcome Kit',category:'Corporate Gifts',subcategory:'Employee Welcome Kits',startingPrice:4500,rating:4.9,reviews:18,image:'/event_branding_mockup.png',images:['/event_branding_mockup.png','/printable_invitation_cards.png'],bestseller:true,customizable:true,digital:false },
  { id:'p9',slug:'executive-gift-hamper',name:'Executive Appreciation Hamper',category:'Gifts & Hampers',subcategory:'Corporate Hampers',startingPrice:9500,rating:4.8,reviews:22,image:'/hero_vibrant.png',images:['/hero_vibrant.png','/african_stories_hero.png'],customizable:true,digital:false },
  { id:'p10',slug:'newborn-celebration-hamper',name:'Newborn Celebration Hamper',category:'Baby & Kids',subcategory:'New Baby Gifts',startingPrice:6500,rating:4.9,reviews:15,image:'/african_garden_wedding.png',images:['/african_garden_wedding.png','/hero_vibrant.png'],customizable:true,digital:false },
  { id:'p11',slug:'personalised-travel-tumbler',name:'Personalised Insulated Travel Tumbler',category:'Corporate Gifts',subcategory:'Drinkware',startingPrice:1800,rating:4.7,reviews:31,image:'/printable_water_labels_kenya.png',images:['/printable_water_labels_kenya.png','/event_branding_mockup.png'],customizable:true,digital:false },
  { id:'p12',slug:'celebration-flower-bouquet',name:'Celebration Flower Bouquet',category:'Flowers & Decor',subcategory:'Fresh Flowers',startingPrice:3500,rating:4.9,reviews:44,image:'/african_vendor_photography.png',images:['/african_vendor_photography.png','/african_garden_wedding.png'],bestseller:true,customizable:true,digital:false },
  { id:'p13',slug:'personalised-award-trophy',name:'Personalised Corporate Award Trophy',category:'Printing & Branding',subcategory:'Awards & Trophies',startingPrice:3200,rating:4.8,reviews:12,image:'/printable_welcome_sign.png',images:['/printable_welcome_sign.png','/event_branding_mockup.png'],customizable:true,digital:false },
  { id:'p14',slug:'branded-event-hoodie',name:'Branded Event Hoodie',category:'Fashion & Merchandise',subcategory:'Screen Print & Embroidery',startingPrice:2800,rating:4.7,reviews:27,image:'/style_memory_tale.png',images:['/style_memory_tale.png','/event_branding_mockup.png'],customizable:true,digital:false },
  { id:'p15',slug:'personalised-jewellery-gift',name:'Personalised Jewellery Gift Set',category:'Jewellery & Accessories',subcategory:'Custom Jewellery',startingPrice:5500,rating:4.9,reviews:19,image:'/style_story_tale.png',images:['/style_story_tale.png','/hero_vibrant.png'],customizable:true,digital:false }
];
