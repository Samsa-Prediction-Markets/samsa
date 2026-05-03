import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Rect, Polygon } from 'react-native-svg';

const Icon = ({ size = 24, color = '#d4af37', strokeWidth = 1.8, fill = 'none', children }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Svg>
);

export const BarChartIcon = (props) => (
  <Icon {...props}>
    <Path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <Path d="M7 16v-3" />
    <Path d="M11 16V8" />
    <Path d="M15 16v-5" />
    <Path d="M19 16V4" />
  </Icon>
);

export const SearchIcon = (props) => (
  <Icon {...props}>
    <Circle cx="11" cy="11" r="8" />
    <Path d="M21 21l-4.35-4.35" />
  </Icon>
);

export const CompassIcon = (props) => (
  <Icon {...props}>
    <Circle cx="12" cy="12" r="10" />
    <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" stroke="none" fill={props.color || '#d4af37'} />
  </Icon>
);

export const NewspaperIcon = (props) => (
  <Icon {...props}>
    <Path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z" />
    <Path d="M4 22a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <Path d="M18 14h-8" />
    <Path d="M15 18h-5" />
    <Path d="M10 6h8v4h-8z" />
  </Icon>
);

export const SettingsIcon = (props) => (
  <Icon {...props}>
    <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <Circle cx="12" cy="12" r="3" />
  </Icon>
);

export const BellIcon = (props) => (
  <Icon {...props}>
    <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icon>
);

export const TrendingUpIcon = (props) => (
  <Icon {...props}>
    <Polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <Polyline points="16 7 22 7 22 13" />
  </Icon>
);

export const WalletIcon = (props) => (
  <Icon {...props}>
    <Rect x="2" y="6" width="20" height="14" rx="2" />
    <Path d="M2 10h20" />
    <Circle cx="16" cy="14" r="1" fill={props.color || '#d4af37'} stroke="none" />
  </Icon>
);

export const UsersIcon = (props) => (
  <Icon {...props}>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

export const StarIcon = ({ filled, ...props }) => (
  <Icon {...props} fill={filled ? (props.color || '#d4af37') : 'none'}>
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Icon>
);

export const SparklesIcon = (props) => (
  <Icon {...props}>
    <Path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <Path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z" />
  </Icon>
);

export const ActivityIcon = (props) => (
  <Icon {...props}>
    <Polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </Icon>
);

export const TargetIcon = (props) => (
  <Icon {...props}>
    <Circle cx="12" cy="12" r="10" />
    <Circle cx="12" cy="12" r="6" />
    <Circle cx="12" cy="12" r="2" />
  </Icon>
);

export const PlusIcon = (props) => (
  <Icon {...props}>
    <Path d="M12 5v14" />
    <Path d="M5 12h14" />
  </Icon>
);

export const ArrowDownIcon = (props) => (
  <Icon {...props}>
    <Path d="M12 5v14" />
    <Path d="M19 12l-7 7-7-7" />
  </Icon>
);

export const MailIcon = (props) => (
  <Icon {...props}>
    <Rect x="2" y="4" width="20" height="16" rx="2" />
    <Path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Icon>
);

export const LockIcon = (props) => (
  <Icon {...props}>
    <Rect x="3" y="11" width="18" height="11" rx="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);

export const ShieldIcon = (props) => (
  <Icon {...props}>
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Icon>
);

export const EyeIcon = (props) => (
  <Icon {...props}>
    <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <Circle cx="12" cy="12" r="3" />
  </Icon>
);

export const PauseIcon = (props) => (
  <Icon {...props}>
    <Rect x="6" y="4" width="4" height="16" rx="1" />
    <Rect x="14" y="4" width="4" height="16" rx="1" />
  </Icon>
);

export const MoonIcon = (props) => (
  <Icon {...props}>
    <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
  </Icon>
);

export const GlobeIcon = (props) => (
  <Icon {...props}>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <Path d="M2 12h20" />
  </Icon>
);

export const DollarSignIcon = (props) => (
  <Icon {...props}>
    <Path d="M12 2v20" />
    <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Icon>
);

export const TrashIcon = (props) => (
  <Icon {...props}>
    <Path d="M3 6h18" />
    <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </Icon>
);

export const ChevronRightIcon = (props) => (
  <Icon {...props}>
    <Path d="M9 18l6-6-6-6" />
  </Icon>
);

export const ChevronDownIcon = (props) => (
  <Icon {...props}>
    <Path d="M6 9l6 6 6-6" />
  </Icon>
);

export const XIcon = (props) => (
  <Icon {...props}>
    <Path d="M18 6L6 18" />
    <Path d="M6 6l12 12" />
  </Icon>
);

export const FlameIcon = (props) => (
  <Icon {...props}>
    <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </Icon>
);

export const LineChartIcon = (props) => (
  <Icon {...props}>
    <Path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <Path d="M7 14l4-4 4 4 6-6" />
  </Icon>
);

export const BellRingIcon = (props) => (
  <Icon {...props}>
    <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    <Path d="M4 2C2.8 3.7 2 5.7 2 8" />
    <Path d="M22 8c0-2.3-.8-4.3-2-6" />
  </Icon>
);

export const CircleDotIcon = (props) => (
  <Icon {...props}>
    <Circle cx="12" cy="12" r="10" />
    <Circle cx="12" cy="12" r="1" fill={props.color || '#d4af37'} stroke="none" />
  </Icon>
);
