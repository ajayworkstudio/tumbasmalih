export type ProductType = "ebook" | "fisik";

export type Category = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  sort: number;
};

/** Kolom produk yang boleh dilihat publik (tanpa harga modal / link sumber). */
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: ProductType;
  category_id: string | null;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  stock: number | null;
  is_featured: boolean;
};

/** Produk lengkap untuk admin. */
export type AdminProduct = Product & {
  is_active: boolean;
  file_path: string | null;
  source_url: string | null;
  source_price: number | null;
  created_at: string;
};

export type PaymentMethod = "qris" | "transfer" | "cod";

export type OrderStatus =
  | "menunggu_pembayaran"
  | "menunggu_konfirmasi"
  | "dibayar"
  | "diproses"
  | "dikirim"
  | "selesai"
  | "dibatalkan";

export type Order = {
  id: string;
  code: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  note: string | null;
  payment_method: PaymentMethod;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  tracking_number: string | null;
  created_at: string;
  paid_at: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  type: ProductType;
  price: number;
  qty: number;
  line_total: number;
};

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  type: ProductType;
  image_url: string | null;
  qty: number;
};
