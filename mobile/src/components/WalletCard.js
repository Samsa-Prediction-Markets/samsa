import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import { WalletIcon, PlusIcon, ArrowDownIcon } from './Icons';

export function WalletCard({ balance, onDeposit, onWithdraw }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <WalletIcon size={20} color={COLORS.primary} />
          <Text style={styles.label}>Buying Power</Text>
        </View>
        <Text style={styles.balance}>${balance.toFixed(2)}</Text>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.depositButton} onPress={onDeposit} activeOpacity={0.8}>
          <PlusIcon size={16} color={COLORS.background} strokeWidth={2.5} />
          <Text style={styles.depositText}>Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.withdrawButton} onPress={onWithdraw} activeOpacity={0.8}>
          <ArrowDownIcon size={16} color={COLORS.text} strokeWidth={2} />
          <Text style={styles.withdrawText}>Withdraw</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontFamily: FONTS.bodySemiBold,
  },
  balance: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.bodyExtraBold,
    color: COLORS.primary,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  depositButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  depositText: {
    color: COLORS.background,
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.md,
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  withdrawText: {
    color: COLORS.text,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
  },
});

export default WalletCard;
