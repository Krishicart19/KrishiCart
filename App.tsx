import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, FlatList, Platform, Pressable, SafeAreaView, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, TextInput, View } from 'react-native';

import { ProductCard } from './src/components/ProductCard';
import { categories, products } from './src/data/catalog';
import { CartItem, Product } from './src/types/catalog';

type Tab = 'categories' | 'orders' | 'profile';

const categorySections = [
  { title: 'Agriculture', categoryIds: ['agriculture-equipments', 'seeds', 'fertilizers', 'irrigation', 'pumps-motors', 'tools'] },
  { title: 'Civil & Interiors', categoryIds: ['cement', 'tiling', 'painting', 'waterproofing', 'plywood', 'adhesive'] },
  { title: 'Furniture & Architectural Hardware', categoryIds: ['furniture', 'hinges', 'kitchen-systems', 'wardrobe-fittings', 'door-locks'] },
  { title: 'Electrical', categoryIds: ['electrical-conduits', 'wires', 'switches', 'lighting'] },
  { title: 'Plumbing, Sanitary & Bath', categoryIds: ['cpvc', 'apvc', 'pvc', 'overhead-tanks', 'pumps-motors', 'sanitary'] },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previousCategory, setPreviousCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartScreenOpen, setCartScreenOpen] = useState(false);
  const [navigationStack, setNavigationStack] = useState<Array<{
    activeTab: Tab;
    selectedCategory: string | null;
    selectedProduct: string | null;
    cartScreenOpen: boolean;
  }>>([{
    activeTab: 'categories',
    selectedCategory: null,
    selectedProduct: null,
    cartScreenOpen: false,
  }]);

  // Handle Android back button
  useEffect(() => {
    const handleBackPress = () => {
      // If cart is open, close it
      if (cartScreenOpen) {
        setCartScreenOpen(false);
        return true;
      }
      // If product detail is open, just close the product (stay on category page)
      if (selectedProduct) {
        setSelectedProduct(null);
        return true;
      }
      // If a category is selected, go back to categories list
      if (selectedCategory) {
        setSelectedCategory(null);
        setSearchText('');
        return true;
      }
      // If on orders or profile tab, go back to categories
      if (activeTab !== 'categories') {
        setActiveTab('categories');
        return true;
      }
      // Allow default back behavior (exit app) only on categories home screen
      return false;
    };

    if (Platform.OS !== 'web') {
      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => subscription.remove();
    }
  }, [cartScreenOpen, selectedProduct, selectedCategory, activeTab, searchText]);

  // Sync app state changes to navigation stack on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const currentState = {
        activeTab,
        selectedCategory,
        selectedProduct: selectedProduct?.id || null,
        cartScreenOpen,
      };

      const lastStackState = navigationStack[navigationStack.length - 1];

      // Check if state actually changed
      const stateChanged =
        lastStackState.activeTab !== currentState.activeTab ||
        lastStackState.selectedCategory !== currentState.selectedCategory ||
        lastStackState.selectedProduct !== currentState.selectedProduct ||
        lastStackState.cartScreenOpen !== currentState.cartScreenOpen;

      if (stateChanged) {
        // Push new state to navigation stack
        const newStack = [...navigationStack, currentState];
        setNavigationStack(newStack);
        
        // Also push to browser history
        window.history.pushState(currentState, '', window.location.pathname);
      }
    }
  }, [cartScreenOpen, selectedProduct?.id, selectedCategory, activeTab]);

  // Handle browser back button on web platform
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handlePopState = () => {
      // Pop from our navigation stack
      setNavigationStack((currentStack) => {
        if (currentStack.length > 1) {
          const newStack = currentStack.slice(0, -1);
          const previousState = newStack[newStack.length - 1];

          // Restore app state from the previous navigation entry
          setActiveTab(previousState.activeTab);
          setSelectedCategory(previousState.selectedCategory);
          setCartScreenOpen(previousState.cartScreenOpen);

          if (previousState.selectedProduct) {
            const product = products.find((p) => p.id === previousState.selectedProduct);
            setSelectedProduct(product || null);
          } else {
            setSelectedProduct(null);
          }

          return newStack;
        }
        return currentStack;
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize browser history on app mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      const initialState = {
        activeTab: 'categories' as Tab,
        selectedCategory: null,
        selectedProduct: null,
        cartScreenOpen: false,
      };
      window.history.replaceState(initialState, '', window.location.pathname);
    }
  }, []);

  const visibleProducts = useMemo(() => products.filter((product) => {
    const categoryMatches = selectedCategory === null || product.categoryId === selectedCategory;
    const textMatches = product.name.toLowerCase().includes(searchText.toLowerCase());
    return categoryMatches && textMatches;
  }), [searchText, selectedCategory]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.quantity * item.price, 0);

  function addToCart(product: Product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        return currentCart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, change: number) {
    setCart((currentCart) => currentCart
      .map((item) => item.id === productId ? { ...item, quantity: item.quantity + change } : item)
      .filter((item) => item.quantity > 0));
  }

  function openCart() {
    setCartScreenOpen(true);
  }

  function openCategory(categoryId: string) {
    setPreviousCategory(selectedCategory);
    setSearchText('');
    setSelectedCategory(categoryId);
  }

  function goBackToPreviousPage() {
    if (cartScreenOpen) {
      setCartScreenOpen(false);
    } else if (selectedProduct) {
      setSelectedProduct(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setSearchText('');
    }
  }

  function changeTab(tab: Tab) {
    setCartScreenOpen(false);
    setActiveTab(tab);
    setSelectedCategory(null);
    setSelectedProduct(null);
    if (tab === 'categories') {
      setSearchText('');
    }
  }

  const mainScreen = selectedProduct ? (
    <ProductDetails product={selectedProduct} onBack={goBackToPreviousPage} onAdd={addToCart} onOpenCart={openCart} />
  ) : activeTab === 'categories' && selectedCategory === null ? (
    <CategoriesScreen
      cartCount={cartCount}
      cart={cart}
      onOpenCart={openCart}
      onOpenCategory={openCategory}
      searchText={searchText}
      onSearchChange={setSearchText}
      searchCategory={searchCategory}
      onCategorySelect={setSearchCategory}
      onAddToCart={addToCart}
      onChangeQuantity={changeQuantity}
      onOpenProduct={setSelectedProduct}
    />
  ) : activeTab === 'categories' && selectedCategory !== null ? (
    <CategoryItemsScreen
      products={visibleProducts}
      searchText={searchText}
      cart={cart}
      onSearchChange={setSearchText}
      onBack={() => {
        setSelectedCategory(null);
        setSearchText('');
      }}
      onAdd={addToCart}
      onChangeQuantity={changeQuantity}
      onOpen={setSelectedProduct}
      onOpenCart={openCart}
      cartCount={cartCount}
      categoryName={categories.find((category) => category.id === selectedCategory)?.name ?? 'Products'}
    />
  ) : activeTab === 'orders' ? (
    <OrdersScreen onBack={() => { setActiveTab('categories'); }} />
  ) : (
    <ProfileScreen onBack={() => { setActiveTab('categories'); }} />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {cartScreenOpen ? (
        <CartScreen cart={cart} total={cartTotal} onChangeQuantity={changeQuantity} onBack={() => setCartScreenOpen(false)} />
      ) : (
        <>
          {mainScreen}
          <BottomNavigation activeTab={activeTab} onChange={changeTab} />
        </>
      )}
    </SafeAreaView>
  );
}

