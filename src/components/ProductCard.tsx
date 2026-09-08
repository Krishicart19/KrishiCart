import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Product } from '../types/catalog';

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
  onOpen: (product: Product) => void;
};

export function ProductCard({ product, onAdd, onOpen }: ProductCardProps) {
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
        <Pressable onPress={() => onAdd(product)} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
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
});

