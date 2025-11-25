export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  barcode?: string;
}

export interface Category {
  id: string;
  name: string;
}