type CategoryItemsScreenProps = {
  products: Product[];
  searchText: string;
  cartCount: number;
  cart: CartItem[];
  onSearchChange: (text: string) => void;
  onBack: () => void;
  onAdd: (product: Product) => void;
  onChangeQuantity: (productId: string, change: number) => void;
  onOpen: (product: Product) => void;
  onOpenCart: () => void;
  categoryName: string;
};

function TopHeader({ cartCount, onOpenCart, searchText, onSearchChange, searchCategory, onCategorySelect, showCategoryDropdown }: { cartCount: number; onOpenCart: () => void; searchText: string; onSearchChange: (text: string) => void; searchCategory: string; onCategorySelect: (categoryId: string) => void; showCategoryDropdown?: boolean; }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const selectedCategoryName = searchCategory === 'all' ? 'All' : categories.find((c) => c.id === searchCategory)?.name || 'All';

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.brandBox}>
          <Text style={styles.brandText}>Krishi</Text>
          <Text style={[styles.brandText, styles.brandAccent]}>Cart</Text>
        </View>

        <View style={styles.locationBlock}>
          <Text style={styles.locationLabel}>Delivering to</Text>
          <Text style={styles.locationText}>Dharwad 580006</Text>
          <Text style={styles.locationLink}>Update location</Text>
        </View>

        <Pressable onPress={onOpenCart} style={styles.cartBadge}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartCount > 0 && <Text style={styles.cartCount}>{cartCount}</Text>}
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        {showCategoryDropdown !== false && (
          <Pressable onPress={() => setDropdownOpen(!dropdownOpen)} style={styles.searchScope}>
            <Text style={styles.searchScopeText}>{selectedCategoryName}</Text>
            <Text style={styles.searchScopeArrow}>▾</Text>
          </Pressable>
        )}
        <View style={styles.searchInputWrap}>
          <TextInput
            value={searchText}
            onChangeText={onSearchChange}
            placeholder="Search products or categories..."
            placeholderTextColor="#89968E"
            style={styles.searchInput}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => onSearchChange('')} style={styles.searchClear}>
              <Text style={styles.searchClearText}>×</Text>
            </Pressable>
          )}
        </View>
        <Pressable style={styles.searchButton}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </Pressable>
      </View>

      {dropdownOpen && (
        <View style={styles.categoryDropdown}>
          <Pressable
            onPress={() => { onCategorySelect('all'); setDropdownOpen(false); }}
            style={[styles.categoryDropdownItem, searchCategory === 'all' && styles.categoryDropdownItemActive]}
          >
            <Text style={styles.categoryDropdownText}>All Categories</Text>
          </Pressable>
          {categories.filter((c) => c.id !== 'all').map((category) => (
            <Pressable
              key={category.id}
              onPress={() => { onCategorySelect(category.id); setDropdownOpen(false); }}
              style={[styles.categoryDropdownItem, searchCategory === category.id && styles.categoryDropdownItemActive]}
            >
              <Text style={styles.categoryDropdownIcon}>{category.icon}</Text>
              <Text style={styles.categoryDropdownText}>{category.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function CategoriesScreen({ cartCount, cart, onOpenCart, onOpenCategory, searchText, onSearchChange, searchCategory, onCategorySelect, onAddToCart, onChangeQuantity, onOpenProduct }: { cartCount: number; cart: CartItem[]; onOpenCart: () => void; onOpenCategory: (categoryId: string) => void; searchText: string; onSearchChange: (text: string) => void; searchCategory: string; onCategorySelect: (categoryId: string) => void; onAddToCart: (product: Product) => void; onChangeQuantity: (productId: string, change: number) => void; onOpenProduct: (product: Product) => void; }) {
  const searchingProducts = searchText.trim().length > 0;

  const matchingProducts = searchingProducts
    ? products.filter((product) => {
        const searchWords = searchText.toLowerCase().split(/\s+/).filter((w) => w.length > 0);
        const productText = (product.name + ' ' + product.description).toLowerCase();
        const textMatches = searchWords.every((word) => productText.includes(word));
        const categoryMatches = searchCategory === 'all' || product.categoryId === searchCategory;
        return textMatches && categoryMatches;
      })
    : [];

  const visibleSections = categorySections
    .map((section) => {
      const items = section.categoryIds
        .map((categoryId) => categories.find((category) => category.id === categoryId))
        .filter((category): category is (typeof categories)[number] => Boolean(category))
        .filter((category) => category.name.toLowerCase().includes(searchText.toLowerCase()));

      return { ...section, items };
    })
    .filter((section) => section.items.length > 0);

  const getQuantity = (productId: string) => {
    const cartItem = cart.find((item) => item.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <View style={styles.page}>
      <TopHeader cartCount={cartCount} onOpenCart={onOpenCart} searchText={searchText} onSearchChange={onSearchChange} searchCategory={searchCategory} onCategorySelect={onCategorySelect} />

      <ScrollView contentContainerStyle={styles.categorySections} showsVerticalScrollIndicator={false}>
        {searchingProducts && matchingProducts.length > 0 && (
          <View style={styles.categorySection}>
            <View style={styles.searchResultHeader}>
              <Pressable onPress={() => onSearchChange('')} style={styles.backButton}>
                <Text style={styles.backText}>‹</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Products</Text>
                <Text style={styles.resultCount}>{matchingProducts.length} items found</Text>
              </View>
            </View>
            <View style={styles.productGridWrap}>
              {matchingProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  quantity={getQuantity(item.id)}
                  onAdd={onAddToCart}
                  onChangeQuantity={onChangeQuantity}
                  onOpen={onOpenProduct}
                />
              ))}
            </View>
          </View>
        )}

        {!searchingProducts && visibleSections.map((section) => {
          const rows = [] as typeof section.items[];
          for (let index = 0; index < section.items.length; index += 3) {
            rows.push(section.items.slice(index, index + 3));
          }

          return (
            <View key={section.title} style={styles.categorySection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {rows.map((rowItems, rowIndex) => (
                <View key={`${section.title}-${rowIndex}`} style={styles.categoryGridRow}>
                  {rowItems.map((item) => {
                    const itemCount = products.filter((product) => product.categoryId === item.id).length;
                    return (
                      <Pressable key={item.id} onPress={() => onOpenCategory(item.id)} style={styles.categoryCard}>
                        <View style={styles.categoryIconCircle}><Text style={styles.categoryEmoji}>{item.icon}</Text></View>
                        <Text numberOfLines={2} ellipsizeMode="tail" adjustsFontSizeToFit minimumFontScale={0.7} style={styles.categoryCardTitle}>{item.name}</Text>
                        <Text style={styles.categoryCardCount}>{itemCount} products</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          );
        })}

        {searchingProducts && matchingProducts.length === 0 && visibleSections.length === 0 && (
          <Text style={styles.emptyText}>No products or categories match your search.</Text>
        )}
      </ScrollView>
    </View>
  );
}

function CategoryItemsScreen(props: CategoryItemsScreenProps) {
  const getQuantity = (productId: string) => {
    const cartItem = props.cart.find((item) => item.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <View style={styles.page}>
      <TopHeader cartCount={props.cartCount} onOpenCart={props.onOpenCart} searchText={props.searchText} onSearchChange={props.onSearchChange} searchCategory="all" onCategorySelect={() => {}} showCategoryDropdown={false} />
      <View style={styles.detailHeader}>
        <Pressable onPress={props.onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{props.categoryName}</Text>
          <Text style={styles.resultCount}>{props.products.length} items</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={props.products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productList}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            quantity={getQuantity(item.id)}
            onAdd={props.onAdd}
            onChangeQuantity={props.onChangeQuantity}
            onOpen={props.onOpen}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No items match your search.</Text>}
      />
    </View>
  );
}

function CartScreen({ cart, total, onChangeQuantity, onBack }: { cart: CartItem[]; total: number; onChangeQuantity: (id: string, change: number) => void; onBack: () => void }) {
  if (cart.length === 0) {
    return (
      <View style={[styles.page, styles.centerContent]}>
        <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.sectionTitle}>Your cart is empty</Text>
        <Text style={styles.mutedText}>Add products from the home screen to see them here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.detailHeader}>
        <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={[styles.title, styles.cartTitle]}>Your cart</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={styles.cartList}>
        {cart.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={[styles.cartItemEmoji, { backgroundColor: item.color }]}><Text style={styles.cartEmoji}>{item.emoji}</Text></View>
            <View style={styles.cartItemInfo}>
              <Text style={styles.cartItemName}>{item.name}</Text>
              <Text style={styles.unit}>{item.unit}</Text>
              <Text style={styles.price}>₹{item.price}</Text>
            </View>
            <View style={styles.quantityControl}>
              <Pressable onPress={() => onChangeQuantity(item.id, -1)} style={styles.quantityButton}><Text style={styles.quantityButtonText}>−</Text></Pressable>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Pressable onPress={() => onChangeQuantity(item.id, 1)} style={styles.quantityButton}><Text style={styles.quantityButtonText}>+</Text></Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.checkoutPanel}>
        <View style={styles.totalRow}>
          <Text style={styles.mutedText}>Total</Text>
          <Text style={styles.total}>₹{total}</Text>
        </View>
        <Pressable onPress={() => Alert.alert('Coming next', 'Checkout will be connected after we build login and the backend API.')} style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Proceed to checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProductDetails({ product, onBack, onAdd, onOpenCart }: { product: Product; onBack: () => void; onAdd: (product: Product) => void; onOpenCart: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.page}>
        <View style={styles.detailHeader}>
          <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
          <Text style={styles.title}>Product details</Text>
          <Pressable onPress={onOpenCart}><Text style={styles.cartIcon}>🛒</Text></Pressable>
        </View>

        <View style={[styles.detailImage, { backgroundColor: product.color }]}><Text style={styles.detailEmoji}>{product.emoji}</Text></View>
        <Text style={styles.detailName}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>
        <Text style={styles.detailRating}>★ {product.rating} rating</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.detailFooter}>
          <Text style={styles.detailPrice}>₹{product.price}</Text>
          <Pressable onPress={() => onAdd(product)} style={styles.detailAddButton}>
            <Text style={styles.checkoutText}>Add to cart</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function OrdersScreen({ onBack }: { onBack: () => void }) {
  const orders = [
    { id: 'OD-1048', title: 'Tomato Seeds Pack', detail: '2 items • Delivered on Aug 29', status: 'Delivered', color: '#E4F3D8' },
    { id: 'OD-1045', title: 'Organic Compost', detail: '1 item • Out for delivery', status: 'Shipping', color: '#FDECC8' },
    { id: 'OD-1039', title: 'Fertilizer Combo', detail: '3 items • Order placed', status: 'Processing', color: '#E8F1FF' },
  ];

  return (
    <View style={[styles.page, styles.profilePage]}>
      <View style={styles.detailHeader}>
        <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.title}>Your orders</Text>
        <View style={{ width: 36 }} />
      </View>
      <Text style={[styles.mutedText, { marginTop: 0 }]}>Track your recent purchases and delivery status.</Text>

      {orders.map((order) => (
        <View key={order.id} style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>{order.id}</Text>
          <Text style={styles.infoCardText}>{order.title}</Text>
          <Text style={styles.mutedText}>{order.detail}</Text>
          <Text style={{ backgroundColor: order.color, borderRadius: 999, color: '#173B2B', fontSize: 11, fontWeight: '700', marginTop: 12, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' }}>{order.status}</Text>
        </View>
      ))}
    </View>
  );
}

function ProfileScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={[styles.page, styles.profilePage]}>
      <View style={styles.detailHeader}>
        <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={styles.avatar}><Text style={styles.avatarText}>K</Text></View>
      <Text style={[styles.title, { marginTop: 16 }]}>Welcome to KrishiCart</Text>
      <Text style={styles.mutedText}>Login and account settings will be built in the next frontend step.</Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>What is ready?</Text>
        <Text style={styles.infoCardText}>✓ Category browsing{`\n`}✓ Category item lists{`\n`}✓ Local shopping cart{`\n`}○ Login screen (next){`\n`}○ API connection (later)</Text>
      </View>
    </View>
  );
}

function BottomNavigation({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'categories', icon: '▦', label: 'Categories' },
    { key: 'orders', icon: '📦', label: 'Orders' },
    { key: 'profile', icon: '☺', label: 'Profile' },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.navItem}>
          <Text style={[styles.navIcon, activeTab === tab.key && styles.navActive]}>{tab.icon}</Text>
          <Text style={[styles.navLabel, activeTab === tab.key && styles.navActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F2F6EE', flex: 1, paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ?? 24) : 0 },
  page: { backgroundColor: '#F8F5F0', flex: 1, paddingHorizontal: 18 },
  header: { backgroundColor: '#283933', borderRadius: 18, marginTop: 12, paddingHorizontal: 12, paddingVertical: 12 },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  brandBox: { alignItems: 'center', backgroundColor: '#F7F3E7', borderRadius: 12, flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8 },
  brandText: { color: '#173B2B', fontSize: 22, fontWeight: '800' },
  brandAccent: { color: '#d38525', marginLeft: 2 },
  locationBlock: { flex: 1, justifyContent: 'center', paddingHorizontal: 4 },
  locationLabel: { color: '#DDEAD9', fontSize: 11 },
  locationText: { color: '#F7FAF7', fontSize: 15, fontWeight: '700', marginTop: 2 },
  locationLink: { color: '#F9C76B', fontSize: 11, marginTop: 2 },
  categoryHeading: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  greeting: { color: '#738078', fontSize: 13 },
  title: { color: '#173B2B', fontSize: 21, fontWeight: '800', marginTop: 2 },
  categoryIntro: { color: '#8ca796', fontSize: 15, lineHeight: 22, marginBottom: 20, marginTop: 22 },
  categorySections: { paddingBottom: 120, paddingTop: 12 },
  categorySection: { marginBottom: 22 },
  productGridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  sectionTitle: { color: '#1D2B27', fontSize: 22, fontWeight: '800', marginBottom: 14 },
  categoryGridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', rowGap: 12 },
  categoryCard: { alignItems: 'center', backgroundColor: '#DCEEF1', borderRadius: 22, justifyContent: 'center', margin: 3, paddingHorizontal: 6, paddingVertical: 12, width: '31.5%' },
  categoryIconCircle: { alignItems: 'center', backgroundColor: '#EAF4ED', borderRadius: 18, height: 78, justifyContent: 'center', width: '100%' },
  categoryEmoji: { fontSize: 38 },
  categoryCardTitle: { color: '#173B2B', flexShrink: 1, fontSize: 13, fontWeight: '700', lineHeight: 17, marginTop: 10, minHeight: 34, textAlign: 'center', width: '100%', includeFontPadding: false },
  categoryCardCount: { color: '#738078', fontSize: 11, lineHeight: 14, marginTop: 4, textAlign: 'center' },
  unit: { color: '#738078', fontSize: 11, marginTop: 3 },
  price: { color: '#173B2B', fontSize: 16, fontWeight: '800', marginTop: 5 },
  cartBadge: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 9, position: 'relative' },
  cartIcon: { fontSize: 20 },
  cartCount: { backgroundColor: '#D94C34', borderColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, color: '#FFFFFF', fontSize: 10, fontWeight: '800', minWidth: 18, paddingHorizontal: 4, paddingVertical: 2, position: 'absolute', right: -7, textAlign: 'center', top: -7 },
  searchWrap: { alignItems: 'stretch', borderRadius: 12, flexDirection: 'row', marginTop: 12, overflow: 'hidden' },
  searchScope: { alignItems: 'center', backgroundColor: '#E8F3E0', flexDirection: 'row', gap: 4, paddingHorizontal: 12 },
  searchScopeText: { color: '#173B2B', fontSize: 13, fontWeight: '700' },
  searchScopeArrow: { color: '#173B2B', fontSize: 10 },
  searchInputWrap: { alignItems: 'center', backgroundColor: '#FFFFFF', flex: 1, flexDirection: 'row' },
  searchInput: { color: '#173B2B', flex: 1, fontSize: 14, paddingLeft: 14, paddingRight: 8, paddingVertical: 12 },
  searchButton: { alignItems: 'center', backgroundColor: '#F59E0B', justifyContent: 'center', paddingHorizontal: 18 },
  searchButtonText: { fontSize: 18 },
  searchClear: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  searchClearText: { color: '#999999', fontSize: 20, fontWeight: '300' },
  categoryDropdown: { backgroundColor: '#FFFFFF', borderRadius: 12, marginTop: 8, maxHeight: 300, overflow: 'scroll', padding: 8 },
  categoryDropdownItem: { alignItems: 'center', borderRadius: 8, flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  categoryDropdownItemActive: { backgroundColor: '#E8F3E0' },
  categoryDropdownIcon: { fontSize: 18 },
  categoryDropdownText: { color: '#173B2B', fontSize: 14, fontWeight: '500' },
  searchResultHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 8 },
  productList: { paddingBottom: 140, paddingTop: 12 },
  productRow: { gap: '4%', justifyContent: 'space-between' },
  sectionHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  resultCount: { color: '#738078', fontSize: 12 },
  emptyText: { color: '#738078', fontSize: 14, marginTop: 20, textAlign: 'center' },
  centerContent: { alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 42, marginBottom: 12 },
  mutedText: { color: '#738078', fontSize: 14, marginTop: 6 },
  cartTitle: { marginBottom: 16 },
  cartList: { paddingBottom: 150 },
  cartItem: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, flexDirection: 'row', marginBottom: 12, padding: 12 },
  cartItemEmoji: { alignItems: 'center', borderRadius: 12, height: 52, justifyContent: 'center', width: 52 },
  cartEmoji: { fontSize: 24 },
  cartItemInfo: { flex: 1, marginLeft: 12 },
  cartItemName: { color: '#173B2B', fontSize: 15, fontWeight: '700' },
  quantityControl: { alignItems: 'center', flexDirection: 'row' },
  quantityButton: { alignItems: 'center', backgroundColor: '#E8F0EA', borderRadius: 8, height: 28, justifyContent: 'center', width: 28 },
  quantityButtonText: { color: '#173B2B', fontSize: 18, fontWeight: '700' },
  quantity: { color: '#173B2B', fontSize: 15, fontWeight: '700', minWidth: 22, textAlign: 'center' },
  checkoutPanel: { backgroundColor: '#FFFFFF', borderTopColor: '#E7E9EE', borderTopWidth: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18 },
  totalRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  total: { color: '#173B2B', fontSize: 24, fontWeight: '800' },
  checkoutButton: { alignItems: 'center', backgroundColor: '#173B2B', borderRadius: 12, paddingVertical: 14 },
  checkoutText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  detailHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  backButton: { alignItems: 'center', backgroundColor: '#EEF4EC', borderRadius: 10, height: 36, justifyContent: 'center', width: 36 },
  backText: { color: '#173B2B', fontSize: 28, fontWeight: '700' },
  detailImage: { alignItems: 'center', borderRadius: 20, height: 220, justifyContent: 'center', marginBottom: 18 },
  detailEmoji: { fontSize: 80 },
  detailName: { color: '#173B2B', fontSize: 24, fontWeight: '800' },
  detailRating: { color: '#D9961A', fontSize: 14, fontWeight: '700', marginTop: 8 },
  description: { color: '#5F6F66', fontSize: 15, lineHeight: 24, marginTop: 12 },
  detailFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  detailPrice: { color: '#173B2B', fontSize: 28, fontWeight: '800' },
  detailAddButton: { alignItems: 'center', backgroundColor: '#173B2B', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  profilePage: { paddingTop: 18 },
  avatar: { alignItems: 'center', backgroundColor: '#DCEDE1', borderRadius: 40, height: 80, justifyContent: 'center', marginBottom: 16, width: 80 },
  avatarText: { color: '#173B2B', fontSize: 28, fontWeight: '800' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginTop: 18, padding: 16 },
  infoCardTitle: { color: '#173B2B', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  infoCardText: { color: '#33453E', fontSize: 14, lineHeight: 22 },
  bottomNav: { backgroundColor: '#FFFFFF', borderTopColor: '#E7E9EE', borderTopWidth: 1, flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8, paddingBottom: Platform.OS === 'android' ? 30 : 12 },
  navItem: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingVertical: 6 },
  navIcon: { color: '#5C6C64', fontSize: 24 },
  navLabel: { color: '#5C6C64', fontSize: 12, marginTop: 6 },
  navActive: { color: '#173B2B', fontWeight: '700' },
});
