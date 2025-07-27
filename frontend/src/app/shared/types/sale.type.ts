export type TItem = {
  productId: string;
  soldBy: string;
  quantity: number;
};

export type TSale = {
  clientId?: string;
  date: string;
  items: TItem[];
};

export type TReturn = {
  returnItems: TItem[];
};
