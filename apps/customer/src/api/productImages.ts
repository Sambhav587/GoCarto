import type { ImageSourcePropType } from 'react-native';

export const productImages: Record<string, ImageSourcePropType> = {
  'Sparkling Water': require('../../assets/products/sparkling-water.png'),
  'Cold Coffee': require('../../assets/products/cold-coffee.png'),
  'Orange Juice': require('../../assets/products/orange-juice.png'),
  'Granola Bar': require('../../assets/products/granola-bar.png'),
  'Roasted Almonds': require('../../assets/products/roasted-almonds.png'),
  'Classic Potato Chips': require('../../assets/products/classic-potato-chips.png'),
  'Butter Croissant': require('../../assets/products/butter-croissant.png'),
  'Multigrain Bread': require('../../assets/products/multigrain-bread.png'),
  'Brown Bread': require('../../assets/products/brown-bread.png'),
  'Salted Butter': require('../../assets/products/salted-butter.png'),
  'Greek Yogurt': require('../../assets/products/greek-yogurt.png'),
  'Farm Fresh Milk': require('../../assets/products/farm-fresh-milk.png'),
  'Green Broccoli': require('../../assets/products/green-broccoli.png'),
  Potatoes: require('../../assets/products/potatoes.png'),
  'Fresh Tomatoes': require('../../assets/products/fresh-tomatoes.png'),
  'Fresh Oranges': require('../../assets/products/fresh-oranges.png'),
  'Red Apples': require('../../assets/products/red-apples.png'),
  'Fresh Bananas': require('../../assets/products/fresh-bananas.png'),
};

export function getProductImage(
  productName: string,
): ImageSourcePropType | undefined {
  return productImages[productName];
}