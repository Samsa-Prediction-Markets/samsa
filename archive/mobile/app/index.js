import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PagerView from 'react-native-pager-view';

import { COLORS, SPACING, FONT_SIZES, FONTS } from '../src/constants/theme';
import { useMarkets } from '../src/hooks/useMarkets';
import { useWallet } from '../src/hooks/useWallet';
import api from '../src/services/api';

import {
  BarChartIcon,
  SearchIcon,
  CompassIcon,
  NewspaperIcon,
  SettingsIcon,
  BellIcon,
} from '../src/components/Icons';

import DashboardScreen from '../src/screens/DashboardScreen';
import SearchScreen from '../src/screens/SearchScreen';
import ExploreScreen from '../src/screens/ExploreScreen';
import NewsScreen from '../src/screens/NewsScreen';
import SettingsScreen from '../src/screens/SettingsScreen';

const PAGES = [
  { key: 'dashboard', IconComponent: BarChartIcon, label: 'Dashboard' },
  { key: 'search', IconComponent: SearchIcon, label: 'Search' },
  { key: 'explore', IconComponent: CompassIcon, label: 'Explore' },
  { key: 'news', IconComponent: NewspaperIcon, label: 'News' },
  { key: 'settings', IconComponent: SettingsIcon, label: 'Settings' },
];

export default function App() {
  const insets = useSafeAreaInsets();
  const pagerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const { markets, loading, refresh: refreshMarkets } = useMarkets();
  const { wallet, refresh: refreshWallet } = useWallet();

  useEffect(() => {
    api.init();
  }, []);

  const handlePageSelected = useCallback((e) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  const goToPage = useCallback((index) => {
    pagerRef.current?.setPage(index);
    setCurrentPage(index);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshMarkets(), refreshWallet()]);
    setRefreshing(false);
  }, [refreshMarkets, refreshWallet]);

  const handleMarketPress = useCallback((market) => {
    console.log('Market pressed:', market.id);
  }, []);

  const handleOutcomePress = useCallback((marketId, outcomeId) => {
    console.log('Outcome pressed:', marketId, outcomeId);
  }, []);

  const renderPage = (pageKey) => {
    switch (pageKey) {
      case 'dashboard':
        return (
          <DashboardScreen
            wallet={wallet}
            markets={markets}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        );
      case 'search':
        return (
          <SearchScreen
            markets={markets}
            onMarketPress={handleMarketPress}
            onOutcomePress={handleOutcomePress}
          />
        );
      case 'explore':
        return (
          <ExploreScreen
            markets={markets}
            onMarketPress={handleMarketPress}
            onOutcomePress={handleOutcomePress}
          />
        );
      case 'news':
        return (
          <NewsScreen
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        );
      case 'settings':
        return <SettingsScreen />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
          <BellIcon size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{PAGES[currentPage].label}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageSelected}
        offscreenPageLimit={2}
      >
        {PAGES.map((page) => (
          <View key={page.key} style={styles.page}>
            {renderPage(page.key)}
          </View>
        ))}
      </PagerView>

      <View style={[styles.tabBar, { paddingBottom: insets.bottom || SPACING.md }]}>
        {PAGES.map((page, index) => {
          const isActive = currentPage === index;
          const IconComp = page.IconComponent;
          return (
            <TouchableOpacity
              key={page.key}
              style={styles.tabItem}
              onPress={() => goToPage(index)}
              activeOpacity={0.7}
            >
              <IconComp
                size={22}
                color={isActive ? COLORS.primary : '#ffffff'}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {page.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surfaceStrong,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.display,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceStrong,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  tabLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bodyMedium,
    color: '#ffffff',
    opacity: 0.5,
    marginTop: 4,
  },
  activeTabLabel: {
    color: COLORS.primary,
    opacity: 1,
  },
});
