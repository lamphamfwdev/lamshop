// FILE TỰ ĐỘNG TẠO TỪ data/products.xlsx — KHÔNG SỬA TRỰC TIẾP.
import type { Product } from "../models/product.js";

export const PRODUCTS: Product[] = [
  {
    "id": "SP001",
    "name": "Tai nghe AirBeat Mini",
    "description": "Tai nghe Bluetooth gọn nhẹ, hộp sạc USB-C và micro đàm thoại rõ.",
    "category": "Tai nghe",
    "price": 289000,
    "originalPrice": 359000,
    "image": "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=85",
    "tags": [
      "Bluetooth 5.3",
      "USB-C"
    ],
    "featured": true
  },
  {
    "id": "SP002",
    "name": "Tai nghe WavePods Pro",
    "description": "Âm thanh cân bằng, khử ồn thụ động và thời lượng pin đến 24 giờ.",
    "category": "Tai nghe",
    "price": 449000,
    "originalPrice": 529000,
    "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=85",
    "tags": [
      "Pin 24 giờ",
      "Chống ồn"
    ],
    "featured": true
  },
  {
    "id": "SP003",
    "name": "Loa Bluetooth Tide S",
    "description": "Loa di động nhỏ gọn, âm trầm chắc và chống nước nhẹ cho chuyến đi.",
    "category": "Loa",
    "price": 379000,
    "originalPrice": 459000,
    "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85",
    "tags": [
      "10W",
      "IPX5"
    ],
    "featured": false
  },
  {
    "id": "SP004",
    "name": "Đồng hồ Active One",
    "description": "Theo dõi vận động, thông báo cuộc gọi và màn hình sáng rõ ngoài trời.",
    "category": "Đồng hồ",
    "price": 699000,
    "originalPrice": 849000,
    "image": "https://images.unsplash.com/photo-1624096104992-9b4fa3a279dd?auto=format&fit=crop&w=900&q=85",
    "tags": [
      "Theo dõi sức khỏe",
      "Chống nước"
    ],
    "featured": true
  },
  {
    "id": "SP005",
    "name": "Cáp sạc Flex USB-C",
    "description": "Cáp bọc dù bền chắc, sạc nhanh 60W và hỗ trợ truyền dữ liệu.",
    "category": "Phụ kiện",
    "price": 99000,
    "image": "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=85",
    "tags": [
      "60W",
      "Dài 1.5m"
    ],
    "featured": false
  },
  {
    "id": "SP006",
    "name": "Sạc nhanh Pocket 30W",
    "description": "Củ sạc nhỏ gọn, một cổng USB-C và bảo vệ quá nhiệt nhiều lớp.",
    "category": "Phụ kiện",
    "price": 239000,
    "originalPrice": 289000,
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=85",
    "tags": [
      "PD 30W",
      "USB-C"
    ],
    "featured": false
  }
];
