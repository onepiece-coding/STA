export type TAlert = {
  productId: string;
  name: string;
  nextExpiry: Date;
  remainingQty: number;
  photo: {
    url: string;
  };
};
