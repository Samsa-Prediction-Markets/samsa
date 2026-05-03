import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  FONTS,
} from '../constants/theme';
import WalletCard from '../components/WalletCard';
import CollapsibleSection from '../components/CollapsibleSection';
import { PortfolioChart } from '../components/PortfolioChart';
import {
  BarChartIcon,
  UsersIcon,
  StarIcon,
  SparklesIcon,
  TargetIcon,
  ActivityIcon,
} from '../components/Icons';

function computePortfolioStats(wallet, markets) {
  const positions = wallet.positions || [];
  let totalPositionsValue = 0;
  let totalPnl = 0;
  let winCount = 0;

  const enrichedPositions = positions.map((pos) => {
    const market = markets.find((m) => m.id === pos.marketId);
    const currentOutcome = market?.outcomes?.find((o) => o.id === pos.outcomeId);
    const currentProb = currentOutcome?.probability ?? pos.probability ?? 0;
    const buyProb = typeof pos.probability === 'number' && pos.probability > 0
      ? pos.probability
      : 100;
    const shares = pos.amount / (buyProb / 100);
    const currentValue = shares * (currentProb / 100);
    const pnl = currentValue - pos.amount;

    totalPositionsValue += currentValue;
    totalPnl += pnl;
    if (pnl > 0) winCount++;

    return { ...pos, currentValue, pnl, currentProb };
  });

  const totalPortfolioValue = wallet.balance + totalPositionsValue;
  const accuracy =
    enrichedPositions.length > 0
      ? Math.round((winCount / enrichedPositions.length) * 100)
      : 0;
  const dailyChangePct =
    totalPortfolioValue > 0
      ? (totalPnl / (totalPortfolioValue - totalPnl)) * 100
      : 0;

  return {
    totalPortfolioValue,
    totalPnl,
    dailyChangePct,
    enrichedPositions,
    predictionsCount: enrichedPositions.length,
    accuracy,
    calibration: 0,
  };
}

