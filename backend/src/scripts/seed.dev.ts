import bcrypt from "bcryptjs";
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Cart } from "../models/cart.model";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { User } from "../models/user.model";
import { Logger } from "../utils/logger";

const MONGODB_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/SnapCart_TS";
const SEED_PASSWORD = "Demo-SnapCart-Admin@321";

interface ProductInput {
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  images: string[];
  description: string;
}

const products: ProductInput[] = [
  {
    name: "Aurora Wireless Headphones",
    category: "electronics",
    price: 249.0,
    discountPrice: 199.0,
    stock: 40,
    images: [
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543129/aurora-headphones_clekm1.jpg",
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543129/aurora-headphones_clekm1.jpg",
    ],
    description: "Immersive over-ear sound with active noise cancellation.",
  },
  {
    name: "Pulse Smartwatch",
    category: "electronics",
    price: 199.0,
    stock: 35,
    images: [
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543163/pulse-watch_aqtp9o.jpg",
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543163/pulse-watch_aqtp9o.jpg",
    ],
    description: "Track fitness, notifications and more.",
  },
  {
    name: "Bass Bluetooth Speaker",
    category: "electronics",
    price: 89.0,
    discountPrice: 69.0,
    stock: 60,
    images: [
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543146/bass-speaker_h3ghwl.jpg",
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543146/bass-speaker_h3ghwl.jpg",
    ],
    description: "Room-filling sound in a compact body.",
  },
  {
    name: "Nova Camera Drone",
    category: "gaming",
    price: 549.0,
    stock: 15,
    images: [
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543161/nova-drone_nvl7n9.jpg",
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543161/nova-drone_nvl7n9.jpg",
    ],
    description: "4K aerial footage with smart tracking.",
  },
  {
    name: "Apex Pro Controller",
    category: "gaming",
    price: 69.0,
    stock: 80,
    images: [
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543115/apex-controller_iaofxs.jpg",
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543115/apex-controller_iaofxs.jpg",
    ],
    description: "Precision controls for serious gamers.",
  },
  {
    name: "Stride Running Sneakers",
    category: "fashion",
    price: 119.0,
    stock: 50,
    images: [
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543166/stride-sneakers_i3hpoi.jpg",
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543166/stride-sneakers_i3hpoi.jpg",
    ],
    description: "Lightweight cushioning for everyday runs.",
  },
  {
    name: "Metro Everyday Backpack",
    category: "fashion",
    price: 79.0,
    stock: 45,
    images: [
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543160/metro-backpack_mmcovy.jpg",
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543160/metro-backpack_mmcovy.jpg",
    ],
    description: "Durable, water-resistant and laptop-ready.",
  },
  {
    name: "Shade Polarized Sunglasses",
    category: "fashion",
    price: 59.0,
    stock: 70,
    images: [
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543167/shade-sunglasses_e9m2ll.jpg",
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543167/shade-sunglasses_e9m2ll.jpg",
    ],
    description: "UV400 protection with a timeless look.",
  },
  {
    name: "Lumen Smart Lamp",
    category: "home",
    price: 49.0,
    stock: 65,
    images: [
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543158/lumen-lamp_h5w07i.jpg",
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543158/lumen-lamp_h5w07i.jpg",
    ],
    description: "Adjustable warmth and app control.",
  },
  {
    name: "Terra Ceramic Planter",
    category: "home",
    price: 29.0,
    stock: 90,
    images: [
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543169/terra-planter_zm1c1a.jpg",
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543169/terra-planter_zm1c1a.jpg",
    ],
    description: "Minimalist planter for any space.",
  },
  {
    name: "Glow Skincare Set",
    category: "beauty",
    price: 64.0,
    stock: 55,
    images: [
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543151/glow-skincare_d52efg.jpg",
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543151/glow-skincare_d52efg.jpg",
    ],
    description: "A complete routine for radiant skin.",
  },
  {
    name: "Bloom Eau de Parfum",
    category: "beauty",
    price: 89.0,
    stock: 40,
    images: [
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543148/bloom-perfume_f1g1fc.jpg",
      "https://res.cloudinary.com/snapcart-env-cloudinary/image/upload/v1783543148/bloom-perfume_f1g1fc.jpg",
    ],
    description: "A fresh floral signature scent.",
  },
];

async function seedDatabase() {
  if (process.env.NODE_ENV === "production") {
    Logger.error("❌ SAFETY ALERT: Cannot run seed script in production!");
    process.exit(1);
  }

  // if (process.env.MONGO_URI?.includes("mongodb+srv")) {
  //   Logger.error(
  //     "❌ SAFETY ALERT: MONGO_URI points to a cloud database. Refusing to seed.",
  //   );
  //   process.exit(1);
  // }

  try {
    Logger.info("🔄 Connecting to MongoDB...");
    await connectDB(MONGODB_URI);

    Logger.info("🧹 Clearing existing demo data...");
    // Only delete demo accounts — never touch users with role "admin"
    await Promise.all([
      User.deleteMany({ role: { $in: ["demo_admin", "seller", "customer"] } }),
      Product.deleteMany({}),
      Cart.deleteMany({}),
      Order.deleteMany({}),
    ]);

    Logger.info("👤 Creating demo accounts...");

    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 12);

    const demoAdmin = new User({
      name: "Demo Admin",
      email: "demo_admin@snapcart.dev",
      role: "demo_admin",
      isEmailVerified: true,
      password: hashedPassword,
    });
    await demoAdmin.save();

    const seller = new User({
      name: "Demo Seller",
      email: "demo_seller@snapcart.dev",
      role: "seller",
      sellerStatus: "approved",
      isEmailVerified: true,
      sellerApplication: {
        storeName: "Demo Electronics Shop",
        contactEmail: "demo_seller@snapcart.dev",
        contactPhone: "9237486789",
        taxId: "TAX-99887766",
        businessAddress: "123 Innovation Drive, Tech City",
        storeDescription:
          "This is a demo store populated by the seed script to demonstrate full functionality.",
        appliedAt: new Date(),
      },
      password: hashedPassword,
    });
    await seller.save();

    const shopper = new User({
      name: "Demo Shopper",
      email: "demo_customer@snapcart.dev",
      role: "customer",
      isEmailVerified: true,
      password: hashedPassword,
    });
    await shopper.save();

    Logger.info("📦 Inserting products...");
    await Product.insertMany(
      products.map((p) => ({ ...p, seller: seller._id })),
    );

    Logger.info("\n✅ Seed complete!");
    Logger.info(`- Demo Admin: ${demoAdmin.email}`);
    Logger.info(`- Seller: ${seller.email} (Status: ${seller.sellerStatus})`);
    Logger.info(`- Customer: ${shopper.email}`);
    Logger.info(`- Password: ${SEED_PASSWORD}`);
  } catch (error) {
    if (error instanceof Error) {
      Logger.error("❌ Seeding failed:", {
        message: error.message,
        stack: error.stack,
      });
    } else {
      Logger.error("❌ Seeding failed:", error);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDatabase();
