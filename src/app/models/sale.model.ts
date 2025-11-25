export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id: string;
  date: Date;
  items: SaleItem[];
  total: number;
  cashReceived: number;
  change: number;
}
