import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import {
  COLORS,
  CATEGORY_COLORS,
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  FONTS,
} from '../constants/theme';
import { StarIcon, ChevronRightIcon } from './Icons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

function normalizeOutcomeTitle(title) {
  const lower = title.toLowerCase().trim();
  if (lower === 'yes' || lower.startsWith('yes,')) return 'Yes';
  if (lower === 'no' || lower.startsWith('no,')) return 'No';
  return title;
}

function isBinaryMarket(market) {
  if (market.outcomes?.length !== 2) return false;
  const titles = market.outcomes.map((o) =>
    normalizeOutcomeTitle(o.title).toLowerCase(),
  );
  return titles.includes('yes') && titles.includes('no');
}

export function ReelMarketCard({ market, onOutcomePress, onViewDetails }) {
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
              styles.multiButton,
              {
                borderColor: multiColors[idx] + '80',
                backgroundColor: multiColors[idx] + '20',
              },
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri:
            market.image_url ||
            'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
        }}
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.overlay} />
        <View style={styles.content}>
          <View style={styles.topSection}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: categoryColor[0] },
              ]}
            >
              <Text style={styles.categoryText}>{market.category}</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          <View style={styles.mainContent}>
            <Text style={styles.title}>{market.title}</Text>
            <Text style={styles.description} numberOfLines={3}>
              {market.description}
            </Text>
          </View>
          <View style={styles.bottomSection}>
            {renderOutcomes()}
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatMoney(market.volume)}</Text>
                <Text style={styles.statLabel}>Volume</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCount(market.traders)}</Text>
                <Text style={styles.statLabel}>Traders</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCloseDate}</Text>
                <Text style={styles.statLabel}>Closes</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={onViewDetails}
              activeOpacity={0.8}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
              <ChevronRightIcon size={18} color={COLORS.background} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.sideActions}>
          <TouchableOpacity style={styles.sideButton}>
            <StarIcon size={26} color={COLORS.primary} />
            <Text style={styles.sideLabel}>Save</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: SCREEN_HEIGHT - 120, width: SCREEN_WIDTH },
  background: { flex: 1, justifyContent: 'flex-end' },
  backgroundImage: { opacity: 0.4 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.xl,
    paddingRight: 70,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bodyBold,
    textTransform: 'capitalize',
  },
  liveBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  liveText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bodySemiBold,
  },
  mainContent: { flex: 1, justifyContent: 'center' },
  title: {
    fontSize: 28,
    fontFamily: FONTS.display,
    color: COLORS.text,
    marginBottom: SPACING.md,
    lineHeight: 36,
  },
  description: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  bottomSection: { paddingBottom: SPACING.xl },
  binaryOutcomes: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  outcomeButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
  },
  yesButton: {
    backgroundColor: COLORS.successLight,
    borderColor: COLORS.success,
  },
  noButton: {
    backgroundColor: COLORS.dangerLight,
    borderColor: COLORS.danger,
  },
  outcomeTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.text,
  },
  outcomeProb: { fontSize: 28, fontFamily: FONTS.bodySemiBold, marginTop: SPACING.sm },
  yesProb: { color: COLORS.success },
  noProb: { color: COLORS.danger },
  multiOutcomes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  multiButton: {
    width: '48%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  viewDetailsButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  viewDetailsText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bodyBold,
  },
  sideActions: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 150,
    alignItems: 'center',
    gap: SPACING.xl,
  },
  sideButton: { alignItems: 'center' },
  sideLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default ReelMarketCard;
