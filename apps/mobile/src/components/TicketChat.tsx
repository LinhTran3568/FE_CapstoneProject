import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, BackHandler, Keyboard, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { ArrowRight, RotateCcw, Send, Sparkles, X } from 'lucide-react-native';
import { copilotApi } from '@ticketshield/api-client';
import type { CopilotChatMessage, CopilotTicketItemDto } from '@ticketshield/types';
import { Text } from './AppText';
import { theme } from '../theme';
import { formatPrice } from '../utils/format';

type Message = CopilotChatMessage & { tickets?: CopilotTicketItemDto[] };

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm Ticky, your smart ticket assistant. I can help you find event tickets by price, or verify resale price caps before listing.",
};
const PROMPTS = ['Find tickets under 1M', 'Hot events this week', 'Check VIP price cap'];
const { colors } = theme;
const PANEL_BACKGROUND = '#0D1117';

function TickyMascot({ active = false }: { active?: boolean }) {
  return (
    <View style={[styles.mascotShadow, active && styles.mascotActive]}>
      <View style={styles.mascotArmLeft} />
      <View style={styles.mascotArmRight} />
      <View style={styles.mascotBody}>
        <View style={[styles.ticketNotch, styles.ticketNotchLeft]} />
        <View style={[styles.ticketNotch, styles.ticketNotchRight]} />
        <View style={styles.mascotFace}>
          <View style={styles.mascotEye} />
          <View style={styles.mascotEye} />
        </View>
        <Text style={styles.mascotSmile}>⌣</Text>
        <View style={styles.mascotCheeks}>
          <View style={styles.mascotCheek} />
          <View style={styles.mascotCheek} />
        </View>
      </View>
      <View style={styles.mascotFeet}>
        <View style={styles.mascotFoot} />
        <View style={styles.mascotFoot} />
      </View>
    </View>
  );
}

