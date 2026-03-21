import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  CATEGORY_COLORS,
  FONTS,
} from '../constants/theme';
import { NewspaperIcon, TrendingUpIcon } from '../components/Icons';

const SAMPLE_NEWS = [
  { id: '1', title: 'Federal Reserve signals potential rate cuts in 2025', source: 'Reuters', time: '2h ago', category: 'finance', relatedMarkets: 2 },
  { id: '2', title: 'OpenAI announces GPT-5 development timeline', source: 'TechCrunch', time: '4h ago', category: 'technology', relatedMarkets: 3 },
  { id: '3', title: 'Bitcoin approaches key resistance level amid ETF inflows', source: 'CoinDesk', time: '5h ago', category: 'crypto', relatedMarkets: 4 },
  { id: '4', title: 'Climate scientists warn 2025 could break temperature records', source: 'Nature', time: '6h ago', category: 'climate', relatedMarkets: 1 },
  { id: '5', title: 'SpaceX Starship achieves successful orbital test', source: 'Space.com', time: '8h ago', category: 'science', relatedMarkets: 2 },
  { id: '6', title: 'EU Parliament debates Ukraine membership fast-track', source: 'Politico', time: '10h ago', category: 'international', relatedMarkets: 1 },
  { id: '7', title: 'New AI coding tools show superhuman potential', source: 'Wired', time: '12h ago', category: 'technology', relatedMarkets: 2 },
  { id: '8', title: 'Healthcare stocks rally on FDA approval news', source: 'Bloomberg', time: '14h ago', category: 'health', relatedMarkets: 1 },
];

export function NewsScreen({ refreshing, onRefresh }) {
  const renderNewsItem = ({ item }) => {
    const categoryColor = CATEGORY_COLORS[item.category]?.[0] || COLORS.primary;
    return (
      <TouchableOpacity style={styles.newsItem} activeOpacity={0.7}>
        <View style={styles.newsContent}>
          <View style={styles.newsHeader}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: categoryColor + '20' },
              ]}
            >
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {item.category}
              </Text>
            </View>
            <Text style={styles.newsTime}>{item.time}</Text>
          </View>
          <Text style={styles.newsTitle}>{item.title}</Text>
          <View style={styles.newsFooter}>
            <Text style={styles.newsSource}>{item.source}</Text>
            {item.relatedMarkets > 0 && (
              <View style={styles.relatedRow}>
                <TrendingUpIcon size={14} color={COLORS.primary} strokeWidth={2} />
                <Text style={styles.relatedMarkets}>
                  {item.relatedMarkets} related market
                  {item.relatedMarkets > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <NewspaperIcon size={24} color={COLORS.primary} />
          <Text style={styles.title}>News</Text>
        </View>
        <Text style={styles.subtitle}>Market-moving stories and updates</Text>
      </View>
      <FlatList
        data={SAMPLE_NEWS}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.display,
    color: COLORS.text,
  },
  subtitle: { fontSize: FONT_SIZES.md, fontFamily: FONTS.body, color: COLORS.textSecondary },
  listContainer: { padding: SPACING.lg, paddingBottom: 100 },
  newsItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  newsContent: { padding: SPACING.lg },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bodySemiBold,
    textTransform: 'capitalize',
  },
  newsTime: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.body, color: COLORS.textMuted },
  newsTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.body, color: COLORS.textSecondary },
  relatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  relatedMarkets: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.primary,
  },
  separator: { height: SPACING.md },
});

export default NewsScreen;
