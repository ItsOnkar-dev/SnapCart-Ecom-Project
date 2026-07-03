export type ProductStatus = "active" | "inactive" | "deleted";

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: ProductImage[];
  seller: {
    _id: string;
    name: string;
  };
  averageRating: number;
  reviewCount: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

// paginated list response shape — backend sends this for /products
export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

// what CreateProductPage / EditProductPage submits
export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: ProductImage[];
}