export function TicketChat() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [typing, setTyping] = useState(Keyboard.isVisible());
  const pending = useRef(false);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => setTyping(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setTyping(false));
    return () => { shown.remove(); hidden.remove(); };
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => listener.remove();
  }, [open]);

  const launcherBottom = typing ? 8 : 62 + insets.bottom;
  const panelHeight = Math.max(360, Math.min(540, screenHeight - insets.top - insets.bottom - 92));
  const panelWidth = Math.min(390, screenWidth - 24);

  function resetChat() {
    setMessages([INITIAL_MESSAGE]);
    setInput('');
    setFailed(false);
  }

  async function send(value: string) {
    const query = value.trim();
    if (!query || pending.current) return;
    const previousMessages = messages;
    const history = previousMessages.map(({ role, content }) => ({ role, content }));
    pending.current = true;
    setBusy(true);
    setFailed(false);
    setInput('');
    setMessages([...previousMessages, { role: 'user', content: query }]);
    try {
      const result = await copilotApi.chat({ message: query, history, conversationHistory: history, stream: false });
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: result.reply, tickets: result.suggestedTickets },
      ]);
    } catch {
      setMessages(previousMessages);
      setInput(query);
      setFailed(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  function openTicket(ticket: CopilotTicketItemDto) {
    setOpen(false);
    router.navigate({
      pathname: '/(tabs)/marketplace',
      params: {
        suggestedEvent: ticket.eventId, eventQuery: ticket.eventName,
        suggestedId: ticket.listingId, selection: String(Date.now()),
      },
    });
  }

  if (!open) {
    return (
      <View pointerEvents="box-none" style={[styles.launcherDock, { bottom: launcherBottom }]}>
        {!bubbleDismissed && (
          <View style={styles.speechBubble}>
            <Pressable accessibilityRole="button" accessibilityLabel="Ask Ticky to find tickets"
              onPress={() => setOpen(true)} style={styles.speechContent}>
              <View style={styles.pulseDot} />
              <Text style={styles.speechText} numberOfLines={1}>Ask Ticky to find tickets!</Text>
              <Sparkles size={14} color={colors.primary} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Dismiss Ticky hint" hitSlop={10}
              onPress={() => setBubbleDismissed(true)} style={styles.dismissButton}>
              <X size={13} color="#7F8792" />
            </Pressable>
            <View style={styles.bubbleTail} />
          </View>
        )}
        <Pressable accessibilityRole="button" accessibilityLabel="Chat with Ticky"
          onPress={() => setOpen(true)} style={({ pressed }) => [styles.mascotButton, pressed && styles.pressed]}>
          <TickyMascot />
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable accessible={false} style={styles.backdrop} onPress={() => setOpen(false)} />
      <View pointerEvents="box-none" style={[
        styles.panelAnchor,
        { paddingTop: insets.top + 8, paddingBottom: 62 + insets.bottom },
      ]}>
        <View style={[styles.panel, { width: panelWidth, height: panelHeight }]}>
          <View style={styles.header}>
            <View style={styles.headerIdentity}>
              <View style={styles.headerIcon}><Sparkles size={15} color={colors.primary} /></View>
              <View>
                <Text style={styles.title}>Ticky</Text>
                <Text style={styles.subtitle}>{busy ? 'Thinking…' : 'Smart ticket assistant'}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <Pressable accessibilityLabel="Reset chat" accessibilityRole="button" disabled={busy}
                onPress={resetChat} style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
                <RotateCcw size={17} color={busy ? '#59616D' : '#A3A8B3'} />
              </Pressable>
              <Pressable accessibilityLabel="Close chat" accessibilityRole="button" onPress={() => setOpen(false)}
                style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
                <X size={19} color="#A3A8B3" />
              </Pressable>
            </View>
          </View>

          <ScrollView ref={scroll} style={styles.threadScroll} contentContainerStyle={styles.thread}
            keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
            {messages.map((message, index) => (
              <View key={`${message.role}-${index}`}
                style={message.role === 'user' ? styles.userMessageGroup : styles.assistantMessageGroup}>
                <Text selectable style={[
                  styles.message, message.role === 'user' ? styles.question : styles.answer,
                ]}>{message.content}</Text>
                {!!message.tickets?.length && (
                  <View style={styles.ticketResults}>
                    <View style={styles.resultsHeading}>
                      <Text style={styles.resultsLabel}>Matching tickets</Text>
                      <Text style={styles.resultsHint}>Tap to view</Text>
                    </View>
                    {message.tickets.map((ticket) => (
                      <Pressable key={ticket.listingId} accessibilityRole="button"
                        accessibilityLabel={`View ${ticket.eventName}`} onPress={() => openTicket(ticket)}
                        style={({ pressed }) => [styles.ticketCard, pressed && styles.ticketCardPressed]}>
                        <View style={styles.ticketInfo}>
                          <Text style={styles.ticketName} numberOfLines={1}>{ticket.eventName}</Text>
                          <Text style={styles.ticketMeta} numberOfLines={1}>
                            {ticket.tierName}{ticket.seatZone ? ` • Zone ${ticket.seatZone}` : ''}
                          </Text>
                          <View style={styles.priceRow}>
                            <Text style={styles.ticketPrice}>{formatPrice(ticket.resalePrice)}</Text>
                            {ticket.discountPercentage > 0 && <Text style={styles.discount}>-{ticket.discountPercentage}%</Text>}
                          </View>
                        </View>
                        <View style={styles.ticketArrow}><ArrowRight size={16} color="#D8DCE2" /></View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {busy && (
              <View style={[styles.message, styles.answer, styles.typingBubble]}>
                <ActivityIndicator accessibilityLabel="Ticky is thinking" size="small" color={colors.primary} />
                <Text style={styles.typingText}>Ticky is typing…</Text>
              </View>
            )}
            {failed && <Text accessibilityLiveRegion="polite" style={styles.errorMessage}>
              Ticky is busy right now. Tap send to try again.
            </Text>}
          </ScrollView>

          {messages.length <= 2 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
              style={styles.promptsScroll} contentContainerStyle={styles.prompts}>
              {PROMPTS.map((prompt) => (
                <Pressable key={prompt} accessibilityRole="button" accessibilityLabel={prompt} disabled={busy}
                  onPress={() => send(prompt)} style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
                  <Text style={styles.chipText} numberOfLines={1}>{prompt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <View style={styles.composerWrap}>
            <View style={styles.composer}>
              <TextInput accessibilityLabel="Message Ticky" placeholder="Ask a question or search for tickets..."
                placeholderTextColor="#69717D" style={styles.input} editable={!busy} value={input}
                onChangeText={setInput} returnKeyType="send" onSubmitEditing={() => send(input)} />
              <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={busy || !input.trim()}
                onPress={() => send(input)} style={({ pressed }) => [
                  styles.sendButton, (!input.trim() || busy) && styles.sendButtonDisabled, pressed && styles.pressed,
                ]}>
                {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Send color="#FFFFFF" size={18} />}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  launcherDock: { position: 'absolute', left: 0, width: 280, height: 98, zIndex: 40 },
  mascotButton: { position: 'absolute', left: 5, bottom: 0, width: 76, height: 86, alignItems: 'center', justifyContent: 'flex-end' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  mascotShadow: { width: 70, height: 82, alignItems: 'center', justifyContent: 'flex-end', shadowColor: '#000', shadowOpacity: 0.65, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  mascotActive: { transform: [{ scale: 1.04 }] },
  mascotBody: { width: 46, height: 64, borderRadius: 7, borderWidth: 2, borderColor: '#202630', backgroundColor: colors.primary, alignItems: 'center', paddingTop: 16, overflow: 'visible' },
  ticketNotch: { position: 'absolute', top: 30, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.background },
  ticketNotchLeft: { left: -6 }, ticketNotchRight: { right: -6 },
  mascotFace: { flexDirection: 'row', gap: 13 },
  mascotEye: { width: 4, height: 5, borderRadius: 2, backgroundColor: '#16202A' },
  mascotSmile: { color: '#16202A', fontSize: 23, lineHeight: 24, marginTop: -2, fontWeight: '800' },
  mascotCheeks: { position: 'absolute', top: 31, flexDirection: 'row', gap: 21 },
  mascotCheek: { width: 4, height: 2, borderRadius: 2, backgroundColor: '#E64B37' },
  mascotArmLeft: { position: 'absolute', left: 4, bottom: 25, width: 20, height: 6, borderRadius: 4, backgroundColor: colors.primary, transform: [{ rotate: '-25deg' }] },
  mascotArmRight: { position: 'absolute', right: 2, bottom: 37, width: 21, height: 6, borderRadius: 4, backgroundColor: colors.primary, transform: [{ rotate: '-45deg' }] },
  mascotFeet: { flexDirection: 'row', gap: 20, marginTop: -1 },
  mascotFoot: { width: 13, height: 5, borderRadius: 3, backgroundColor: '#202630' },
  speechBubble: { position: 'absolute', left: 55, bottom: 54, height: 36, maxWidth: 220, flexDirection: 'row', alignItems: 'center', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(13,17,23,0.98)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  speechContent: { height: '100%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 11, paddingRight: 31 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  speechText: { color: '#F5F5F2', fontSize: 10, fontWeight: '600', flexShrink: 1 },
  dismissButton: { position: 'absolute', right: 6, width: 24, height: 30, alignItems: 'center', justifyContent: 'center' },
  bubbleTail: { position: 'absolute', left: 17, bottom: -5, width: 10, height: 10, backgroundColor: PANEL_BACKGROUND, borderLeftWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.14)', transform: [{ rotate: '-45deg' }] },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 60 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  panelAnchor: { flex: 1, alignItems: 'flex-start', justifyContent: 'flex-end', paddingHorizontal: 12 },
  panel: { maxHeight: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', borderRadius: 20, overflow: 'hidden', backgroundColor: PANEL_BACKGROUND, shadowColor: '#000', shadowOpacity: 0.65, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 18 },
  header: { minHeight: 58, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.10)', backgroundColor: '#10151C' },
  headerIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,107,74,0.13)', borderWidth: 1, borderColor: 'rgba(255,107,74,0.35)' },
  title: { color: '#FFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  subtitle: { color: '#7F8792', fontSize: 10, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  action: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  actionPressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
  threadScroll: { flex: 1 }, thread: { padding: 14, gap: 12 },
  userMessageGroup: { alignItems: 'flex-end' }, assistantMessageGroup: { alignItems: 'flex-start' },
  message: { maxWidth: '88%', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 17, fontSize: 13, lineHeight: 19 },
  answer: { alignSelf: 'flex-start', color: '#F5F5F2', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', borderBottomLeftRadius: 5 },
  question: { alignSelf: 'flex-end', color: '#FFF', backgroundColor: colors.primary, borderBottomRightRadius: 5 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 }, typingText: { color: '#A3A8B3', fontSize: 12 },
  errorMessage: { color: '#FFB4A3', fontSize: 12, lineHeight: 17, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: 'rgba(255,107,74,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,107,74,0.22)', alignSelf: 'flex-start' },
  ticketResults: { width: '100%', marginTop: 9, gap: 7 },
  resultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  resultsLabel: { color: '#929AA6', fontSize: 10, fontWeight: '600' }, resultsHint: { color: colors.primary, fontSize: 10, fontWeight: '600' },
  ticketCard: { minHeight: 86, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  ticketCardPressed: { backgroundColor: 'rgba(255,107,74,0.09)', borderColor: 'rgba(255,107,74,0.55)' },
  ticketInfo: { flex: 1, minWidth: 0 }, ticketName: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  ticketMeta: { color: '#929AA6', fontSize: 10, marginTop: 3 }, priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  ticketPrice: { color: colors.primary, fontSize: 12, fontWeight: '800' }, discount: { color: '#34D399', fontSize: 10, fontWeight: '700' },
  ticketArrow: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  promptsScroll: { flexGrow: 0, flexShrink: 0, height: 42, maxHeight: 42 },
  prompts: { height: 42, alignItems: 'center', paddingHorizontal: 13, paddingBottom: 8, gap: 7 },
  chip: { height: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  chipPressed: { borderColor: 'rgba(255,107,74,0.55)', backgroundColor: 'rgba(255,107,74,0.10)' }, chipText: { color: '#A3A8B3', fontSize: 10, fontWeight: '600' },
  composerWrap: { padding: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.10)', backgroundColor: '#10151C' },
  composer: { minHeight: 46, paddingLeft: 12, paddingRight: 5, borderRadius: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', backgroundColor: '#151A22' },
  input: { flex: 1, color: '#FFF', minHeight: 44, paddingVertical: 8, fontSize: 12 },
  sendButton: { width: 37, height: 37, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.38 },
});
