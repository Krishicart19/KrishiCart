import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Product } from '../types/catalog';

type ProductCardProps = {
  product: Product;
  quantity: number;
  onAdd: (product: Product) => void;
  onChangeQuantity: (productId: string, change: number) => void;
  onOpen: (product: Product) => void;
};

export function ProductCard({ product, quantity, onAdd, onChangeQuantity, onOpen }: ProductCardProps) {
  return (
    <Pressable onPress={() => onOpen(product)} style={styles.card}>
      <View style={[styles.imagePlaceholder, { backgroundColor: product.color }]}>
        <Text style={styles.productEmoji}>{product.emoji}</Text>
      </View>
      <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
      <Text style={styles.unit}>{product.unit}</Text>
      <View style={styles.ratingRow}>
        <Text style={styles.rating}>★ {product.rating}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.price}>₹{product.price}</Text>
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 10, width: '48%', shadowColor: '#173B2B', shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  imagePlaceholder: { alignItems: 'center', borderRadius: 13, height: 108, justifyContent: 'center', marginBottom: 10 },
  productEmoji: { fontSize: 47 },
  name: { color: '#173B2B', fontSize: 14, fontWeight: '700', height: 38, lineHeight: 19 },
  unit: { color: '#738078', fontSize: 11, marginTop: 3 },
  ratingRow: { marginTop: 7 },
  rating: { color: '#C67800', fontSize: 12, fontWeight: '700' },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 },
  price: { color: '#173B2B', fontSize: 16, fontWeight: '800' },
  addButton: { backgroundColor: '#1D7A46', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  quantityControl: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  quantityButton: { alignItems: 'center', backgroundColor: '#E8F0EA', borderRadius: 8, height: 32, justifyContent: 'center', width: 32 },
  quantityButtonText: { color: '#173B2B', fontSize: 18, fontWeight: '600' },
  quantity: { color: '#173B2B', fontSize: 15, fontWeight: '700', minWidth: 24, textAlign: 'center' },
});

