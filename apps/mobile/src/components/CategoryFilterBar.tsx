import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Text } from './AppText';
import {
  LucideIcon,
  LayoutGrid,
  Music,
  Zap,
  Trophy,
  Theater,
  Landmark,
  GraduationCap,
  Sparkles,
} from 'lucide-react-native';
import { eventsApi } from '@ticketshield/api-client';
import { theme } from '../theme';
import { styles } from './CategoryFilterBar.styles';

export interface CategoryItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const CATEGORY_META: Record<string, { label: string; icon: LucideIcon }> = {
  ALL: { label: 'All', icon: LayoutGrid },
  CONCERT: { label: 'Concerts', icon: Music },
  FESTIVAL: { label: 'Festivals', icon: Zap },
  SPORTS: { label: 'Sports', icon: Trophy },
  THEATER: { label: 'Theater', icon: Theater },
  EXHIBITION: { label: 'Exhibitions', icon: Landmark },
  WORKSHOP: { label: 'Workshops', icon: GraduationCap },
};

function resolveCategoryItem(categoryId: string): CategoryItem {
  const upper = categoryId.toUpperCase();
  if (CATEGORY_META[upper]) {
    return {
      id: upper,
      label: CATEGORY_META[upper].label,
      icon: CATEGORY_META[upper].icon,
    };
  }
  const formatted =
    categoryId.charAt(0).toUpperCase() + categoryId.slice(1).toLowerCase();
  return {
    id: upper,
    label: formatted,
    icon: Sparkles,
  };
}

const FALLBACK_CATEGORIES = [
  'ALL',
  'CONCERT',
  'FESTIVAL',
  'SPORTS',
  'THEATER',
  'EXHIBITION',
];

interface CategoryFilterBarProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  categories?: string[];
  prependNode?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function CategoryFilterBar({
  selectedCategory,
  onSelectCategory,
  categories: initialCategories,
  prependNode,
  style,
}: CategoryFilterBarProps) {
  const [categoryList, setCategoryList] = useState<string[]>(
    initialCategories && initialCategories.length > 0
      ? initialCategories
      : FALLBACK_CATEGORIES
  );

  useEffect(() => {
    let mounted = true;
    if (!initialCategories || initialCategories.length === 0) {
      eventsApi
        .getCategories()
        .then((cats) => {
          if (mounted && Array.isArray(cats) && cats.length > 0) {
            setCategoryList(cats);
          }
        })
        .catch(() => {
          // Keep fallback on network error
        });
    } else {
      setCategoryList(initialCategories);
    }
    return () => {
      mounted = false;
    };
  }, [initialCategories]);

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {prependNode}

        {categoryList.map((catId) => {
          const item = resolveCategoryItem(catId);
          const Icon = item.icon;
          const isActive =
            selectedCategory.toUpperCase() === item.id.toUpperCase();
          const iconColor = isActive
            ? theme.colors.onPrimary
            : theme.colors.textMuted;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onSelectCategory(item.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${item.label}`}
              accessibilityState={{ selected: isActive }}
            >
              <Icon size={14} color={iconColor} />
              <Text
                style={[styles.pillText, isActive && styles.pillTextActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
