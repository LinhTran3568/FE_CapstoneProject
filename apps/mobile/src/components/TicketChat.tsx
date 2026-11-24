import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { Bot, RotateCcw, Send, X } from 'lucide-react-native';
import { copilotApi } from '@ticketshield/api-client';
import type { CopilotChatMessage, CopilotTicketItemDto } from '@ticketshield/types';
import { Text } from './AppText';
import { theme } from '../theme';
import { formatPrice } from '../utils/format';

type Message = CopilotChatMessage & { tickets?: CopilotTicketItemDto[] };
const prompts = [
  ['Under 1M', 'Concert tickets under 1M'],
  ['VIP price cap', 'Check VIP ticket price cap'],
  ['This week', 'Hot concert tickets this week'],
];
const { colors } = theme;

export function TicketChat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  const scroll = useRef<ScrollView>(null);

  const pathname = usePathname();
  const [typing, setTyping] = useState(Keyboard.isVisible());
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () => setTyping(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setTyping(false));
    return () => { shown.remove(); hidden.remove(); };
  }, []);
  const bottom = typing ? 8 : 68 + insets.bottom;
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });
    return () => listener.remove();
  }, [open]);

  async function send(value: string) {
    const query = value.trim();
    if (!query || pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailed(false);
    setInput('');
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages([...messages, { role: 'user', content: query }]);
    try {
      const result = await copilotApi.chat({ message: query, history, conversationHistory: history, stream: false });
      setMessages(previous => [...previous, { role: 'assistant', content: result.reply, tickets: result.suggestedTickets }]);
    } catch {
      setMessages(messages);
      setInput(query);
      setFailed(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  if (!open) return (
    <Pressable accessibilityRole="button" accessibilityLabel="Chat with Ticky" onPress={() => setOpen(true)}
      style={[s.launcher, { bottom }]}>
      <Bot color="white" size={22} /><Text style={s.label}>Ticky</Text>
    </Pressable>
  );
  return (
      <KeyboardAvoidingView style={[StyleSheet.absoluteFill, { bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        <View pointerEvents="box-none" style={[s.anchor, { paddingTop: insets.top + 8, paddingBottom: 0 }]}>
          <View style={[s.panel, messages.length > 0 && s.conversation]}>
          <View style={s.row}>
            <View style={s.avatar}><Bot size={18} color={colors.primary} /></View><Text style={s.title}>Ticky</Text>
            <Pressable accessibilityLabel="Reset chat" accessibilityRole="button" disabled={busy} style={s.action}
              onPress={() => { setMessages([]); setInput(''); setFailed(false); }}><RotateCcw size={17} color={busy ? colors.textMuted : colors.text} /></Pressable>
            <Pressable accessibilityLabel="Close chat" accessibilityRole="button" style={s.action} onPress={() => setOpen(false)}><X size={19} color={colors.text} /></Pressable>
          </View>
          <ScrollView ref={scroll} contentContainerStyle={s.thread} keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => { if (messages.length) scroll.current?.scrollToEnd({ animated: true }); }}>
            {!messages.length && <>
              <Text style={s.greeting}>Find tickets or check a resale price.</Text>
              <View style={s.prompts}>
                {prompts.map(([label, query]) => <Pressable key={query} accessibilityRole="button"
                  accessibilityLabel={query} style={s.chip} onPress={() => send(query)}>
                  <Text style={s.chipText}>{label}</Text>
                </Pressable>)}
              </View>
            </>}
            {messages.map((message, index) => <View key={index}>
              <Text selectable style={[s.message, message.role === 'user' ? s.question : s.answer]}>{message.content}</Text>
              {message.tickets?.map(ticket => <Pressable key={ticket.listingId} accessibilityRole="button" onPress={() => {
                setOpen(false);
                router.navigate({ pathname: '/(tabs)/marketplace', params: { suggestedEvent: ticket.eventId, eventQuery: ticket.eventName, suggestedId: ticket.listingId, selection: String(Date.now()) } });
              }}><Text style={s.choice}>{ticket.eventName} · {ticket.tierName} · {formatPrice(ticket.resalePrice)}</Text></Pressable>)}
            </View>)}
            {busy && <ActivityIndicator accessibilityLabel="Ticky is thinking" color={colors.primary} />}
            {failed && <Text accessibilityLiveRegion="polite" style={s.message}>Ticky could not reply. Tap send to try again.</Text>}
          </ScrollView>
          <View style={[s.row, s.composer]}>
            <TextInput accessibilityLabel="Message Ticky" placeholder="Ask Ticky…" placeholderTextColor={colors.textMuted}
              style={s.input} editable={!busy} value={input} onChangeText={setInput} returnKeyType="send" onSubmitEditing={() => send(input)} />
            <Pressable accessibilityRole="button" accessibilityLabel="Send message" style={s.action} disabled={busy || !input.trim()} onPress={() => send(input)}>
              <Send color={input.trim() && !busy ? colors.primary : colors.textMuted} />
            </Pressable>
          </View>
          </View>
        </View>
      </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  launcher: { position: 'absolute', right: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, padding: 12, borderRadius: 24, elevation: 4 },
  label: { color: 'white', fontWeight: '700' },
  anchor: { flex: 1, alignItems: 'flex-end', justifyContent: 'flex-end', paddingHorizontal: 12 },
  panel: { width: '86%', maxWidth: 320, maxHeight: '95%', borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.background, elevation: 8 },
  conversation: { height: '70%', maxHeight: 340 },
  avatar: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  greeting: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  prompts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 9, paddingVertical: 8, borderRadius: 14, backgroundColor: colors.primaryLight },
  chipText: { color: colors.primarySoft, fontSize: 12, fontWeight: '600' },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 2, backgroundColor: colors.surface },
  title: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 16, marginLeft: 4 },
  action: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  thread: { padding: 12, gap: 10 },
  message: { color: colors.text, padding: 12, borderRadius: 14, maxWidth: '92%' },
  answer: { alignSelf: 'flex-start', backgroundColor: colors.surface },
  question: { alignSelf: 'flex-end', backgroundColor: colors.border },
  choice: { color: colors.primary, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginTop: 4 },
  input: { flex: 1, color: colors.text, paddingHorizontal: 10, minHeight: 44 },
});
