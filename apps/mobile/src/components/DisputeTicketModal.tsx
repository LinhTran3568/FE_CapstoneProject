import React, { useEffect, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text } from './AppText';
import {
  ShieldAlert,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock,
  Check,
  Minus,
  RotateCcw,
} from 'lucide-react-native';
import type { PurchasedTicketDto } from '@ticketshield/types';
import {
  disputesApi,
  DisputeReasonCode,
  MyDisputeProgressDto,
  DisputeTimelineStepDto,
} from '@ticketshield/api-client';
import { theme } from '../theme';
import { fontFamilies } from '../theme/typography';
import { FintechButton } from './FintechButton';
import { styles } from './DisputeTicketModal.styles';

export const MOBILE_DISPUTE_REASONS = [
  {
    code: DisputeReasonCode.TicketInvalid,
    title: 'Invalid Ticket / Gate Scanner Error',
    desc: 'QR code was rejected by the gate scanner or reported invalid.',
  },
  {
    code: DisputeReasonCode.DuplicateEntry,
    title: 'Duplicate Ticket / Already Used',
    desc: 'Pass was already scanned or checked in by someone else.',
  },
  {
    code: DisputeReasonCode.FakeTicket,
    title: 'Counterfeit / Mismatched Details',
    desc: 'Seat zone, tier, or event details differ from original listing.',
  },
];

const STEP_LABELS: Record<string, string> = {
  SUBMITTED: 'Dispute Filed',
  GATE_LOG_CHECK: 'Cross-Referencing Gate Scans',
  RESOLVED: 'Dispute Resolution Finalized',
};

export interface DisputeTicketModalProps {
  visible: boolean;
  ticket: PurchasedTicketDto | null;
  onClose: () => void;
  onDisputeSubmitted?: (disputeId: string, ticketCode: string) => void;
}

