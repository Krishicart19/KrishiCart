import { StatusBar } from 'expo-status-bar';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, FlatList, Image, Linking, Platform, Pressable, SafeAreaView, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { FlatList as FlatListType, ScrollView as ScrollViewType } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductCard } from './src/components/ProductCard';
import { ImageCarousel } from './src/components/ImageCarousel';
import { api, Order, CreateOrderResponse, SavedAddress } from './src/api';

const CART_STORAGE_KEY = '@KrishiCart:cart';
import { CartItem, Category, Product, ProductImage } from './src/types/catalog';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SignInScreen } from './src/screens/SignInScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';

type Tab = 'categories' | 'orders' | 'profile';

function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previousCategory, setPreviousCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartScreenOpen, setCartScreenOpen] = useState(false);
  const categoryListRef = useRef<FlatListType<Product>>(null);
  const categoryScrollOffsetRef = useRef(0);
  const categoriesScrollRef = useRef<ScrollViewType>(null);
  const categoriesScrollOffsetRef = useRef(0);
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

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<CreateOrderResponse | null>(null);

  // Load cart from storage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    };
    loadCart();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.error('Failed to save cart:', error);
      }
    };
    saveCart();
  }, [cart]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, productsData] = await Promise.all([
          api.getCategories(),
          api.getProducts(),
        ]);
        setCategories(categoriesData);
        setProducts(productsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle Android back button
  useEffect(() => {
    const handleBackPress = () => {
      // If checkout is open, go back to cart
      if (checkoutOpen) {
        setCheckoutOpen(false);
        setCartScreenOpen(true);
        return true;
      }
      // If cart is open, close it
      if (cartScreenOpen) {
        setCartScreenOpen(false);
        return true;
      }
      // If product detail is open, just close the product (stay on category page)
      if (selectedProduct) {
        const savedOffset = categoryScrollOffsetRef.current;
        setSelectedProduct(null);
        setTimeout(() => {
          categoryListRef.current?.scrollToOffset({ offset: savedOffset, animated: false });
        }, 100);
        return true;
      }
      // If a category is selected, go back to categories list
      if (selectedCategory) {
        const savedOffset = categoriesScrollOffsetRef.current;
        setSelectedCategory(null);
        setSearchText('');
        setTimeout(() => {
          categoriesScrollRef.current?.scrollTo({ y: savedOffset, animated: false });
        }, 100);
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
  }, [checkoutOpen, cartScreenOpen, selectedProduct, selectedCategory, activeTab, searchText]);

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
            // Restore product list scroll if still in a category
            if (previousState.selectedCategory) {
              const savedOffset = categoryScrollOffsetRef.current;
              setTimeout(() => {
                categoryListRef.current?.scrollToOffset({ offset: savedOffset, animated: false });
              }, 100);
            }
          }

          // Restore categories home scroll if going back to categories home
          if (!previousState.selectedCategory) {
            const savedOffset = categoriesScrollOffsetRef.current;
            setTimeout(() => {
              categoriesScrollRef.current?.scrollTo({ y: savedOffset, animated: false });
            }, 100);
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
    const trimmedSearch = searchText.trim().toLowerCase();
    const textMatches = trimmedSearch.length === 0 || product.name.toLowerCase().includes(trimmedSearch);
    return categoryMatches && textMatches;
  }), [searchText, selectedCategory]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.quantity * item.price, 0);

  const addToCart = useCallback((product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        return currentCart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  }, []);

  const changeQuantity = useCallback((productId: string, change: number) => {
    setCart((currentCart) => currentCart
      .map((item) => item.id === productId ? { ...item, quantity: item.quantity + change } : item)
      .filter((item) => item.quantity > 0));
  }, []);

  const openCart = useCallback(() => {
    setCartScreenOpen(true);
  }, []);

  const openCheckout = useCallback(() => {
    setCheckoutOpen(true);
    setCartScreenOpen(false);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const handleOrderComplete = useCallback(() => {
    setCheckoutOpen(false);
    setCurrentOrder(null);
    setActiveTab('categories');
  }, []);

  const openCategory = useCallback((categoryId: string) => {
    setPreviousCategory(selectedCategory);
    setSearchText('');
    setSelectedCategory(categoryId);
  }, [selectedCategory]);

  const handleCategoriesScroll = useCallback((offset: number) => {
    categoriesScrollOffsetRef.current = offset;
  }, []);

  const handleCategoryScroll = useCallback((offset: number) => {
    categoryScrollOffsetRef.current = offset;
  }, []);

  const handleOpenProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const handleCategoryBack = useCallback(() => {
    const savedOffset = categoriesScrollOffsetRef.current;
    setSelectedCategory(null);
    setSearchText('');
    categoryScrollOffsetRef.current = 0;
    setTimeout(() => {
      categoriesScrollRef.current?.scrollTo({ y: savedOffset, animated: false });
    }, 100);
  }, []);

  function goBackToPreviousPage() {
    if (cartScreenOpen) {
      setCartScreenOpen(false);
    } else if (selectedProduct) {
      const savedOffset = categoryScrollOffsetRef.current;
      setSelectedProduct(null);
      setTimeout(() => {
        categoryListRef.current?.scrollToOffset({ offset: savedOffset, animated: false });
      }, 100);
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

  const mainScreen = activeTab === 'categories' ? (
    <View style={{ flex: 1 }}>
      <View style={styles.screenLayer}>
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
          scrollRef={categoriesScrollRef}
          onScroll={handleCategoriesScroll}
          categories={categories}
          products={products}
        />
      </View>
      {selectedCategory && (
        <View style={[styles.screenLayer, styles.screenOnTop]}>
          <CategoryItemsScreen
            products={visibleProducts}
            searchText={searchText}
            cart={cart}
            onSearchChange={setSearchText}
            onBack={handleCategoryBack}
            onAdd={addToCart}
            onChangeQuantity={changeQuantity}
            onOpen={handleOpenProduct}
            onOpenCart={openCart}
            cartCount={cartCount}
            categoryName={categories.find((category) => category.id === selectedCategory)?.name ?? 'Products'}
            listRef={categoryListRef}
            onScroll={handleCategoryScroll}
          />
        </View>
      )}
      {selectedProduct && (
        <View style={[styles.screenLayer, { zIndex: 2 }]}>
          <ProductDetails product={selectedProduct} onBack={goBackToPreviousPage} onAdd={addToCart} onChangeQuantity={changeQuantity} cart={cart} onOpenCart={openCart} />
        </View>
      )}
    </View>
  ) : activeTab === 'orders' ? (
    <OrdersScreen onBack={() => { setActiveTab('categories'); }} />
  ) : (
    <ProfileScreen onBack={() => { setActiveTab('categories'); }} />
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading KrishiCart...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContent]}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.sectionTitle}>Connection Error</Text>
        <Text style={styles.mutedText}>{error}</Text>
        <Text style={styles.mutedText}>Make sure the backend server is running.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {checkoutOpen ? (
        <CheckoutScreen
          cart={cart}
          total={cartTotal}
          orderData={currentOrder}
          onBack={() => { setCheckoutOpen(false); setCartScreenOpen(true); }}
          onOrderComplete={handleOrderComplete}
          onClearCart={clearCart}
        />
      ) : cartScreenOpen ? (
        <CartScreen cart={cart} total={cartTotal} onChangeQuantity={changeQuantity} onBack={() => setCartScreenOpen(false)} onCheckout={openCheckout} />
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
  listRef: React.RefObject<FlatListType<Product> | null>;
  onScroll: (offset: number) => void;
};

function TopHeader({ cartCount, onOpenCart, searchText, onSearchChange, searchCategory, onCategorySelect, showCategoryDropdown, categories = [] }: { cartCount: number; onOpenCart: () => void; searchText: string; onSearchChange: (text: string) => void; searchCategory: string; onCategorySelect: (categoryId: string) => void; showCategoryDropdown?: boolean; categories?: Category[]; }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const selectedCategoryName = searchCategory === 'all' ? 'All' : categories.find((c) => c.id === searchCategory)?.name || 'All';

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.brandBox}>
          <Text style={styles.brandText}>Krishi</Text>
          <Text style={[styles.brandText, styles.brandAccent]}>Cart</Text>
        </View>

        <View style={{ flex: 1 }} />

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

function CategoriesScreen({ cartCount, cart, onOpenCart, onOpenCategory, searchText, onSearchChange, searchCategory, onCategorySelect, onAddToCart, onChangeQuantity, onOpenProduct, scrollRef, onScroll, categories, products }: { cartCount: number; cart: CartItem[]; onOpenCart: () => void; onOpenCategory: (categoryId: string) => void; searchText: string; onSearchChange: (text: string) => void; searchCategory: string; onCategorySelect: (categoryId: string) => void; onAddToCart: (product: Product) => void; onChangeQuantity: (productId: string, change: number) => void; onOpenProduct: (product: Product) => void; scrollRef: React.RefObject<ScrollViewType | null>; onScroll: (offset: number) => void; categories: Category[]; products: Product[]; }) {
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

  // Filter categories dynamically from database (exclude 'all' category)
  const visibleCategories = categories
    .filter((category) => category.id !== 'all')
    .filter((category) => searchText.trim().length === 0 || category.name.toLowerCase().includes(searchText.trim().toLowerCase()));

  // Group categories into rows of 3
  const categoryRows: Category[][] = [];
  for (let i = 0; i < visibleCategories.length; i += 3) {
    categoryRows.push(visibleCategories.slice(i, i + 3));
  }

  const getQuantity = (productId: string) => {
    const cartItem = cart.find((item) => item.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <View style={styles.page}>
      <TopHeader cartCount={cartCount} onOpenCart={onOpenCart} searchText={searchText} onSearchChange={onSearchChange} searchCategory={searchCategory} onCategorySelect={onCategorySelect} categories={categories} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.categorySections}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => onScroll(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
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

        {!searchingProducts && visibleCategories.length > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>All Categories</Text>
            {categoryRows.map((rowItems, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.categoryGridRow}>
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
        )}

        {searchingProducts && matchingProducts.length === 0 && visibleCategories.length === 0 && (
          <Text style={styles.emptyText}>No products or categories match your search.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const CategoryItemsScreen = memo(function CategoryItemsScreen(props: CategoryItemsScreenProps) {
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
        ref={props.listRef}
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
        onScroll={(event) => props.onScroll(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      />
    </View>
  );
});

function CartScreen({ cart, total, onChangeQuantity, onBack, onCheckout }: { cart: CartItem[]; total: number; onChangeQuantity: (id: string, change: number) => void; onBack: () => void; onCheckout: () => void }) {
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
            <View style={styles.cartItemImage}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cartImage} resizeMode="contain" />
              ) : (
                <Text style={styles.cartNoImage}>No img</Text>
              )}
            </View>
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
        <Pressable onPress={onCheckout} style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Proceed to checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

type UPIApp = {
  id: string;
  name: string;
  icon: string;
  packageName: string;
  scheme: string;
};

const UPI_APPS: UPIApp[] = [
  { id: 'gpay', name: 'Google Pay', icon: '🟢', packageName: 'com.google.android.apps.nbu.paisa.user', scheme: 'gpay' },
  { id: 'phonepe', name: 'PhonePe', icon: '🟣', packageName: 'com.phonepe.app', scheme: 'phonepe' },
  { id: 'paytm', name: 'Paytm', icon: '🔵', packageName: 'net.one97.paytm', scheme: 'paytmmp' },
  { id: 'bhim', name: 'BHIM', icon: '🟠', packageName: 'in.org.npci.upiapp', scheme: 'upi' },
];

function CheckoutScreen({ cart, total, orderData, onBack, onOrderComplete, onClearCart }: {
  cart: CartItem[];
  total: number;
  orderData: CreateOrderResponse | null;
  onBack: () => void;
  onOrderComplete: () => void;
  onClearCart: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'review' | 'address' | 'selectPayment' | 'creating' | 'payment' | 'submitted' | 'success'>('review');
  const [order, setOrder] = useState<CreateOrderResponse | null>(orderData);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'COD'>('UPI');
  const [selectedUPIApp, setSelectedUPIApp] = useState<string | null>(null);

  // Delivery address state
  const [deliveryName, setDeliveryName] = useState(user?.fullName || '');
  const [deliveryMobile, setDeliveryMobile] = useState(user?.mobileNumber || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [deliveryPinCode, setDeliveryPinCode] = useState(user?.pinCode || '');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  // Fetch saved addresses when component mounts
  useEffect(() => {
    if (user) {
      api.getSavedAddresses(user.id)
        .then(setSavedAddresses)
        .catch(console.error);
    }
  }, [user]);

  const handleProceedToAddress = () => {
    setPaymentStep('address');
  };

  const handleProceedToPayment = () => {
    if (!deliveryName.trim() || !deliveryMobile.trim() || !deliveryAddress.trim() || !deliveryPinCode.trim()) {
      Alert.alert('Missing Details', 'Please fill in all delivery details');
      return;
    }
    if (deliveryMobile.length < 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number');
      return;
    }
    if (deliveryPinCode.length < 6) {
      Alert.alert('Invalid PIN Code', 'Please enter a valid 6-digit PIN code');
      return;
    }
    setPaymentStep('selectPayment');
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to place an order');
      return;
    }

    setPaymentStep('creating');
    setLoading(true);

    try {
      const orderItems = cart.map(item => ({
        productId: item.id,
        productName: item.name,
        productImage: item.imageUrl,
        quantity: item.quantity,
        price: item.price,
        unit: item.unit,
      }));

      const result = await api.createOrder({
        userId: user.id,
        userName: deliveryName,
        userMobile: deliveryMobile,
        deliveryAddress: deliveryAddress,
        pinCode: deliveryPinCode,
        totalAmount: total,
        paymentMethod: selectedPaymentMethod,
        items: orderItems,
      });

      setOrder(result);

      if (selectedPaymentMethod === 'COD') {
        setPaymentStep('success');
        onClearCart();
      } else {
        setPaymentStep('payment');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create order');
      setPaymentStep('selectPayment');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUPI = async (appId?: string) => {
    if (!order?.payment.upiLink) return;

    try {
      let upiLink = order.payment.upiLink;

      // If a specific app is selected, try to use its scheme
      if (appId && Platform.OS !== 'web') {
        const app = UPI_APPS.find(a => a.id === appId);
        if (app && app.scheme !== 'upi') {
          // Replace upi:// with the app-specific scheme
          upiLink = upiLink.replace('upi://', `${app.scheme}://`);
        }
      }

      const supported = await Linking.canOpenURL(upiLink);
      if (supported) {
        await Linking.openURL(upiLink);
        await api.markPaymentSubmitted(order.order.id);
        setPaymentStep('submitted');
      } else {
        // Fallback to generic UPI link
        const genericSupported = await Linking.canOpenURL(order.payment.upiLink);
        if (genericSupported) {
          await Linking.openURL(order.payment.upiLink);
          await api.markPaymentSubmitted(order.order.id);
          setPaymentStep('submitted');
        } else {
          Alert.alert(
            'UPI App Not Found',
            'Please install a UPI app (Google Pay, PhonePe, Paytm, etc.) to complete the payment.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open UPI app');
    }
  };

  const handlePaymentDone = () => {
    setPaymentStep('success');
    onClearCart();
  };

  if (paymentStep === 'success') {
    const isCOD = selectedPaymentMethod === 'COD';
    return (
      <View style={[styles.page, styles.centerContent]}>
        <Text style={{ fontSize: 64, marginBottom: 20 }}>{isCOD ? '📦' : '✓'}</Text>
        <Text style={styles.sectionTitle}>Order Placed!</Text>
        <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 8 }]}>
          Order #{order?.order.id} has been placed successfully.
        </Text>
        <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 4 }]}>
          {isCOD
            ? 'Pay ₹' + total + ' when your order is delivered.'
            : "We'll verify your payment and confirm your order shortly."
          }
        </Text>
        <Pressable
          onPress={onOrderComplete}
          style={[styles.checkoutButton, { marginTop: 32, paddingHorizontal: 40 }]}
        >
          <Text style={styles.checkoutText}>Continue Shopping</Text>
        </Pressable>
      </View>
    );
  }

  if (paymentStep === 'submitted') {
    return (
      <View style={[styles.page, styles.centerContent]}>
        <Text style={{ fontSize: 48, marginBottom: 20 }}>💸</Text>
        <Text style={styles.sectionTitle}>Complete Payment</Text>
        <Text style={[styles.mutedText, { textAlign: 'center', marginHorizontal: 20 }]}>
          If you've completed the payment in your UPI app, tap the button below.
        </Text>

        <View style={checkoutStyles.paymentInfo}>
          <Text style={checkoutStyles.paymentLabel}>Amount to Pay</Text>
          <Text style={checkoutStyles.paymentAmount}>₹{order?.payment.amount}</Text>
          <Text style={[styles.mutedText, { marginTop: 8 }]}>
            Transaction Note: {order?.payment.transactionNote}
          </Text>
        </View>

        <Pressable onPress={handlePaymentDone} style={[styles.checkoutButton, { marginTop: 24, width: '100%' }]}>
          <Text style={styles.checkoutText}>I've Completed Payment</Text>
        </Pressable>

        <Pressable onPress={() => handleOpenUPI(selectedUPIApp || undefined)} style={[checkoutStyles.secondaryButton, { marginTop: 12 }]}>
          <Text style={checkoutStyles.secondaryButtonText}>Open UPI App Again</Text>
        </Pressable>
      </View>
    );
  }

  if (paymentStep === 'payment' && order) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.detailHeader}>
          <Pressable onPress={() => setPaymentStep('selectPayment')} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
          <Text style={styles.title}>Pay with UPI</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={checkoutStyles.orderCard}>
          <Text style={checkoutStyles.orderTitle}>Order #{order.order.id}</Text>
          <Text style={styles.mutedText}>{order.order.items.length} items • ₹{order.payment.amount}</Text>
        </View>

        <View style={checkoutStyles.paymentCard}>
          <Text style={checkoutStyles.cardTitle}>Pay Manually via UPI</Text>

          <Text style={[styles.mutedText, { textAlign: 'center', marginBottom: 16 }]}>
            Open any UPI app and send payment to:
          </Text>

          <View style={checkoutStyles.upiIdBox}>
            <Text style={checkoutStyles.upiIdText}>{order.payment.upiId}</Text>
            <Pressable
              onPress={async () => {
                await Clipboard.setStringAsync(order.payment.upiId);
                Alert.alert('Copied!', 'UPI ID copied to clipboard');
              }}
              style={checkoutStyles.copyButton}
            >
              <Text style={checkoutStyles.copyButtonText}>Copy</Text>
            </Pressable>
          </View>

          <View style={checkoutStyles.amountBox}>
            <Text style={checkoutStyles.amountLabel}>Amount to Pay</Text>
            <Text style={checkoutStyles.amountValue}>₹{order.payment.amount}</Text>
          </View>

          <View style={checkoutStyles.instructionsBox}>
            <Text style={checkoutStyles.instructionsTitle}>Steps:</Text>
            <Text style={checkoutStyles.instructionStep}>1. Open GPay / PhonePe / Paytm</Text>
            <Text style={checkoutStyles.instructionStep}>2. Tap "Send Money" or "Pay"</Text>
            <Text style={checkoutStyles.instructionStep}>3. Enter UPI ID: {order.payment.upiId}</Text>
            <Text style={checkoutStyles.instructionStep}>4. Enter amount: ₹{order.payment.amount}</Text>
            <Text style={checkoutStyles.instructionStep}>5. Complete payment</Text>
          </View>

          <Pressable onPress={handlePaymentDone} style={checkoutStyles.upiButton}>
            <Text style={checkoutStyles.upiButtonText}>I've Completed Payment</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const useSavedAddress = () => {
    if (user) {
      setDeliveryName(user.fullName);
      setDeliveryMobile(user.mobileNumber);
      setDeliveryAddress(user.address);
      setDeliveryPinCode(user.pinCode);
    }
  };

  const selectSavedAddress = (addr: SavedAddress) => {
    setDeliveryName(addr.userName);
    setDeliveryMobile(addr.userMobile);
    setDeliveryAddress(addr.deliveryAddress);
    setDeliveryPinCode(addr.pinCode);
  };

  if (paymentStep === 'address') {
    const hasSavedAddress = user?.address && user?.pinCode;
    // Filter out addresses that match the profile address
    const filteredOrderAddresses = savedAddresses.filter(addr =>
      !(addr.deliveryAddress === user?.address && addr.pinCode === user?.pinCode)
    );
    const hasOrderAddresses = filteredOrderAddresses.length > 0;

    return (
      <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.detailHeader}>
          <Pressable onPress={() => setPaymentStep('review')} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
          <Text style={styles.title}>Delivery Address</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={checkoutStyles.section}>
          <Text style={checkoutStyles.sectionTitle}>Enter Delivery Details</Text>

          <View style={checkoutStyles.inputGroup}>
            <Text style={checkoutStyles.inputLabel}>Full Name *</Text>
            <TextInput
              style={checkoutStyles.input}
              value={deliveryName}
              onChangeText={setDeliveryName}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={checkoutStyles.inputGroup}>
            <Text style={checkoutStyles.inputLabel}>Mobile Number *</Text>
            <TextInput
              style={checkoutStyles.input}
              value={deliveryMobile}
              onChangeText={setDeliveryMobile}
              placeholder="10-digit mobile number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <View style={checkoutStyles.inputGroup}>
            <Text style={checkoutStyles.inputLabel}>Delivery Address *</Text>
            <TextInput
              style={[checkoutStyles.input, { height: 80, textAlignVertical: 'top' }]}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="House no, Street, Area, City"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={checkoutStyles.inputGroup}>
            <Text style={checkoutStyles.inputLabel}>PIN Code *</Text>
            <TextInput
              style={checkoutStyles.input}
              value={deliveryPinCode}
              onChangeText={setDeliveryPinCode}
              placeholder="6-digit PIN code"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
        </View>

        {(hasSavedAddress || hasOrderAddresses) && (
          <View style={checkoutStyles.section}>
            <Text style={checkoutStyles.sectionTitle}>Or Use Saved Address</Text>

            {/* Profile Address */}
            {hasSavedAddress && (
              <Pressable
                onPress={useSavedAddress}
                style={[checkoutStyles.savedAddressCard, { marginBottom: 10 }]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={checkoutStyles.savedAddressName}>{user?.fullName}</Text>
                    <View style={checkoutStyles.addressTag}><Text style={checkoutStyles.addressTagText}>Profile</Text></View>
                  </View>
                  <Text style={checkoutStyles.savedAddressText}>{user?.address}</Text>
                  <Text style={checkoutStyles.savedAddressText}>PIN: {user?.pinCode} • Mobile: {user?.mobileNumber}</Text>
                </View>
                <View style={checkoutStyles.useButtonSmall}>
                  <Text style={checkoutStyles.useButtonText}>Use</Text>
                </View>
              </Pressable>
            )}

            {/* Previously Used Addresses from Orders */}
            {filteredOrderAddresses.map((addr, index) => (
              <Pressable
                key={index}
                onPress={() => selectSavedAddress(addr)}
                style={[checkoutStyles.savedAddressCard, { marginBottom: 10, backgroundColor: '#FFF9E6', borderColor: '#F59E0B' }]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={checkoutStyles.savedAddressName}>{addr.userName}</Text>
                    <View style={[checkoutStyles.addressTag, { backgroundColor: '#FEF3C7' }]}><Text style={[checkoutStyles.addressTagText, { color: '#92400E' }]}>Recent</Text></View>
                  </View>
                  <Text style={checkoutStyles.savedAddressText}>{addr.deliveryAddress}</Text>
                  <Text style={checkoutStyles.savedAddressText}>PIN: {addr.pinCode} • Mobile: {addr.userMobile}</Text>
                </View>
                <View style={[checkoutStyles.useButtonSmall, { backgroundColor: '#F59E0B' }]}>
                  <Text style={checkoutStyles.useButtonText}>Use</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable onPress={handleProceedToPayment} style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Continue to Payment</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (paymentStep === 'selectPayment') {
    return (
      <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.detailHeader}>
          <Pressable onPress={() => setPaymentStep('address')} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
          <Text style={styles.title}>Payment Method</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={checkoutStyles.section}>
          <Text style={checkoutStyles.sectionTitle}>Select Payment Method</Text>

          {/* UPI Payment Option */}
          <Pressable
            onPress={() => setSelectedPaymentMethod('UPI')}
            style={[
              checkoutStyles.paymentOptionCard,
              selectedPaymentMethod === 'UPI' && checkoutStyles.paymentOptionSelected
            ]}
          >
            <Text style={checkoutStyles.paymentOptionIcon}>📱</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={checkoutStyles.paymentOptionName}>UPI Payment</Text>
              <Text style={styles.mutedText}>GPay, PhonePe, Paytm, BHIM & more</Text>
            </View>
            {selectedPaymentMethod === 'UPI' && (
              <View style={checkoutStyles.checkCircle}>
                <Text style={checkoutStyles.checkMark}>✓</Text>
              </View>
            )}
          </Pressable>

          {/* Cash on Delivery Option */}
          <Pressable
            onPress={() => setSelectedPaymentMethod('COD')}
            style={[
              checkoutStyles.paymentOptionCard,
              selectedPaymentMethod === 'COD' && checkoutStyles.paymentOptionSelected
            ]}
          >
            <Text style={checkoutStyles.paymentOptionIcon}>💵</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={checkoutStyles.paymentOptionName}>Cash on Delivery</Text>
              <Text style={styles.mutedText}>Pay when your order arrives</Text>
            </View>
            {selectedPaymentMethod === 'COD' && (
              <View style={checkoutStyles.checkCircle}>
                <Text style={checkoutStyles.checkMark}>✓</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={checkoutStyles.totalSection}>
          <View style={checkoutStyles.totalRow}>
            <Text style={styles.mutedText}>Order Total</Text>
            <Text style={checkoutStyles.totalValue}>₹{total}</Text>
          </View>
          <View style={checkoutStyles.totalRow}>
            <Text style={styles.mutedText}>Delivery</Text>
            <Text style={{ color: '#2E7D32', fontWeight: '600' }}>FREE</Text>
          </View>
          <View style={[checkoutStyles.totalRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0' }]}>
            <Text style={checkoutStyles.grandTotalLabel}>Total to Pay</Text>
            <Text style={checkoutStyles.grandTotal}>₹{total}</Text>
          </View>
        </View>

        <Pressable
          onPress={handlePlaceOrder}
          style={[styles.checkoutButton, loading && { opacity: 0.6 }]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.checkoutText}>
              {selectedPaymentMethod === 'COD' ? 'Place Order (Pay on Delivery)' : 'Place Order & Pay'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.detailHeader}>
        <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={checkoutStyles.section}>
        <Text style={checkoutStyles.sectionTitle}>Order Summary ({cart.length} items)</Text>
        {cart.map((item) => (
          <View key={item.id} style={checkoutStyles.orderItem}>
            <View style={checkoutStyles.orderItemImage}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={{ width: 40, height: 40 }} resizeMode="contain" />
              ) : (
                <Text style={{ fontSize: 10, color: '#999' }}>No img</Text>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={checkoutStyles.orderItemName}>{item.name}</Text>
              <Text style={styles.mutedText}>{item.unit} × {item.quantity}</Text>
            </View>
            <Text style={checkoutStyles.orderItemPrice}>₹{item.price * item.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={checkoutStyles.totalSection}>
        <View style={checkoutStyles.totalRow}>
          <Text style={styles.mutedText}>Subtotal</Text>
          <Text style={checkoutStyles.totalValue}>₹{total}</Text>
        </View>
        <View style={checkoutStyles.totalRow}>
          <Text style={styles.mutedText}>Delivery</Text>
          <Text style={{ color: '#2E7D32', fontWeight: '600' }}>FREE</Text>
        </View>
        <View style={[checkoutStyles.totalRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0E0E0' }]}>
          <Text style={checkoutStyles.grandTotalLabel}>Total</Text>
          <Text style={checkoutStyles.grandTotal}>₹{total}</Text>
        </View>
      </View>

      <Pressable
        onPress={handleProceedToAddress}
        style={styles.checkoutButton}
      >
        <Text style={styles.checkoutText}>Add Delivery Address</Text>
      </Pressable>
    </ScrollView>
  );
}

const checkoutStyles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#173B2B', marginBottom: 12 },
  addressCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  addressName: { fontSize: 16, fontWeight: '700', color: '#173B2B' },
  addressText: { fontSize: 14, color: '#5F6F66', marginTop: 4 },
  orderItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8 },
  orderItemImage: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  orderItemName: { fontSize: 14, fontWeight: '600', color: '#173B2B' },
  orderItemPrice: { fontSize: 15, fontWeight: '700', color: '#173B2B' },
  paymentMethodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#2E7D32' },
  paymentMethodName: { fontSize: 15, fontWeight: '600', color: '#173B2B' },
  totalSection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 24 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalValue: { fontSize: 15, color: '#173B2B' },
  grandTotalLabel: { fontSize: 18, fontWeight: '700', color: '#173B2B' },
  grandTotal: { fontSize: 22, fontWeight: '800', color: '#173B2B' },
  orderCard: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, marginBottom: 24 },
  orderTitle: { fontSize: 18, fontWeight: '700', color: '#173B2B' },
  paymentCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#173B2B', marginBottom: 16 },
  upiDetails: { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 16, marginBottom: 20 },
  upiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  upiLabel: { fontSize: 13, color: '#738078' },
  upiValue: { fontSize: 14, fontWeight: '600', color: '#173B2B' },
  upiAmount: { fontSize: 20, fontWeight: '800', color: '#173B2B' },
  upiButton: { backgroundColor: '#5F259F', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  upiButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  paymentInfo: { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 20, marginTop: 24, alignItems: 'center', width: '100%' },
  paymentLabel: { fontSize: 14, color: '#738078' },
  paymentAmount: { fontSize: 32, fontWeight: '800', color: '#173B2B', marginTop: 8 },
  secondaryButton: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', width: '100%' },
  secondaryButtonText: { color: '#173B2B', fontSize: 15, fontWeight: '600' },
  // Payment options
  paymentOptionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#E0E0E0' },
  paymentOptionSelected: { borderColor: '#2E7D32', backgroundColor: '#F0FFF4' },
  paymentOptionIcon: { fontSize: 28 },
  paymentOptionName: { fontSize: 16, fontWeight: '700', color: '#173B2B' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  // UPI Apps Grid
  upiAppsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  upiAppCard: { width: '48%', backgroundColor: '#F8F8F8', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  upiAppIcon: { fontSize: 32, marginBottom: 8 },
  upiAppName: { fontSize: 14, fontWeight: '600', color: '#173B2B' },
  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { paddingHorizontal: 16, color: '#738078', fontSize: 12, fontWeight: '600' },
  // Input styles
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#173B2B', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, fontSize: 16, color: '#173B2B', borderWidth: 1, borderColor: '#E0E0E0' },
  // Saved address styles
  savedAddressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: '#2E7D32' },
  savedAddressName: { fontSize: 16, fontWeight: '700', color: '#173B2B', marginBottom: 4 },
  savedAddressText: { fontSize: 13, color: '#5F6F66', marginTop: 2 },
  useButtonSmall: { backgroundColor: '#2E7D32', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  useButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  addressTag: { backgroundColor: '#E8F5E9', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  addressTagText: { color: '#2E7D32', fontSize: 10, fontWeight: '700' },
  // Manual payment styles
  upiIdBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F8FF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: '#2E7D32', borderStyle: 'dashed' },
  upiIdText: { flex: 1, fontSize: 18, fontWeight: '700', color: '#173B2B', textAlign: 'center' },
  copyButton: { backgroundColor: '#2E7D32', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  copyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  amountBox: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20 },
  amountLabel: { fontSize: 14, color: '#738078', marginBottom: 4 },
  amountValue: { fontSize: 36, fontWeight: '800', color: '#173B2B' },
  instructionsBox: { backgroundColor: '#FFF9E6', borderRadius: 12, padding: 16, marginBottom: 20 },
  instructionsTitle: { fontSize: 14, fontWeight: '700', color: '#173B2B', marginBottom: 8 },
  instructionStep: { fontSize: 13, color: '#5F6F66', marginBottom: 4, paddingLeft: 4 },
});

type VariantGroups = Record<string, string[]>;

function ProductDetails({ product, onBack, onAdd, onChangeQuantity, cart, onOpenCart }: { product: Product; onBack: () => void; onAdd: (product: Product) => void; onChangeQuantity: (productId: string, change: number) => void; cart: CartItem[]; onOpenCart: () => void }) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullProduct, setFullProduct] = useState<Product | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    api.getProduct(product.id)
      .then((fetchedProduct) => {
        setFullProduct(fetchedProduct);
        setImages(fetchedProduct.images || []);
        if (fetchedProduct.variants) {
          try {
            const parsed: VariantGroups = JSON.parse(fetchedProduct.variants);
            const initialSelections: Record<string, string> = {};
            Object.entries(parsed).forEach(([name, options]) => {
              if (options.length > 0) {
                initialSelections[name] = options[0];
              }
            });
            setSelectedVariants(initialSelections);
          } catch {
            setSelectedVariants({});
          }
        }
      })
      .catch(() => {
        setImages([]);
        setFullProduct(null);
      })
      .finally(() => setLoading(false));
  }, [product.id]);

  const variantGroups: VariantGroups = useMemo(() => {
    if (!fullProduct?.variants) return {};
    try {
      return JSON.parse(fullProduct.variants);
    } catch {
      return {};
    }
  }, [fullProduct?.variants]);

  const variantEntries = Object.entries(variantGroups);
  const hasVariants = variantEntries.length > 0;
  const hasDiscount = Boolean(product.discount && product.discount > 0);
  const originalPrice = hasDiscount ? Math.round(product.price / (1 - product.discount / 100)) : product.price;

  const selectedSummary = Object.values(selectedVariants).filter(Boolean).join(', ');

  const selectVariant = (groupName: string, option: string) => {
    setSelectedVariants(prev => ({ ...prev, [groupName]: option }));
  };

  const cartItem = cart.find(item => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.detailHeader}>
        <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.title}>Product details</Text>
        <Pressable onPress={onOpenCart}><Text style={styles.cartIcon}>🛒</Text></Pressable>
      </View>

      {loading ? (
        <View style={styles.detailImage}>
          <ActivityIndicator size="large" color="#173B2B" />
        </View>
      ) : (
        <ImageCarousel images={images} mainImageUrl={product.imageUrl} />
      )}

      <View style={styles.detailContent}>
        <Text style={styles.detailName}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.detailPrice}>₹{product.price}</Text>
          {hasDiscount && (
            <>
              <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              <View style={styles.discountBadgeSmall}>
                <Text style={styles.discountTextSmall}>{product.discount}% OFF</Text>
              </View>
            </>
          )}
        </View>

        <Text style={styles.detailRating}>★ {product.rating} rating</Text>

        {variantEntries.map(([groupName, options]) => (
          <View key={groupName} style={styles.variantSection}>
            <Text style={styles.variantSectionTitle}>{groupName}</Text>
            <View style={styles.variantOptions}>
              {options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => selectVariant(groupName, option)}
                  style={[
                    styles.variantOption,
                    selectedVariants[groupName] === option && styles.variantOptionSelected
                  ]}
                >
                  <Text style={[
                    styles.variantOptionText,
                    selectedVariants[groupName] === option && styles.variantOptionTextSelected
                  ]}>{option}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.description}>{product.description}</Text>
      </View>

      <View style={styles.detailFooterFixed}>
        <View style={styles.footerLeft}>
          {hasVariants && selectedSummary && (
            <Text style={styles.selectedSummary}>{selectedSummary}</Text>
          )}
          <View style={styles.footerPriceRow}>
            <Text style={styles.footerPrice}>₹{product.price}</Text>
            {hasDiscount && (
              <>
                <Text style={styles.footerOriginalPrice}>₹{originalPrice}</Text>
                <View style={styles.footerDiscountBadge}>
                  <Text style={styles.footerDiscountText}>{product.discount}% OFF</Text>
                </View>
              </>
            )}
          </View>
          <Text style={styles.gstText}>Including GST</Text>
        </View>
        {quantity > 0 ? (
          <View style={styles.detailQuantityControl}>
            <Pressable onPress={() => onChangeQuantity(product.id, -1)} style={styles.detailQuantityButton}>
              <Text style={styles.detailQuantityButtonText}>−</Text>
            </Pressable>
            <Text style={styles.detailQuantity}>{quantity}</Text>
            <Pressable onPress={() => onChangeQuantity(product.id, 1)} style={styles.detailQuantityButton}>
              <Text style={styles.detailQuantityButtonText}>+</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => onAdd(product)} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function OrdersScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.getUserOrders(user.id)
        .then(setOrders)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#E4F3D8';
      case 'shipped': return '#FDECC8';
      case 'confirmed': return '#E8F1FF';
      case 'processing': return '#FFF3E0';
      case 'placed': return '#F3E5F5';
      case 'cancelled': return '#FFEBEE';
      default: return '#F5F5F5';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <ScrollView style={[styles.page, styles.profilePage]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.detailHeader}>
        <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.title}>Your orders</Text>
        <View style={{ width: 36 }} />
      </View>
      <Text style={[styles.mutedText, { marginTop: 0 }]}>Track your recent purchases and delivery status.</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
      ) : orders.length === 0 ? (
        <View style={[styles.centerContent, { marginTop: 60 }]}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
          <Text style={styles.sectionTitle}>No orders yet</Text>
          <Text style={styles.mutedText}>Your orders will appear here</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.infoCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.infoCardTitle}>Order #{order.id}</Text>
              <Text style={{ backgroundColor: getStatusColor(order.orderStatus), borderRadius: 999, color: '#173B2B', fontSize: 11, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 }}>
                {order.orderStatus.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.mutedText}>{order.items?.length || 0} items • ₹{Number(order.totalAmount).toFixed(0)}</Text>
            <Text style={styles.mutedText}>Placed on {formatDate(order.createdAt)}</Text>
            <Text style={[styles.mutedText, { marginTop: 4 }]}>
              Payment: {order.paymentMethod} ({order.paymentStatus})
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function ProfileScreen({ onBack }: { onBack: () => void }) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        await signOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
        ]
      );
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <ScrollView style={[styles.page, styles.profilePage]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.detailHeader}>
        <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user ? getInitials(user.fullName) : 'K'}</Text>
      </View>
      <Text style={[styles.title, { marginTop: 16, textAlign: 'center' }]}>{user?.fullName || 'Guest'}</Text>
      <Text style={[styles.mutedText, { textAlign: 'center' }]}>{user?.email || ''}</Text>

      <View style={[styles.infoCard, { marginTop: 24 }]}>
        <Text style={styles.infoCardTitle}>Contact Information</Text>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Mobile</Text>
          <Text style={styles.profileValue}>{user?.mobileNumber || '-'}</Text>
        </View>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Email</Text>
          <Text style={styles.profileValue}>{user?.email || '-'}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Delivery Address</Text>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Address</Text>
          <Text style={styles.profileValue}>{user?.address || '-'}</Text>
        </View>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>PIN Code</Text>
          <Text style={styles.profileValue}>{user?.pinCode || '-'}</Text>
        </View>
      </View>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
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

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [authScreen, setAuthScreen] = useState<'signin' | 'signup'>('signin');

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        {authScreen === 'signin' ? (
          <SignInScreen onSwitchToSignUp={() => setAuthScreen('signup')} />
        ) : (
          <SignUpScreen onSwitchToSignIn={() => setAuthScreen('signin')} />
        )}
      </SafeAreaView>
    );
  }

  return <MainApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F2F6EE', flex: 1, paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ?? 24) : 0 },
  page: { backgroundColor: '#F8F5F0', flex: 1, paddingHorizontal: 18 },
  screenLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F8F5F0' },
  screenOnTop: { zIndex: 1 },
  header: { backgroundColor: '#283933', borderRadius: 18, marginTop: 12, paddingHorizontal: 12, paddingVertical: 12 },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  brandBox: { alignItems: 'center', backgroundColor: '#F7F3E7', borderRadius: 12, flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8 },
  brandText: { color: '#173B2B', fontSize: 22, fontWeight: '800' },
  brandAccent: { color: '#d38525', marginLeft: 2 },
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
  productRow: { gap: 12, justifyContent: 'flex-start' },
  sectionHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  resultCount: { color: '#738078', fontSize: 12 },
  emptyText: { color: '#738078', fontSize: 14, marginTop: 20, textAlign: 'center' },
  centerContent: { alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 42, marginBottom: 12 },
  mutedText: { color: '#738078', fontSize: 14, marginTop: 6 },
  cartTitle: { marginBottom: 16 },
  cartList: { paddingBottom: 150 },
  cartItem: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, flexDirection: 'row', marginBottom: 12, padding: 12 },
  cartItemImage: { alignItems: 'center', borderRadius: 8, height: 52, justifyContent: 'center', width: 52, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F0F0F0', overflow: 'hidden' },
  cartImage: { width: '90%', height: '90%' },
  cartNoImage: { fontSize: 10, color: '#999' },
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
  detailImage: { alignItems: 'center', borderRadius: 16, height: 280, justifyContent: 'center', marginBottom: 18, borderWidth: 1, borderColor: '#E0E0E0', overflow: 'hidden', backgroundColor: '#FFFFFF' },
  detailProductImage: { width: '80%', height: '80%' },
  noImageText: { fontSize: 16, color: '#999' },
  detailContent: { paddingHorizontal: 18, marginTop: 16 },
  detailName: { color: '#173B2B', fontSize: 24, fontWeight: '800' },
  detailRating: { color: '#D9961A', fontSize: 14, fontWeight: '700', marginTop: 8 },
  description: { color: '#5F6F66', fontSize: 15, lineHeight: 24, marginTop: 12 },
  detailFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  detailPrice: { color: '#173B2B', fontSize: 28, fontWeight: '800' },
  detailAddButton: { alignItems: 'center', backgroundColor: '#173B2B', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  profilePage: { paddingTop: 18 },
  avatar: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#DCEDE1', borderRadius: 40, height: 80, justifyContent: 'center', marginBottom: 16, width: 80 },
  avatarText: { color: '#173B2B', fontSize: 28, fontWeight: '800' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginTop: 18, padding: 16 },
  infoCardTitle: { color: '#173B2B', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  infoCardText: { color: '#33453E', fontSize: 14, lineHeight: 22 },
  bottomNav: { backgroundColor: '#FFFFFF', borderTopColor: '#E7E9EE', borderTopWidth: 1, flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8, paddingBottom: Platform.OS === 'android' ? 30 : 12 },
  navItem: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingVertical: 6 },
  navIcon: { color: '#5C6C64', fontSize: 24 },
  navLabel: { color: '#5C6C64', fontSize: 12, marginTop: 6 },
  navActive: { color: '#173B2B', fontWeight: '700' },
  loadingText: { color: '#173B2B', fontSize: 16, marginTop: 16 },
  errorEmoji: { fontSize: 48, marginBottom: 12 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  profileLabel: { color: '#738078', fontSize: 14 },
  profileValue: { color: '#173B2B', fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  signOutButton: { backgroundColor: '#FFE5E5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24, marginHorizontal: 0 },
  signOutText: { color: '#D94C34', fontSize: 16, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  originalPrice: { color: '#999', fontSize: 16, textDecorationLine: 'line-through' },
  discountBadgeSmall: { backgroundColor: '#E8F5E9', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  discountTextSmall: { color: '#2E7D32', fontSize: 12, fontWeight: '700' },
  gstText: { color: '#738078', fontSize: 11 },
  variantSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E8E8E8' },
  variantSectionTitle: { color: '#173B2B', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  variantOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantOption: { borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', minWidth: 50, alignItems: 'center' },
  variantOptionSelected: { borderColor: '#173B2B', borderWidth: 2, backgroundColor: '#F0F8F0' },
  variantOptionText: { color: '#333', fontSize: 13, fontWeight: '500' },
  variantOptionTextSelected: { color: '#173B2B', fontWeight: '700' },
  detailFooterFixed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E8E8E8', paddingHorizontal: 16, paddingVertical: 12, marginTop: 20, marginHorizontal: -18, paddingBottom: 20 },
  footerLeft: { flex: 1 },
  footerPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerPrice: { color: '#173B2B', fontSize: 20, fontWeight: '800' },
  footerOriginalPrice: { color: '#999', fontSize: 14, textDecorationLine: 'line-through' },
  footerDiscountBadge: { backgroundColor: '#E8F5E9', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  footerDiscountText: { color: '#2E7D32', fontSize: 11, fontWeight: '700' },
  selectedSummary: { color: '#555', fontSize: 12, marginBottom: 4 },
  addButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#173B2B', borderRadius: 8, paddingHorizontal: 40, paddingVertical: 12, alignItems: 'center' },
  addButtonText: { color: '#173B2B', fontSize: 16, fontWeight: '700' },
  detailQuantityControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#173B2B', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 4 },
  detailQuantityButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 6 },
  detailQuantityButtonText: { color: '#173B2B', fontSize: 20, fontWeight: '700' },
  detailQuantity: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', minWidth: 40, textAlign: 'center' },
});
