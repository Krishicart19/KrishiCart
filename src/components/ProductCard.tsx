import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Product } from '../types/catalog';

type ProductCardProps = {
  product: Product;
  quantity: number;
  onAdd: (product: Product) => void;
  onChangeQuantity: (productId: string, change: number) => void;
  onOpen: (product: Product) => void;
};

export function ProductCard({ product, quantity, onAdd, onChangeQuantity, onOpen }: ProductCardProps) {
  const hasDiscount = Boolean(product.discount && product.discount > 0);
  const discountedPrice = hasDiscount
    ? Math.round(product.price * (1 - product.discount! / 100))
    : product.price;

  return (
    <Pressable onPress={() => onOpen(product)} style={styles.card}>
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{product.discount}% OFF</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
      <Text style={styles.unit}>{product.unit}</Text>
      <View style={styles.ratingRow}>
        <Text style={styles.rating}>★ {product.rating}</Text>
      </View>
      <View style={styles.footer}>
        {hasDiscount ? (
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{discountedPrice}</Text>
            <Text style={styles.originalPrice}>₹{product.price}</Text>
          </View>
        ) : (
          <Text style={styles.price}>₹{product.price}</Text>
        )}
        {quantity > 0 ? (
          <View style={styles.quantityControl}>
            <Pressable onPress={() => onChangeQuantity(product.id, -1)} style={styles.quantityButton}>
              <Text style={styles.quantityButtonText}>−</Text>
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable onPress={() => onChangeQuantity(product.id, 1)} style={styles.quantityButton}>
              <Text style={styles.quantityButtonText}>+</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => onAdd(product)} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    width: 170,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: 12,
  },
  imageContainer: {
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  productImage: {
    width: '85%',
    height: '85%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#E53935',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  discountText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  name: { color: '#173B2B', fontSize: 14, fontWeight: '600', height: 36, lineHeight: 18 },
  unit: { color: '#738078', fontSize: 11, marginTop: 2 },
  ratingRow: { marginTop: 4 },
  rating: { color: '#C67800', fontSize: 12, fontWeight: '700' },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  priceContainer: { flexDirection: 'column' },
  price: { color: '#173B2B', fontSize: 16, fontWeight: '800' },
  originalPrice: { color: '#999', fontSize: 11, textDecorationLine: 'line-through' },
  addButton: { backgroundColor: '#1D7A46', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  quantityControl: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  quantityButton: { alignItems: 'center', backgroundColor: '#E8F0EA', borderRadius: 6, height: 28, justifyContent: 'center', width: 28 },
  quantityButtonText: { color: '#173B2B', fontSize: 16, fontWeight: '600' },
  quantity: { color: '#173B2B', fontSize: 14, fontWeight: '700', minWidth: 20, textAlign: 'center' },
});