export function DisputeTicketModal({
  visible,
  ticket,
  onClose,
  onDisputeSubmitted,
}: DisputeTicketModalProps) {
  const [mode, setMode] = useState<'SUBMIT' | 'PROGRESS'>('SUBMIT');
  const [reasonCode, setReasonCode] = useState<DisputeReasonCode>(
    DisputeReasonCode.TicketInvalid
  );
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdDispute, setCreatedDispute] = useState<{
    id: string;
    code: string;
  } | null>(null);

  // Progress state
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [progressData, setProgressData] = useState<MyDisputeProgressDto | null>(
    null
  );
  const [progressError, setProgressError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !ticket) {
      setCreatedDispute(null);
      setErrorMsg(null);
      setDescription('');
      setProgressData(null);
      return;
    }

    if (ticket.disputeId || ticket.status === 'DISPUTED') {
      setMode('PROGRESS');
      if (ticket.disputeId) {
        loadProgress(ticket.disputeId);
      }
    } else {
      setMode('SUBMIT');
      setCreatedDispute(null);
    }
  }, [visible, ticket]);

  const loadProgress = async (disputeId: string) => {
    setIsLoadingProgress(true);
    setProgressError(null);
    try {
      const data = await disputesApi.getMyDisputeProgress(disputeId);
      setProgressData(data);
    } catch (err) {
      setProgressError(
        err instanceof Error
          ? err.message
          : 'Unable to load dispute progress. Please try again.'
      );
    } finally {
      setIsLoadingProgress(false);
    }
  };

  if (!ticket) return null;

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrorMsg('Please provide incident details at the gate turnstile.');
      return;
    }
    if (description.trim().length < 5) {
      setErrorMsg('Incident description must be at least 5 characters.');
      return;
    }
    if (!ticket.escrowId) {
      setErrorMsg('This ticket does not have a valid Escrow ID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await disputesApi.createDispute({
        escrowId: ticket.escrowId,
        reason: description.trim(),
        reasonCode,
      });

      setCreatedDispute({
        id: res.disputeId,
        code: res.disputeCode,
      });

      onDisputeSubmitted?.(res.disputeId, ticket.ticketPassCode);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to submit dispute. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'RESOLVED') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeSuccess]}>
          <Text style={[styles.statusBadgeText, { color: theme.colors.success }]}>
            Dispute Approved (Refunded)
          </Text>
        </View>
      );
    }
    if (status === 'REJECTED') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeDanger]}>
          <Text style={[styles.statusBadgeText, { color: theme.colors.danger }]}>
            Dispute Rejected
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusBadgeWarning]}>
        <Text style={[styles.statusBadgeText, { color: theme.colors.warning }]}>
          Under Review (Funds Frozen)
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrap}>
                <ShieldAlert size={18} color={theme.colors.danger} />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {mode === 'SUBMIT'
                    ? 'Report Ticket Issue'
                    : 'Escrow Dispute Progress'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Mode SUBMIT - Filing Form */}
            {mode === 'SUBMIT' && !createdDispute && (
              <>
                {/* Ticket Details */}
                <View style={styles.ticketBadge}>
                  <Text style={styles.ticketBadgeEvent} numberOfLines={1}>
                    {ticket.eventName}
                  </Text>
                  <Text style={styles.ticketBadgeMeta}>
                    Tier: {ticket.tierName} • Zone: {ticket.seatZone} • Pass: ••••{' '}
                    {ticket.ticketPassCode.slice(-4)}
                  </Text>
                </View>

                {/* Reason Selection */}
                <Text style={styles.sectionTitle}>Select Issue Reason</Text>
                <View style={styles.reasonList}>
                  {MOBILE_DISPUTE_REASONS.map((item) => {
                    const isSelected = reasonCode === item.code;
                    return (
                      <TouchableOpacity
                        key={item.code}
                        style={[
                          styles.reasonOption,
                          isSelected && styles.reasonOptionActive,
                        ]}
                        onPress={() => setReasonCode(item.code)}
                        activeOpacity={0.85}
                      >
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleActive,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <View style={styles.reasonTextCol}>
                          <Text
                            style={[
                              styles.reasonTitle,
                              isSelected && styles.reasonTitleActive,
                            ]}
                          >
                            {item.title}
                          </Text>
                          <Text style={styles.reasonDesc}>{item.desc}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Description */}
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>
                    Detailed Description of Gate Incident *
                  </Text>
                  <TextInput
                    style={[styles.textInput, !!errorMsg && styles.textInputError]}
                    placeholder="e.g., Turnstile scanner rejected QR code at 19:15 stating pass was already used..."
                    placeholderTextColor={theme.colors.textPlaceholder}
                    multiline
                    value={description}
                    onChangeText={(val) => {
                      setDescription(val);
                      if (errorMsg) setErrorMsg(null);
                    }}
                  />
                  {errorMsg && (
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      isSubmitting && styles.submitBtnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <ShieldAlert size={16} color="#FFFFFF" />
                        <Text style={styles.submitBtnText}>
                          Submit Dispute & Freeze Escrow
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Mode SUBMIT - Success Confirmation */}
            {mode === 'SUBMIT' && createdDispute && (
              <View style={styles.successBox}>
                <View style={styles.successIconWrap}>
                  <CheckCircle2 size={36} color={theme.colors.success} />
                </View>
                <Text style={styles.successTitle}>
                  Dispute Filed Successfully!
                </Text>
                <View style={styles.codePill}>
                  <Text style={styles.codeLabel}>Dispute ID:</Text>
                  <Text style={styles.codeValue}>{createdDispute.code}</Text>
                </View>
                <FintechButton
                  title="Got It"
                  onPress={onClose}
                  style={{ minWidth: 200, marginTop: theme.spacing.md }}
                />
              </View>
            )}

            {/* Mode PROGRESS - Timeline Progress */}
            {mode === 'PROGRESS' && (
              <>
                {isLoadingProgress ? (
                  <View style={{ alignItems: 'center', padding: theme.spacing.xl }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text
                      style={{
                        marginTop: theme.spacing.md,
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.sizes.sm,
                      }}
                    >
                      Loading gate turnstile audit logs...
                    </Text>
                  </View>
                ) : progressError ? (
                  <View style={{ alignItems: 'center', padding: theme.spacing.xl, gap: 12 }}>
                    <AlertTriangle size={32} color={theme.colors.danger} />
                    <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
                      {progressError}
                    </Text>
                    {ticket.disputeId && (
                      <FintechButton
                        title="Try Again"
                        onPress={() => loadProgress(ticket.disputeId!)}
                        variant="secondary"
                      />
                    )}
                  </View>
                ) : (
                  <>
                    <View style={styles.ticketBadge}>
                      <Text style={styles.ticketBadgeEvent} numberOfLines={1}>
                        {ticket.eventName}
                      </Text>
                      <Text style={styles.ticketBadgeMeta}>
                        Pass: {ticket.ticketPassCode} • Tier: {ticket.tierName}
                      </Text>
                    </View>

                    <View style={styles.statusPillRow}>
                      <Text style={styles.statusPillLabel}>Audit Status:</Text>
                      {getStatusBadge(progressData?.status || 'OPEN')}
                    </View>

                    <Text style={styles.sectionTitle}>Turnstile Audit Timeline</Text>
                    <View style={styles.timelineList}>
                      {(
                        progressData?.timeline || [
                          { step: 'SUBMITTED', state: 'DONE' },
                          { step: 'GATE_LOG_CHECK', state: 'CURRENT' },
                          { step: 'RESOLVED', state: 'PENDING' },
                        ]
                      ).map((stepItem: DisputeTimelineStepDto, idx: number, arr: any[]) => {
                        const isDone = stepItem.state === 'DONE';
                        const isCurrent = stepItem.state === 'CURRENT';
                        const isSkipped = stepItem.state === 'SKIPPED';
                        const isLast = idx === arr.length - 1;

                        return (
                          <View key={stepItem.step} style={styles.timelineItem}>
                            <View style={styles.timelineLeft}>
                              <View
                                style={[
                                  styles.timelineDot,
                                  isDone && styles.timelineDotDone,
                                  isCurrent && styles.timelineDotCurrent,
                                  isSkipped && styles.timelineDotSkipped,
                                ]}
                              >
                                {isDone ? (
                                  <Check size={11} color="#0C0A09" />
                                ) : isCurrent ? (
                                  <Clock size={11} color="#FFFFFF" />
                                ) : isSkipped ? (
                                  <Minus size={12} color={theme.colors.textMuted} />
                                ) : null}
                              </View>
                              {!isLast && <View style={styles.timelineLine} />}
                            </View>

                            <View style={styles.timelineBody}>
                              <Text style={styles.timelineStepTitle}>
                                {STEP_LABELS[stepItem.step] || stepItem.step}
                              </Text>
                              <Text style={styles.timelineStepDetail}>
                                {isDone
                                  ? 'Completed'
                                  : isCurrent
                                    ? 'Cross-referencing entrance turnstile logs...'
                                    : isSkipped
                                      ? 'Skipped'
                                    : 'Pending resolution'}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {progressData?.resolutionMessage && (
                      <View style={styles.escrowWarning}>
                        <Text style={styles.escrowWarningText}>
                          {progressData.resolutionMessage}
                        </Text>
                      </View>
                    )}

                    <FintechButton
                      title="Close"
                      onPress={onClose}
                      variant="secondary"
                      style={{ marginTop: theme.spacing.md }}
                    />
                  </>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
