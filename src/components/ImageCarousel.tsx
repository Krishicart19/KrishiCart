import React, { useState, useRef } from 'react';
import { View, Image, ScrollView, Pressable, StyleSheet, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { ProductImage } from '../types/catalog';

type ImageCarouselProps = {
  images: ProductImage[];
  mainImageUrl?: string;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = Math.min(SCREEN_WIDTH - 36, 400);

export function ImageCarousel({ images, mainImageUrl }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const allImages: string[] = [];

  if (mainImageUrl) {
    allImages.push(mainImageUrl);
  }

  images.forEach((img) => {
    if (img.imageUrl && img.imageUrl !== mainImageUrl) {
      allImages.push(img.imageUrl);
    }
  });

  if (allImages.length === 0) {
    return (
      <View style={styles.noImageContainer}>
        <View style={styles.noImage} />
      </View>
    );
  }

  if (allImages.length === 1) {
    return (
      <View style={styles.singleImageContainer}>
        <Image source={{ uri: allImages[0] }} style={styles.singleImage} resizeMode="contain" />
      </View>
    );
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / IMAGE_WIDTH);
    setActiveIndex(index);
  };

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * IMAGE_WIDTH, animated: true });
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {allImages.map((url, index) => (
          <View key={index} style={[styles.imageWrapper, { width: IMAGE_WIDTH }]}>
            <Image source={{ uri: url }} style={styles.mainImage} resizeMode="contain" />
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsContainer}>
        {allImages.map((_, index) => (
          <Pressable key={index} onPress={() => scrollToIndex(index)}>
            <View style={[styles.dot, activeIndex === index && styles.activeDot]} />
          </Pressable>
        ))}
      </View>

      {allImages.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}>
          {allImages.map((url, index) => (
            <Pressable key={index} onPress={() => scrollToIndex(index)}>
              <View style={[styles.thumbnail, activeIndex === index && styles.activeThumbnail]}>
                <Image source={{ uri: url }} style={styles.thumbnailImage} resizeMode="cover" />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  scrollView: {
    width: IMAGE_WIDTH,
  },
  scrollContent: {
    alignItems: 'center',
  },
  imageWrapper: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  mainImage: {
    width: '85%',
    height: '85%',
  },
  singleImageContainer: {
    width: IMAGE_WIDTH,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  singleImage: {
    width: '85%',
    height: '85%',
  },
  noImageContainer: {
    width: IMAGE_WIDTH,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    alignSelf: 'center',
  },
  noImage: {
    width: 100,
    height: 100,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
  },
  activeDot: {
    backgroundColor: '#173B2B',
    width: 24,
  },
  thumbnailScroll: {
    marginTop: 12,
    maxHeight: 60,
  },
  thumbnail: {
    width: 50,
    height: 50,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: '#173B2B',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});
