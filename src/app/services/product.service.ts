import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Interface untuk mendefinisikan struktur data Product
// Interface ini berfungsi sebagai kontrak yang menentukan bentuk objek Product
export interface Product {
  id: number; // ID unik produk
  barcode: string; // Kode barcode produk
  name: string; // Nama produk
  category: string; // Kategori produk
  price: number; // Harga produk
  stock: number; // Jumlah stok saat ini
  minStock: number; // Batas minimum stok (untuk alert)
  supplier: string; // Nama supplier/pemasok
  createdAt: Date; // Tanggal produk dibuat/ditambahkan
}

// Decorator @Injectable menandakan bahwa class ini dapat di-inject (dependency injection)
// providedIn: 'root' berarti service ini tersedia di seluruh aplikasi sebagai singleton
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  // Data produk dummy untuk simulasi database
  // Dalam aplikasi nyata, data biasanya berasal dari backend API
  private products: Product[] = [
    {
      id: 1,
      barcode: '8996001600647',
      name: 'Indomie Goreng',
      category: 'Makanan Instan',
      price: 2500,
      stock: 50,
      minStock: 10,
      supplier: 'PT Indofood',
      createdAt: new Date(),
    },
    {
      id: 2,
      barcode: '8998866603196',
      name: 'Aqua 600ml',
      category: 'Minuran',
      price: 3000,
      stock: 100,
      minStock: 20,
      supplier: 'PT Aqua',
      createdAt: new Date(),
    },
  ];

  // BehaviorSubject untuk mengelola state produk secara reactive
  // BehaviorSubject menyimpan nilai terakhir dan mengirimkannya ke subscriber baru
  private productsSubject = new BehaviorSubject<Product[]>(this.products);

  /**
   * Mengambil observable daftar produk
   * @returns Observable<Product[]> - Stream data produk yang dapat di-subscribe
   */
  getProducts() {
    // Mengembalikan observable sehingga component dapat subscribe ke perubahan data
    return this.productsSubject.asObservable();
  }

  /**
   * Menambahkan produk baru ke dalam sistem
   * @param product - Data produk tanpa id dan createdAt (akan digenerate otomatis)
   * @returns boolean - true jika berhasil, false jika barcode sudah ada
   */
  addProduct(product: Omit<Product, 'id' | 'createdAt'>): boolean {
    // Cek apakah barcode sudah ada
    const existingProduct = this.products.find((p) => p.barcode === product.barcode);
    if (existingProduct) {
      return false; // Barcode sudah terdaftar
    }

    // Membuat produk baru dengan id dan tanggal dibuat
    const newProduct: Product = {
      ...product, // Spread operator untuk menyalin semua properti
      id: this.generateId(), // Generate ID unik
      createdAt: new Date(), // Set tanggal pembuatan ke waktu sekarang
    };

    // Menambahkan ke array dan mempublikasikan perubahan
    this.products.push(newProduct); // Tambah ke array lokal
    this.productsSubject.next([...this.products]); // Emit nilai baru ke semua subscriber
    return true; // Return sukses
  }

  /**
   * Memperbarui data produk berdasarkan ID
   * @param id - ID produk yang akan diupdate
   * @param updatedProduct - Data produk yang akan diupdate (partial)
   * @returns boolean - true jika berhasil, false jika produk tidak ditemukan
   */
  updateProduct(id: number, updatedProduct: Partial<Product>): boolean {
    // Cari index produk berdasarkan ID
    const index = this.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      // Merge data lama dengan data baru menggunakan spread operator
      this.products[index] = { ...this.products[index], ...updatedProduct };
      // Emit perubahan ke semua subscriber
      this.productsSubject.next([...this.products]);
      return true; // Return sukses
    }
    return false; // Produk tidak ditemukan
  }

  /**
   * Menghapus produk berdasarkan ID
   * @param id - ID produk yang akan dihapus
   * @returns boolean - true jika berhasil, false jika produk tidak ditemukan
   */
  deleteProduct(id: number): boolean {
    // Cari index produk berdasarkan ID
    const index = this.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      // Hapus 1 elemen dari array mulai dari index yang ditemukan
      this.products.splice(index, 1);
      // Emit perubahan ke semua subscriber
      this.productsSubject.next([...this.products]);
      return true; // Return sukses
    }
    return false; // Produk tidak ditemukan
  }

  /**
   * Mencari produk berdasarkan barcode
   * @param barcode - Kode barcode produk
   * @returns Product | undefined - Produk jika ditemukan, undefined jika tidak
   */
  getProductByBarcode(barcode: string): Product | undefined {
    // Gunakan find untuk mencari produk dengan barcode yang cocok
    return this.products.find((p) => p.barcode === barcode);
  }

  /**
   * Mencari produk berdasarkan ID
   * @param id - ID produk
   * @returns Product | undefined - Produk jika ditemukan, undefined jika tidak
   */
  getProductById(id: number): Product | undefined {
    // Gunakan find untuk mencari produk dengan ID yang cocok
    return this.products.find((p) => p.id === id);
  }

  /**
   * Mendapatkan daftar produk dengan stok rendah (stok <= minStock)
   * @returns Product[] - Array produk dengan stok rendah
   */
  getLowStockProducts(): Product[] {
    // Filter produk yang stoknya kurang dari atau sama dengan minStock
    return this.products.filter((product) => product.stock <= product.minStock);
  }

  /**
   * Menghitung total jumlah produk yang terdaftar
   * @returns number - Jumlah total produk
   */
  getProductsCount(): number {
    // Kembalikan panjang array products
    return this.products.length;
  }

  /**
   * Menghitung total nilai inventory (harga * stok untuk semua produk)
   * @returns number - Total nilai inventory
   */
  getInventoryValue(): number {
    // Gunakan reduce untuk menghitung total nilai inventory
    return this.products.reduce((total, product) => total + product.price * product.stock, 0);
  }

  /**
   * Mendapatkan produk berdasarkan kategori
   * @param category - Kategori produk yang dicari
   * @returns Product[] - Array produk dalam kategori tertentu
   */
  getProductsByCategory(category: string): Product[] {
    // Filter produk berdasarkan kategori
    return this.products.filter((product) => product.category === category);
  }

  /**
   * Mengurangi stok produk (untuk penjualan/penggunaan)
   * @param productId - ID produk
   * @param quantity - Jumlah yang akan dikurangi
   * @returns boolean - true jika berhasil, false jika stok tidak cukup atau produk tidak ditemukan
   */
  updateProductStock(productId: number, quantity: number): boolean {
    // Cari produk berdasarkan ID
    const product = this.getProductById(productId);
    // Cek apakah produk ditemukan dan stok mencukupi
    if (product && product.stock >= quantity) {
      // Kurangi stok
      product.stock -= quantity;
      // Emit perubahan ke semua subscriber
      this.productsSubject.next([...this.products]);
      return true; // Return sukses
    }
    return false; // Stok tidak cukup atau produk tidak ditemukan
  }

  /**
   * Menambah stok produk (restock)
   * @param productId - ID produk
   * @param quantity - Jumlah yang akan ditambahkan
   * @returns boolean - true jika berhasil, false jika produk tidak ditemukan
   */
  restockProduct(productId: number, quantity: number): boolean {
    // Cari produk berdasarkan ID
    const product = this.getProductById(productId);
    if (product) {
      // Tambah stok
      product.stock += quantity;
      // Emit perubahan ke semua subscriber
      this.productsSubject.next([...this.products]);
      return true; // Return sukses
    }
    return false; // Produk tidak ditemukan
  }

  /**
   * Generate ID unik untuk produk baru
   * @returns number - ID baru (max ID existing + 1)
   */
  private generateId(): number {
    // Jika ada produk, cari ID tertinggi dan tambah 1, jika tidak mulai dari 1
    return this.products.length > 0 ? Math.max(...this.products.map((p) => p.id)) + 1 : 1;
  }
}
