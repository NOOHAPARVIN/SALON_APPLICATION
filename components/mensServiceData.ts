export interface ServiceItem {
  name: string;
  bookingName: string;
  price: number;
  image: string;
  description: string;
  duration_minutes?: number;
}

export interface ServiceCategory {
  name: string;
  slug: string;
  image: string;
  items: ServiceItem[];
}

export const mensServices: ServiceCategory[] = [
  {
    name: "Hair Care",
    slug: "mens-hair",
    image: "/images/hairhero.png",
    items: [
      {
        name: "Any haircut",
        bookingName: "Any haircut",
        price: 25,
        image: "/images/imagehaircut.jpg",
        description: "Professional haircut tailored to your head shape and styling preferences.",
        duration_minutes: 30,
      },
      {
        name: "Beard setting",
        bookingName: "Beard setting",
        price: 25,
        image: "/images/imagehaircut.jpg",
        description: "Precision beard shaping, trimming, and conditioning with premium oils.",
        duration_minutes: 30,
      },
      {
        name: "Kids haircut",
        bookingName: "Kids haircut",
        price: 20,
        image: "/images/imagehaircut.jpg",
        description: "Specialized haircut designed for kids.",
        duration_minutes: 30,
      },
    ],
  },
  {
    name: "Combo",
    slug: "mens-combo",
    image: "/images/hairhero.png",
    items: [
      {
        name: "Anyhaircut + beard setting + facescrub + facemask",
        bookingName: "Anyhaircut + beard setting + facescrub + facemask",
        price: 50,
        image: "/images/imagehaircut.jpg",
        description: "Complete grooming package including haircut, beard setting, face scrub, and face mask.",
        duration_minutes: 60,
      },
    ],
  },
  {
    name: "Massages",
    slug: "mens-massages",
    image: "/images/spa2hero.avif",
    items: [
      {
        name: "Deep tissue massage",
        bookingName: "Deep tissue massage",
        price: 120,
        image: "/images/imagemassage.jpg",
        description: "Firm pressure massage targeting deep muscle tension for 60 minutes.",
        duration_minutes: 60,
      },
      {
        name: "Relaxing massage",
        bookingName: "Relaxing massage",
        price: 90,
        image: "/images/imagemassage.jpg",
        description: "Soothing full-body relaxation massage for 60 minutes.",
        duration_minutes: 60,
      },
      {
        name: "Thai massage",
        bookingName: "Thai massage",
        price: 100,
        image: "/images/imagemassage.jpg",
        description: "Traditional Thai stretch and pressure massage for 60 minutes.",
        duration_minutes: 60,
      },
      {
        name: "Signature massage",
        bookingName: "Signature massage",
        price: 150,
        image: "/images/imagemassage.jpg",
        description: "Exclusive signature massage combining specialized techniques for 60 minutes.",
        duration_minutes: 60,
      },
      {
        name: "Foot massage",
        bookingName: "Foot massage",
        price: 60,
        image: "/images/imagemassage.jpg",
        description: "Revitalizing foot reflexology massage for 60 minutes.",
        duration_minutes: 60,
      },
    ],
  },
];

export { mensServices as services };
