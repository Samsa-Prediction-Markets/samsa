import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../constants/theme';
import {
  SettingsIcon,
  MailIcon,
  LockIcon,
  ShieldIcon,
  EyeIcon,
  PauseIcon,
  MoonIcon,
  BellRingIcon,
  GlobeIcon,
  DollarSignIcon,
  TrashIcon,
  ChevronRightIcon,
} from '../components/Icons';

export function SettingsScreen() {
  const [observeMode, setObserveMode] = useState(false);
  const [tradingPaused, setTradingPaused] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const renderSettingItem = ({ IconComponent, title, subtitle, onPress, rightElement }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIconWrap}>
          <IconComponent size={20} color={COLORS.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || <ChevronRightIcon size={18} color={COLORS.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <SettingsIcon size={24} color={COLORS.primary} />
          <Text style={styles.title}>Settings</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionContent}>
          {renderSettingItem({
            IconComponent: MailIcon,
            title: 'Email',
            subtitle: 'demo@samsa.com',
          })}
          {renderSettingItem({
            IconComponent: LockIcon,
            title: 'Password',
            subtitle: '••••••••',
          })}
          {renderSettingItem({
            IconComponent: ShieldIcon,
            title: 'Two-Factor Authentication',
            subtitle: 'Add extra security',
            rightElement: <Text style={styles.settingValue}>Off</Text>,
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Management</Text>
        <View style={styles.sectionContent}>
          {renderSettingItem({
            IconComponent: EyeIcon,
            title: 'Observe-Only Mode',
            subtitle: 'View markets without trading',
            rightElement: (
              <Switch
                value={observeMode}
                onValueChange={setObserveMode}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={observeMode ? COLORS.primary : COLORS.textMuted}
              />
            ),
          })}
          {renderSettingItem({
            IconComponent: PauseIcon,
            title: 'Pause Trading',
            subtitle: 'Temporarily disable position entry',
            rightElement: (
              <Switch
                value={tradingPaused}
                onValueChange={setTradingPaused}
                trackColor={{ false: COLORS.border, true: COLORS.dangerLight }}
                thumbColor={tradingPaused ? COLORS.danger : COLORS.textMuted}
              />
            ),
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionContent}>
          {renderSettingItem({
            IconComponent: MoonIcon,
            title: 'Dark Mode',
            subtitle: 'Use dark theme',
            rightElement: <Text style={styles.enabledValue}>Enabled</Text>,
          })}
          {renderSettingItem({
            IconComponent: BellRingIcon,
            title: 'Notifications',
            subtitle: 'Push notifications',
            rightElement: (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={notifications ? COLORS.primary : COLORS.textMuted}
              />
            ),
          })}
          {renderSettingItem({
            IconComponent: GlobeIcon,
            title: 'Language',
            subtitle: 'Display language',
            rightElement: <Text style={styles.settingValue}>English</Text>,
          })}
          {renderSettingItem({
            IconComponent: DollarSignIcon,
            title: 'Currency',
            subtitle: 'Default currency',
            rightElement: <Text style={styles.settingValue}>USD</Text>,
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Samsa</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>
            Samsa is a prediction market trading platform designed to help users
            express beliefs about future events through probability-based
            positions.
          </Text>
          <Text style={styles.disclaimer}>
            Market probabilities reflect collective beliefs, not certainty. Past
            performance does not guarantee future results.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
        <View style={styles.dangerContent}>
          {renderSettingItem({
            IconComponent: TrashIcon,
            title: 'Delete Account',
            subtitle: 'Permanently delete your account',
            rightElement: (
              <TouchableOpacity style={styles.dangerButton}>
                <Text style={styles.dangerButtonText}>Delete</Text>
              </TouchableOpacity>
            ),
          })}
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg },
  header: { marginBottom: SPACING.xl },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontFamily: FONTS.display,
    color: COLORS.text,
  },
  section: { marginBottom: SPACING.xl },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  sectionContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingText: { flex: 1 },
  settingTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.text,
  },
  settingSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  settingValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
  },
  enabledValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.primary,
  },
  aboutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  aboutText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  disclaimer: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  dangerTitle: { color: COLORS.danger },
  dangerContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
    overflow: 'hidden',
  },
  dangerButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  dangerButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bodySemiBold,
  },
  bottomPadding: { height: 100 },
});

export default SettingsScreen;
