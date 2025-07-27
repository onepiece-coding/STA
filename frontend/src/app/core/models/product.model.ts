export interface IProduct {
  categoryId: {
    _id: string;
    name: string;
  };
  name: string;
  pictureUrl: {
    url: string;
    publicId: string;
  };
  unitPrice: number;
  discountRule: {
    minQty: number;
    percent: number;
  };
  globalDiscountPercent: number | null;
  currentStock: number;
  nextExpiryDate: Date | null;
  _id: string;
}
