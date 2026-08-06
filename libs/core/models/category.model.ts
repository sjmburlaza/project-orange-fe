import { Product } from './product.model';

export interface Category {
  id: number;
  name: string;
}

export interface CategoryDetail extends Category {
  products?: Product[];
}
