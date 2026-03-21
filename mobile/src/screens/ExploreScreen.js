import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../constants/theme';
import ReelMarketCard from '../components/ReelMarketCard';
import MarketCard from '../components/MarketCard';
import { FlameIcon } from '../components/Icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ExploreScreen({ markets, onMarketPress, onOutcomePress }) {
  const [activeSubpage, setActiveSubpage] = useState(0);
  const pagerRef = useRef(null);

  const trendingMarkets = [...markets]
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 10);

  const handleSubpageChange = (e) => {
    setActiveSubpage(e.nativeEvent.position);
  };

  const switchSubpage = (index) => {
    pagerRef.current?.setPage(index);
    setActiveSubpage(index);
  };

  const renderReelItem = useCallback(
    ({ item }) => (
      <ReelMarketCard
        market={item}
        onOutcomePress={onOutcomePress}
        onViewDetails={() => onMarketPress?.(item)}
      />
    ),
    [onOutcomePress, onMarketPress],
  );

  const renderMarketItem = useCallback(
    ({ item }) => (
      <MarketCard
        market={item}
        onPress={() => onMarketPress?.(item)}
        onOutcomePress={onOutcomePress}
        compact
      />
    ),
    [onMarketPress, onOutcomePress],
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeSubpage === 0 && styles.activeTab]}
          onPress={() => switchSubpage(0)}
        >
          <Text
            style={[styles.tabText, activeSubpage === 0 && styles.activeTabText]}
          >
            For You
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSubpage === 1 && styles.activeTab]}
          onPress={() => switchSubpage(1)}
        >
          <Text
            style={[styles.tabText, activeSubpage === 1 && styles.activeTabText]}
          >
            Trending
          </Text>
        </TouchableOpacity>
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handleSubpageChange}
      >
        <View key="reels" style={styles.page}>
          <FlatList
            data={trendingMarkets}
            renderItem={renderReelItem}
            keyExtractor={(item) => `reel-${item.id}`}
            pagingEnabled
            snapToInterval={SCREEN_HEIGHT - 120}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            getItemLayout={(data, index) => ({
              length: SCREEN_HEIGHT - 120,
              offset: (SCREEN_HEIGHT - 120) * index,
              index,
            })}
          />
        </View>
        <View key="trending" style={styles.page}>
          <FlatList
            data={markets}
            renderItem={renderMarketItem}
            keyExtractor={(item) => `market-${item.id}`}
            contentContainerStyle={styles.marketsList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <View style={styles.listTitleRow}>
                  <FlameIcon size={24} color={COLORS.warning} />
                  <Text style={styles.listTitle}>Trending Markets</Text>
                </View>
                <Text style={styles.listSubtitle}>
                  Most active markets right now
                </Text>
              </View>
            }
          />
        </View>
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textMuted,
  },
  activeTabText: { color: COLORS.primary },
  pager: { flex: 1 },
  page: { flex: 1 },
  marketsList: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: 100 },
  listHeader: { marginBottom: SPACING.md, paddingHorizontal: SPACING.xs },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  listTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.display,
    color: COLORS.text,
  },
  listSubtitle: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.body, color: COLORS.textSecondary },
});

export default ExploreScreen;
