export interface ServiceItem {
  name: string;
  bookingName: string;
  price: number;
  image: string;
  description: string;
}

export interface ServiceCategory {
  name: string;
  slug: string;
  image: string;
  videoUrl?: string;
  galleryImages?: string[];
  items: ServiceItem[];
  reviews?: string[];
}

export const services: ServiceCategory[] = [
  {
    name: "Hair Care",
    slug: "hair-services",
    image: "/images/haircolor.png",
    galleryImages: [
      "/images/real_work_3.jpg",
      "/images/media_1788081446051.jpg",
      "/images/media_1788081458390.jpg",
      "/images/media_1788081468114.jpg"
    ],
    items: [
      {
        name: "Haircut & Styling",
        bookingName: "Haircut",
        price: 80,
        image: "/images/hairstyling.png",
        description:
          "Professional cuts, trims, and blow-dries tailored specifically to your facial structure and styling preferences. (Price varies according to hair length)",
      },

      {
        name: "Premium Hair Coloring",
        bookingName: "Coloring",
        price: 300,
        image: "/images/hair coloring.png",
        description:
          "Vibrant global coloring, custom highlights, or hand-painted balayage using nourishing, ammonia-free formulas. (Price varies according to hair length)",
      },

      {
        name: "Keratin Protein Treatment",
        bookingName: "Protein",
        price: 299,
        image: "/images/haircolor.png",
        description:
          "Rebuild and smooth frizzy hair with our luxury keratin proteins, giving you sleek, high-shine hair for months. (Price varies according to hair length)",
      },

      {
        name: "Glamour Blow Dry",
        bookingName: "Haircut",
        price: 100,
        image: "/images/haircut.png",
        description:
          "Volume-boosting wash and blow dry styling service for red-carpet-ready locks and bounces. (Price varies according to hair length)",
      },
    ],
    reviews: []
  },

  {
    name: "Nails & Spa",
    slug: "nail-services",
    image: "/images/nails_hero_generated.png",
    galleryImages: [
      "/images/real_work_1.jpg",
      "/images/real_work_2.jpg",
      "/images/real_work_4.jpg",
      "/images/real_work_5.jpg",
      "/images/real_work_6.jpg"
    ],
    items: [
      {
        name: "Luxury Manicure",
        bookingName: "Manicure",
        price: 70,
        image: "/images/manicure_generated.png",
        description:
          "Soothing cuticle care, nail shaping, light hand massage, and professional lacquer application.",
      },

      {
        name: "Premium Spa Pedicure",
        bookingName: "Pedicure",
        price: 60,
        image: "/images/pedicure_generated.png",
        description:
          "Relaxing feet soak, sea-salt scrub, massage, and professional polishing for soft, elegant feet.",
      },

      {
        name: "Creative Nail Art",
        bookingName: "Gel Polish",
        price: 50,
        image: "/images/floral_nails.png",
        description:
          "Express your unique style with custom nail art, chrome finishes, encapsulation, or hand-painted details.",
      },
      {
        name: "Gel Polish",
        bookingName: "Gel Polish",
        price: 40,
        image: "/images/gel_polish_blue.jpg",
        description:
          "High-gloss, long-lasting gel polish application that resists chipping for weeks.",
      },
      {
        name: "Gel Polish Removal",
        bookingName: "Gel Polish Removal",
        price: 20,
        image: "/images/gel_polish_removal.jpg",
        description:
          "Safe and professional removal of gel polish to preserve the health of your natural nails.",
      },
    ]
  },

  {
    name: "Facial ",
    slug: "facial-services",
    image: "/images/herofacial.png",
    videoUrl: "/videos/hydra facial.mp4",
    reviews: [
      "/images/reviews/media_1788006883950.png",
      "/images/reviews/media_1788006903087.png"
    ],

    items: [

      {
        name: "Kanpeki Korean Facial",
        bookingName: "Kanpeki Korean Facial",
        price: 399,
        image: "/images/korean-facial-service.jpg",
        description:
          "Advanced Korean facial treatment using natural ingredients and innovative techniques for deep cleansing and rejuvenation.",
      },



      {
        name: "Premium Hydra Facial",
        bookingName: "Premium Hydra Facial",
        price: 249,
        image: "/images/hydrafacial-service.jpg",
        description:
          "Advanced multi-step skin therapy using hydration serums and vacuum extractions to reveal plump, radiant skin.",
      },

      {
        name: "Anti-Ageing Facial",
        bookingName: "Anti-ageing Hydra Facial",
        price: 150,
        image: "/images/image facial2.jpg",
        description:
          "Deep collagen massage, red-light stimulation, and firming masks that reduce appearance of fine lines.",
      },

      {
        name: "Nourishing Essential Facial",
        bookingName: "Any Facial",
        price: 99,
        image: "/images/essential-facial-service.jpg",
        description:
          "Gentle cleanse, botanical scrub, relaxing steam, and face mask designed for daily skin rejuvenation.",
      },
    ],
  },

  {
    name: "Massage ",
    slug: "massage-services",
    image: "/images/massagecard.png",

    items: [
      {
        name: "Deep Tissue Massage",
        bookingName: "Deep Tissue Massage",
        price: 120,
        image: "/images/deep-tissue-massage-service.jpg",
        description:
          "Slow, firm strokes targeting deep layers of muscle tissue to relieve persistent tension and muscle stiffness.",
      },

      {
        name: "Traditional Thai Massage",
        bookingName: "Thai Massage",
        price: 100,
        image: "/images/thai-massage-service.jpg",
        description:
          "Dynamic full-body yoga stretching and pressure-point therapy to renew energy flow and flexibility.",
      },

      {
        name: "Hot Oil Massage",
        bookingName: "Hot Oil Massage",
        price: 100,
        image: "/images/massageimage3.jpg",
        description:
          "A soothing massage using warm aromatic oils to relax muscles, improve circulation, and deeply nourish the skin.",
      },
      {
        name: "Full Body Relaxing Massage",
        bookingName: "Full Body Relaxing Massage",
        price: 150,
        image: "/images/imagemassage.jpg",
        description:
          "A gentle, calming massage designed to relieve everyday stress and leave your entire body feeling completely rejuvenated.",
      },
    ],
    reviews: []
  },

  {
    name: "Eye Lashes",
    slug: "lashes-services",
    image: "/images/eyelashes.png",
    galleryImages: [
      "/images/media_1788081744365.jpg",
      "/images/media_1788081753697.jpg",
      "/images/media_1788081761154.jpg",
      "/images/media_1788081769059.jpg"
    ],

    items: [
      {
        name: "Classic Eyelash Extensions",
        bookingName: "Classic Eyelash Extensions",
        price: 200,
        image: "/images/classic-eyelashes-service.jpg",
        description:
          "Individual lash extensions applied meticulously for a beautiful, naturally enhanced mascara effect.",
      },



      {
        name: "Volume Lash Extensions",
        bookingName: "Volume Lash Extensions",
        price: 240,
        image: "/images/volume-lashes-service.jpg",
        description:
          "Handcrafted ultra-fine lash fans applied to each lash for a full, dramatic, red-carpet glam look.",
      },
    ],
  },

  {
    name: "Spa",
    slug: "spa-services",
    image: "/images/hairspa.png",
    videoUrl: "/videos/hairspa.mp4",
    reviews: [
      "/images/reviews/media_1788081061015.png",
      "/images/reviews/media_1788081097568.png",
      "/images/reviews/media_1788081112763.png",
      "/images/reviews/media_1788081129570.png",
      "/images/reviews/media_1788081163685.png"
    ],

    items: [


      {
        name: "Hair Spa",
        bookingName: "Hair Spa",
        price: 300,
        image: "/images/hair-spa-service.jpg",
        description:
          "Relaxing floral oil spa bath coupled with a warm herbal back compress for complete sensory escape.",
      },

      {
        name: "Relaxing Foot Reflexology",
        bookingName: "Relaxing Foot Reflexology",
        price: 90,
        image: "/images/foot-reflexology-service.jpg",
        description:
          "Targeted reflex point foot massage that relieves pressure, restores balance, and enhances whole-body wellness.",
      },
    ],
  },
  {
    name: "Moroccan Bath",
    slug: "moroccan-bath",
    image: "/images/moroccan-bath-service.jpg",
    reviews: [],
    items: [
      {
        name: "Moroccan Bath",
        bookingName: "Moroccan Bath",
        price: 250,
        image: "/images/moroccan-bath-service.jpg",
        description:
          "Traditional cleansing ritual with Moroccan black soap and active steam to purify and soften your skin.",
      },
    ],
  },
  {
    name: "Waxing",
    slug: "waxing-services",
    image: "/images/waxing_service.png",
    items: [
      { name: "Full Body Waxing", bookingName: "Full Body Waxing", price: 350, image: "/images/waxing_service.png", description: "Complete hair removal for a smooth and flawless finish." },
      { name: "Half Leg Waxing", bookingName: "Half Leg Waxing", price: 80, image: "/images/half-leg-waxing-service.jpg", description: "Smooth and silky lower legs." },
      { name: "Half Arms Waxing", bookingName: "Half Arms Waxing", price: 60, image: "/images/waxing_service.png", description: "Effective hair removal for half arms." },
      { name: "Bikini Wax", bookingName: "Bikini Wax", price: 90, image: "/images/waxing_service.png", description: "Gentle and precise bikini line waxing." },
      { name: "Full Face Wax", bookingName: "Full Face Wax", price: 100, image: "/images/waxing_service.png", description: "Remove unwanted facial hair for a bright complexion." },
      { name: "Eyebrows Wax", bookingName: "Eyebrows Wax", price: 40, image: "/images/waxing_service.png", description: "Perfectly shaped eyebrows." },
      { name: "Forehead Wax", bookingName: "Forehead Wax", price: 35, image: "/images/waxing_service.png", description: "Clean up your forehead hairline." },
      { name: "Chin Wax", bookingName: "Chin Wax", price: 30, image: "/images/waxing_service.png", description: "Quick and easy chin hair removal." },
      { name: "Belly Wax", bookingName: "Belly Wax", price: 70, image: "/images/waxing_service.png", description: "Smooth stomach waxing." },
      { name: "Back Wax", bookingName: "Back Wax", price: 120, image: "/images/waxing_service.png", description: "Complete back hair removal." },
      { name: "Chest Wax", bookingName: "Chest Wax", price: 100, image: "/images/waxing_service.png", description: "Smooth and clean chest." },
    ]
  }
];