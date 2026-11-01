import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PurchasedTicketDto } from '@ticketshield/types';

const KEY_PREFIX = 'ticketshield.tickets.v1.';

export interface SavedTickets {
  savedAt: string;
  tickets: PurchasedTicketDto[];
}

const keyFor = (userId: string): string => `${KEY_PREFIX}${userId}`;

export async function saveTickets(
  userId: string,
  tickets: PurchasedTicketDto[],
  now: Date = new Date()
): Promise<void> {
  try {
    const value: SavedTickets = { savedAt: now.toISOString(), tickets };
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(value));
  } catch (err) {
    // Không lưu được thì vé vừa tải vẫn phải hiện bình thường.
    console.warn('[TicketCache] Unable to save tickets:', err);
  }
}

export async function loadTickets(userId: string): Promise<SavedTickets | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedTickets;
    if (typeof parsed?.savedAt !== 'string' || !Array.isArray(parsed?.tickets)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearAllTickets(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(KEY_PREFIX)));
  } catch (err) {
    console.warn('[TicketCache] Unable to clear tickets:', err);
  }
}
