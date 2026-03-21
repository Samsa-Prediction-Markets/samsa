import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, {
  Path, Defs, LinearGradient, Stop, Circle, Line,
  Text as SvgText,
} from 'react-native-svg';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RANGE_OPTIONS = [
  { key: '1D', label: '1D', ms: 24 * 60 * 60 * 1000, points: 24 },
  { key: '1W', label: '1W', ms: 7 * 24 * 60 * 60 * 1000, points: 28 },
  { key: '1M', label: '1M', ms: 30 * 24 * 60 * 60 * 1000, points: 30 },
  { key: '3M', label: '3M', ms: 90 * 24 * 60 * 60 * 1000, points: 36 },
  { key: '1Y', label: '1Y', ms: 365 * 24 * 60 * 60 * 1000, points: 40 },
  { key: 'ALL', label: 'ALL', ms: null, points: 44 },
];

function parseTimestamp(value, fallback) {
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : fallback;
}

function getCurrentPositionValue(position, markets) {
  const market = markets.find((m) => m.id === position.marketId);
  const currentOutcome = market?.outcomes?.find((o) => o.id === position.outcomeId);
  const currentProb = currentOutcome?.probability ?? position.probability ?? 0;
  const buyProb = typeof position.probability === 'number' && position.probability > 0
    ? position.probability
    : 100;
  const shares = (position.amount || 0) / (buyProb / 100);
  return shares * (currentProb / 100);
}

function buildPortfolioHistory({ wallet, markets, portfolioValue, rangeOption }) {
  const now = Date.now();
  const positions = (wallet?.positions || []).map((position) => ({
    ...position,
    amount: typeof position.amount === 'number' ? position.amount : 0,
    openedAt: parseTimestamp(position.createdAt, now),
  }));
  const sortedPositions = [...positions].sort((a, b) => a.openedAt - b.openedAt);
  const initialCapital =
    (typeof wallet?.balance === 'number' ? wallet.balance : 0) +
    sortedPositions.reduce((sum, p) => sum + p.amount, 0);

  const currentValues = new Map(
    sortedPositions.map((p) => [p.id, getCurrentPositionValue(p, markets)]),
  );

  const firstEventAt = sortedPositions[0]?.openedAt || now;
  const startAt = rangeOption.ms
    ? now - rangeOption.ms
    : Math.min(firstEventAt, now - 30 * 24 * 60 * 60 * 1000);
  const safeStart = Math.min(startAt, now);

  const points = [];
  const totalSteps = Math.max(rangeOption.points, 2) - 1;
  for (let i = 0; i <= totalSteps; i++) {
    const t = safeStart + ((now - safeStart) * i) / totalSteps;
    let cash = initialCapital;
    let openValue = 0;
    for (const position of sortedPositions) {
      if (position.openedAt <= t) {
        cash -= position.amount;
        openValue += currentValues.get(position.id) ?? position.amount;
      }
    }
    points.push({
      ts: t,
      value: Math.max(0, cash + openValue),
    });
  }

  if (points.length > 0 && typeof portfolioValue === 'number') {
    points[points.length - 1].value = Math.max(0, portfolioValue);
  }

  return points;
}

function formatTickLabel(ts, rangeKey) {
  const date = new Date(ts);
  if (rangeKey === '1D') {
    return date.toLocaleTimeString('en-US', { hour: 'numeric' });
  }
  if (rangeKey === '1W' || rangeKey === '1M') {
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function PortfolioChart({
  portfolioValue,
  wallet,
  markets = [],
  width,
  height = 220,
}) {
  const chartWidth = width || SCREEN_WIDTH - SPACING.lg * 2;
  const chartHeight = height;
  const pad = { top: 20, right: 16, bottom: 28, left: 16 };
  const [selectedRange, setSelectedRange] = useState('1M');

  const rangeOption = RANGE_OPTIONS.find((item) => item.key === selectedRange) || RANGE_OPTIONS[2];
  const points = useMemo(
    () =>
      buildPortfolioHistory({
        wallet,
        markets,
        portfolioValue,
        rangeOption,
      }),
    [wallet, markets, portfolioValue, rangeOption],
  );
  const data = points.map((point) => point.value);

  const innerW = chartWidth - pad.left - pad.right;
  const innerH = chartHeight - pad.top - pad.bottom;

  const minVal = Math.min(...data) * 0.98;
  const maxVal = Math.max(...data) * 1.02;
  const range = maxVal - minVal || 1;

  const x = (i) => pad.left + (i / (data.length - 1)) * innerW;
  const y = (v) => pad.top + (1 - (v - minVal) / range) * innerH;

  const linePath = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(v).toFixed(2)}`)
    .join(' ');

  const areaPath = `${linePath} L${x(data.length - 1).toFixed(2)},${(pad.top + innerH).toFixed(2)} L${x(0).toFixed(2)},${(pad.top + innerH).toFixed(2)} Z`;

  const lastX = x(data.length - 1);
  const lastY = y(data[data.length - 1]);
  const isPositive = data[data.length - 1] >= data[0];
  const lineColor = isPositive ? COLORS.success : COLORS.danger;

  const labelIndices = [0, 1, 2, 3];

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {RANGE_OPTIONS.map((tab) => {
          const active = selectedRange === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setSelectedRange(tab.key)}
              style={[styles.tabButton, active && styles.activeTabButton]}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.25" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0.01" />
          </LinearGradient>
        </Defs>

        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <Line
            key={i}
            x1={pad.left}
            y1={pad.top + innerH * pct}
            x2={chartWidth - pad.right}
            y2={pad.top + innerH * pct}
            stroke={COLORS.border}
            strokeWidth={0.5}
            opacity={0.4}
          />
        ))}

        <Path d={areaPath} fill="url(#areaGrad)" />
        <Path d={linePath} stroke={lineColor} strokeWidth={2} fill="none" />

        <Circle cx={lastX} cy={lastY} r={4} fill={lineColor} />
        <Circle cx={lastX} cy={lastY} r={8} fill={lineColor} opacity={0.2} />

        {labelIndices.map((idx) => {
          const lx = pad.left + (idx / (labelIndices.length - 1)) * innerW;
          const pointIndex = Math.round((idx / (labelIndices.length - 1)) * (points.length - 1));
          const label = formatTickLabel(points[pointIndex]?.ts || Date.now(), selectedRange);
          return (
            <SvgText
              key={`${selectedRange}-${idx}`}
              x={lx}
              y={chartHeight - 6}
              fill={COLORS.textMuted}
              fontSize={10}
              fontFamily={FONTS.body}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  tabButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.surfaceLight,
  },
  activeTabButton: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  tabLabel: {
    color: COLORS.textMuted,
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
  },
  activeTabLabel: {
    color: COLORS.primary,
  },
});