export function DashboardScreen({ wallet, markets = [], onRefresh, refreshing }) {
  const stats = useMemo(
    () => computePortfolioStats(wallet, markets),
    [wallet, markets],
  );

  const renderPositionItem = (position) => (
    <View key={position.id} style={styles.positionItem}>
      <View style={styles.positionInfo}>
        <Text style={styles.positionTitle} numberOfLines={1}>
          {position.marketTitle}
        </Text>
        <Text style={styles.positionOutcome}>
          {position.outcome} @ {Math.round(position.probability || 0)}¢
        </Text>
      </View>
      <View style={styles.positionValue}>
        <Text style={styles.positionAmount}>
          ${(position.currentValue ?? position.amount)?.toFixed(2)}
        </Text>
        <Text
          style={[
            styles.positionPnl,
            (position.pnl ?? 0) >= 0 ? styles.profit : styles.loss,
          ]}
        >
          {(position.pnl ?? 0) >= 0 ? '+' : ''}
          {(position.pnl ?? 0).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const renderFollowingItem = (item) => (
    <View key={item.id} style={styles.followingItem}>
      <Text style={styles.followingName}>{item.name}</Text>
      <Text style={styles.followingCategory}>{item.category}</Text>
    </View>
  );

  const renderWatchlistItem = (item) => (
    <View key={item.id} style={styles.watchlistItem}>
      <Text style={styles.watchlistTitle} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.watchlistCategory}>{item.category}</Text>
    </View>
  );

  const renderEmptyState = (message) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
        <Text style={styles.portfolioValue}>
          ${stats.totalPortfolioValue.toFixed(2)}
        </Text>
        <Text
          style={[
            styles.portfolioChange,
            stats.totalPnl >= 0 ? styles.profitText : styles.lossText,
          ]}
        >
          {stats.totalPnl >= 0 ? '+' : ''}${Math.abs(stats.totalPnl).toFixed(2)} (
          {stats.dailyChangePct >= 0 ? '+' : ''}
          {stats.dailyChangePct.toFixed(2)}%) All Time
        </Text>
      </View>

      <PortfolioChart
        portfolioValue={stats.totalPortfolioValue}
        wallet={wallet}
        markets={markets}
      />

      <View style={styles.spacer} />

      <WalletCard
        balance={wallet.balance}
        onDeposit={() => console.log('Deposit')}
        onWithdraw={() => console.log('Withdraw')}
      />

      <View style={styles.spacer} />

      <CollapsibleSection
        title="Positions"
        icon={<BarChartIcon size={18} color={COLORS.primary} />}
        count={`${stats.enrichedPositions.length} active`}
        defaultExpanded={true}
      >
        {stats.enrichedPositions.length > 0
          ? stats.enrichedPositions.map(renderPositionItem)
          : renderEmptyState('No positions yet. Place trades to see them here.')}
      </CollapsibleSection>

      <View style={styles.spacer} />

      <CollapsibleSection
        title="Following"
        icon={<UsersIcon size={18} color={COLORS.success} />}
        count={`${wallet.following?.length || 0} interests`}
        defaultExpanded={true}
      >
        {wallet.following?.length > 0
          ? wallet.following.map(renderFollowingItem)
          : renderEmptyState('No interests followed yet.')}
      </CollapsibleSection>

      <View style={styles.sectionDivider} />

      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <TargetIcon size={18} color={COLORS.primary} />
          <Text style={styles.statsTitle}>Your Forecasting Stats</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.predictionsCount}</Text>
            <Text style={styles.statLabel}>Predictions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {stats.accuracy}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: COLORS.info }]}>
              {stats.calibration}%
            </Text>
            <Text style={styles.statLabel}>Calibration</Text>
          </View>
        </View>
      </View>

      <View style={styles.recentActivity}>
        <View style={styles.activityHeader}>
          <ActivityIcon size={18} color={COLORS.primary} />
          <Text style={styles.activityTitle}>Recent Activity</Text>
        </View>
        {renderEmptyState(
          'No activity yet. Your trades and resolutions will appear here.',
        )}
      </View>

      <View style={styles.spacer} />

      <CollapsibleSection
        title="Watchlist"
        icon={<StarIcon size={18} color={COLORS.warning} />}
        count={`${wallet.watchlist?.length || 0} markets`}
      >
        {wallet.watchlist?.length > 0
          ? wallet.watchlist.map(renderWatchlistItem)
          : renderEmptyState('No markets watchlisted.')}
      </CollapsibleSection>

      <View style={styles.spacer} />

      <CollapsibleSection
        title="Interests"
        icon={<SparklesIcon size={18} color="#a855f7" />}
        count="View all →"
      >
        {renderEmptyState('Browse interests to personalize your feed.')}
      </CollapsibleSection>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  header: { marginBottom: SPACING.lg },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.display,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  portfolioValue: {
    fontSize: 42,
    fontFamily: FONTS.bodyExtraBold,
    color: COLORS.text,
  },
  portfolioChange: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bodyMedium,
    marginTop: SPACING.xs,
  },
  profitText: { color: COLORS.success },
  lossText: { color: COLORS.danger },
  spacer: { height: SPACING.md },
  sectionDivider: { height: SPACING.xl },
  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statsTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.text,
  },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minWidth: 90,
  },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bodyExtraBold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  recentActivity: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  activityTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.text,
  },
  positionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  positionInfo: { flex: 1 },
  positionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.text,
  },
  positionOutcome: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  positionValue: { alignItems: 'flex-end' },
  positionAmount: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.text,
  },
  positionPnl: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.bodySemiBold },
  profit: { color: COLORS.success },
  loss: { color: COLORS.danger },
  followingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  followingName: { fontSize: FONT_SIZES.md, fontFamily: FONTS.bodyMedium, color: COLORS.text },
  followingCategory: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  watchlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  watchlistTitle: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.text,
    marginRight: SPACING.md,
  },
  watchlistCategory: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.primary,
    textTransform: 'capitalize',
  },
  emptyState: { paddingVertical: SPACING.xl, alignItems: 'center' },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  bottomPadding: { height: 100 },
});

export default DashboardScreen;
