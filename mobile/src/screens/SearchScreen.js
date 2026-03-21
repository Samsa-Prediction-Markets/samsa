import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  CATEGORY_COLORS,
  FONTS,
} from '../constants/theme';
import MarketCard from '../components/MarketCard';
import { SearchIcon, XIcon } from '../components/Icons';

const CATEGORIES = [
  'all', 'politics', 'technology', 'finance', 'crypto',
  'science', 'health', 'climate', 'international', 'entertainment',
];

export function SearchScreen({ markets, onMarketPress, onOutcomePress }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredMarkets = useMemo(() => {
    let result = markets;
    if (selectedCategory !== 'all')
      result = result.filter((m) => m.category === selectedCategory);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query) ||
          m.category.toLowerCase().includes(query),
      );
    }
    return result;
  }, [markets, searchQuery, selectedCategory]);

  const renderCategory = ({ item }) => {
    const isSelected = item === selectedCategory;
    const color = CATEGORY_COLORS[item]?.[0] || COLORS.primary;
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          isSelected && { backgroundColor: color + '30', borderColor: color },
        ]}
        onPress={() => setSelectedCategory(item)}
      >
        <Text style={[styles.categoryText, isSelected && { color }]}>
          {item === 'all'
            ? 'All'
            : item.charAt(0).toUpperCase() + item.slice(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMarket = ({ item }) => (
    <MarketCard
      market={item}
      onPress={() => onMarketPress?.(item)}
      onOutcomePress={onOutcomePress}
      compact
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchIcon size={18} color={COLORS.textMuted} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search markets..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <XIcon size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        horizontal
        data={CATEGORIES}
        renderItem={renderCategory}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        style={styles.categoriesList}
      />
      <FlatList
        data={filteredMarkets}
        renderItem={renderMarket}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.marketsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <SearchIcon size={48} color={COLORS.textMuted} strokeWidth={1} />
            <Text style={styles.emptyTitle}>No markets found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or category filter
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    margin: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.body,
    paddingVertical: SPACING.md,
  },
  categoriesList: { maxHeight: 50 },
  categoriesContainer: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  categoryChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
  },
  categoryText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
  },
  marketsList: { padding: SPACING.lg, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl * 2 },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.display,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});

export default SearchScreen;
