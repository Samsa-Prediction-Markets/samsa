import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  COLORS,
  CATEGORY_COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  FONTS,
} from '../constants/theme';

function normalizeOutcomeTitle(title) {
  const lower = title.toLowerCase().trim();
  if (lower === 'yes' || lower.startsWith('yes,') || lower.startsWith('yes '))
    return 'Yes';
  if (lower === 'no' || lower.startsWith('no,') || lower.startsWith('no '))
    return 'No';
  return title;
}

function isBinaryMarket(market) {
  if (market.outcomes?.length !== 2) return false;
  const titles = market.outcomes.map((o) =>
    normalizeOutcomeTitle(o.title).toLowerCase(),
  );
  return titles.includes('yes') && titles.includes('no');
}

export function MarketCard({ market, onPress, onOutcomePress, compact = false }) {
  const isBinary = isBinaryMarket(market);
  const categoryColor = CATEGORY_COLORS[market.category] || ['#6366f1', '#8b5cf6'];
  const formatProb = (value) =>
    `${Math.round(typeof value === 'number' ? value : 0)}¢`;
  const formatMoney = (value) =>
    `$${Math.round(typeof value === 'number' ? value : 0).toLocaleString()}`;
  const formatCount = (value) =>
    `${Math.round(typeof value === 'number' ? value : 0)}`;
  const formatCloseDate = market.closeDate && market.closeDate !== 'TBD' ? market.closeDate : '--';

  const renderOutcomes = () => {
    if (isBinary) {
      return (
        <View style={styles.binaryOutcomes}>
          {market.outcomes.slice(0, 2).map((outcome, idx) => {
            const isYes = idx === 0;
            return (
              <TouchableOpacity
                key={outcome.id}
                style={[
                  styles.outcomeButton,
                  isYes ? styles.yesButton : styles.noButton,
                ]}
                onPress={() => onOutcomePress?.(market.id, outcome.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.outcomeTitle}>
                  {normalizeOutcomeTitle(outcome.title)}
                </Text>
                <Text
                  style={[
                    styles.outcomeProb,
                    isYes ? styles.yesProb : styles.noProb,
                  ]}
                >
                  {formatProb(outcome.probability)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    const displayOutcomes = market.outcomes.slice(0, 4);
    const multiColors = ['#3b82f6', '#a855f7', '#f59e0b', '#06b6d4'];
    return (
      <View style={styles.multiOutcomes}>
        {displayOutcomes.map((outcome, idx) => (
          <TouchableOpacity
            key={outcome.id}
            style={[
              styles.multiOutcomeButton,
              { borderColor: multiColors[idx] + '80' },
            ]}
            onPress={() => onOutcomePress?.(market.id, outcome.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.outcomeTitle} numberOfLines={1}>
              {normalizeOutcomeTitle(outcome.title)}
            </Text>
            <Text style={[styles.outcomeProb, { color: multiColors[idx] }]}>
              {formatProb(outcome.probability)}
            </Text>
          </TouchableOpacity>
        ))}
        {market.outcomes.length > 4 && (
          <Text style={styles.moreOptions}>
            +{market.outcomes.length - 4} more
          </Text>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.compactCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: categoryColor[0] + '30' },
          ]}
        >
          <Text style={[styles.categoryText, { color: categoryColor[0] }]}>
            {market.category}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <View style={styles.liveDot} />
          <Text style={styles.status}>Live</Text>
        </View>
      </View>
      <View style={styles.trendHeader}>
        <Text style={styles.trendLabel}>30d Trend</Text>
        <Text style={styles.trendValue}>
          {formatProb(market.outcomes?.[0]?.probability)}
        </Text>
      </View>
      <View style={styles.trendLine} />
      <Text style={styles.title} numberOfLines={compact ? 2 : 3}>
        {market.title}
      </Text>
      {!compact && (
        <Text style={styles.description} numberOfLines={2}>
          {market.description}
        </Text>
      )}
      {renderOutcomes()}
      <View style={styles.footer}>
        <Text style={styles.stat}>Vol {formatMoney(market.volume)}</Text>
        <Text style={styles.stat}>Traders {formatCount(market.traders)}</Text>
        <Text style={styles.closeDate}>Closes {formatCloseDate}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  compactCard: { padding: SPACING.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  categoryText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bodySemiBold,
    textTransform: 'capitalize',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  status: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontFamily: FONTS.bodyMedium,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  trendLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
  },
  trendValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyMedium,
  },
  trendLine: {
    height: 1,
    borderRadius: 1,
    backgroundColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
    opacity: 0.65,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  binaryOutcomes: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  outcomeButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  yesButton: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success + '50',
  },
  noButton: {
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.danger + '50',
  },
  outcomeTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.text,
  },
  outcomeProb: { fontSize: FONT_SIZES.lg, fontFamily: FONTS.bodySemiBold, marginTop: 4 },
  yesProb: { color: COLORS.success },
  noProb: { color: COLORS.danger },
  multiOutcomes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  multiOutcomeButton: {
    width: '48%',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  moreOptions: {
    width: '100%',
    textAlign: 'center',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.bodyMedium, color: COLORS.textMuted },
  closeDate: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.bodyMedium, color: COLORS.primary },
});

export default MarketCard;
