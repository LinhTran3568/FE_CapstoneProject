import {
  SeatAdjacencyResult,
  SeatAdjacencyStatus,
  SeatInfoInput,
  ParsedSeat,
} from '@ticketshield/types';

/**
 * Normalizes string for keyword matching (lowercase, trimmed, strip redundant spaces).
 */
function normalizeText(text: string): string {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Checks if a text represents a General Admission / Standing / Free seating area.
 */
export function isStandingOrGA(text: string): boolean {
  const norm = normalizeText(text);
  return (
    norm.includes('standing') ||
    norm.includes('ga floor') ||
    norm.includes('tự do') ||
    norm.includes('tu do') ||
    norm.includes('fanzone standing') ||
    norm.includes('lounge') ||
    (norm.includes('ga') && !norm.includes('gate') && !norm.includes('hàng') && !norm.includes('row'))
  );
}

/**
 * Helper to split multi-seat strings like "12 & 14", "12, 13, 14", "12-14", "12 và 14"
 */
function extractSeatNumbersFromString(seatStr: string): number[] {
  if (!seatStr) return [];
  // Match all integer numbers
  const matches = seatStr.match(/\d+/g);
  if (!matches) return [];
  return matches.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n));
}

/**
 * Parses a single seat string or structured SeatInfoInput into one or more ParsedSeat records.
 * Handles diverse Vietnamese and English ticketing nomenclature:
 * - "VIP Zone A - Row 1 Seat 12"
 * - "VIP Zone A - Row 1 Seat 12 & 14"
 * - "Zone A, Hàng G, Ghế 12"
 * - "Khu A - Dãy B - Số 15"
 * - "Khán đài A - Cửa 3 - Hàng 10 - Ghế 22"
 * - "A-12" / "Row B Seat 05"
 * - "GA Standing Zone 2"
 */
export function parseSeatInfo(input: string | SeatInfoInput | null | undefined): ParsedSeat[] {
  if (!input) {
    return [
      {
        zone: '',
        row: '',
        seatNumber: null,
        seatNumberRaw: '',
        isStanding: false,
        raw: '',
      },
    ];
  }

  // If input is an object
  if (typeof input === 'object') {
    const rawZone = (input.seatZone || input.tierName || '').trim();
    const rawRow = (input.seatRow || '').trim();
    const rawNum = (input.seatNumber !== undefined && input.seatNumber !== null ? String(input.seatNumber) : '').trim();
    const rawInfo = (input.seatInfo || input.raw || '').trim();

    // If explicit row & number provided
    if (rawRow || rawNum) {
      const parsedNum = rawNum ? parseInt(rawNum, 10) : null;
      return [
        {
          zone: rawZone,
          row: rawRow.toUpperCase(),
          seatNumber: parsedNum !== null && !isNaN(parsedNum) ? parsedNum : null,
          seatNumberRaw: rawNum,
          isStanding: isStandingOrGA(rawZone),
          raw: `${rawZone} ${rawRow ? 'Row ' + rawRow : ''} ${rawNum ? 'Seat ' + rawNum : ''}`.trim(),
        },
      ];
    }

    // Otherwise fallback to parsing the combined strings (seatZone or seatInfo)
    const combinedString = [rawZone, rawInfo].filter(Boolean).join(' - ');
    return parseSeatString(combinedString);
  }

  // If input is a raw string
  return parseSeatString(input);
}

/**
 * Internal parser for raw string representations.
 */
function parseSeatString(rawString: string): ParsedSeat[] {
  const trimmed = (rawString || '').trim();
  if (!trimmed) {
    return [
      {
        zone: '',
        row: '',
        seatNumber: null,
        seatNumberRaw: '',
        isStanding: false,
        raw: '',
      },
    ];
  }

  const standing = isStandingOrGA(trimmed);

  // Default values
  let zone = '';
  let row = '';
  let seatNumbers: number[] = [];
  let seatNumberRaw = '';

  // Extract Zone / Khu / Khán đài
  // Match "VIP Zone A", "Zone A", "Khu VIP", "Khán đài A", "SVIP 1", "CAT 1", etc.
  const zoneRegex = /(?:(?:VIP|SVIP|VVIP|CAT|GA|Standard|Eco|Diamond|Platinum|Gold|Silver)?\s*(?:Zone|Khu|Khán đài|Khán Đài|Khu vực)\s*[A-Za-z0-9]+|VIP\s*[A-Za-z0-9]+|SVIP\s*[A-Za-z0-9]+|CAT\s*[0-9]+)/i;
  const zoneMatch = trimmed.match(zoneRegex);
  if (zoneMatch) {
    zone = zoneMatch[0].trim();
  }

  // Extract Row / Hàng / Dãy
  // Match "Row 1", "Row A", "Hàng G", "Hàng 12", "Dãy B", "Dãy 05"
  const rowRegex = /(?:Row|Hàng|Hang|Dãy|Day|D\u00e3y)\s*[:#-]?\s*([A-Za-z0-9]+)/i;
  const rowMatch = trimmed.match(rowRegex);
  if (rowMatch) {
    row = rowMatch[1].trim().toUpperCase();
  }

  // Extract Seat / Ghế / Số
  // Match "Seat 12", "Ghế 12 & 14", "Ghế 12, 13", "Số 15", "Seats 10-12"
  const seatRegex = /(?:Seats?|Gh\u1ebf|Ghe|S\u1ed1|So)\s*[:#-]?\s*([0-9\s,&vàva\-]+)/i;
  const seatMatch = trimmed.match(seatRegex);
  if (seatMatch) {
    seatNumberRaw = seatMatch[1].trim();
    seatNumbers = extractSeatNumbersFromString(seatNumberRaw);
  }

  // Fallback pattern 1: "A-12" or "Row A-12" or "G12"
  if (!row && seatNumbers.length === 0) {
    const compactRegex = /\b([A-Za-z])-?(\d+)\b/;
    const compactMatch = trimmed.match(compactRegex);
    if (compactMatch) {
      row = compactMatch[1].toUpperCase();
      const num = parseInt(compactMatch[2], 10);
      if (!isNaN(num)) {
        seatNumbers = [num];
        seatNumberRaw = compactMatch[2];
      }
    }
  }

  // Fallback pattern 2: If no zone found, extract prefix before Row/Seat
  if (!zone && (row || seatNumbers.length > 0)) {
    const parts = trimmed.split(/[-–—,]/);
    if (parts.length > 1) {
      const firstPart = parts[0].trim();
      if (!rowRegex.test(firstPart) && !seatRegex.test(firstPart)) {
        zone = firstPart;
      }
    }
  }

  // If multiple seats were found in a single string (e.g. "Ghế 12 & 14" -> [12, 14])
  if (seatNumbers.length > 1) {
    return seatNumbers.map((num) => ({
      zone: zone || (standing ? trimmed : ''),
      row: row,
      seatNumber: num,
      seatNumberRaw: String(num),
      isStanding: standing,
      raw: trimmed,
    }));
  }

  const singleNum = seatNumbers.length === 1 ? seatNumbers[0] : null;
  return [
    {
      zone: zone || (standing ? trimmed : ''),
      row: row,
      seatNumber: singleNum,
      seatNumberRaw: seatNumberRaw || (singleNum !== null ? String(singleNum) : ''),
      isStanding: standing,
      raw: trimmed,
    },
  ];
}

/**
 * Normalizes zone names for fair equality comparison (e.g. "VIP Zone A" === "VIP ZONE A" === "Khu VIP A").
 */
function normalizeZone(zone: string): string {
  if (!zone) return '';
  return zone
    .toLowerCase()
    .replace(/(khu|khu vực|khán đài|khán đai|zone|section)/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Core Algorithm: Analyzes a list of seats and detects whether they are Adjacent (Ghế liền kề)
 * or in Different Locations (Vị trí khác nhau) according to TicketShield rules (FE-5.2.5b / BR-G06).
 *
 * Rules:
 * 1. Single Seat: marked as SINGLE_SEAT.
 * 2. GA / Standing: If all seats are in the same GA section -> GENERAL_ADMISSION.
 * 3. Zone Match: All seats must belong to the exact same Zone/Section.
 * 4. Row Match: All seats must be on the exact same Row.
 * 5. Number Adjacency:
 *    - Sequential: Step = 1 (e.g. 12, 13, 14)
 *    - Theatre Parity: Step = 2 with same parity (all even e.g. 12, 14, 16 or all odd e.g. 11, 13, 15)
 *    -> If true, marked as ADJACENT.
 *    -> Otherwise, marked as DIFFERENT_LOCATIONS.
 */
export function detectSeatAdjacency(
  inputs: Array<string | SeatInfoInput | null | undefined> | string
): SeatAdjacencyResult {
  // Normalize input into flat array of ParsedSeat
  const inputList = Array.isArray(inputs) ? inputs : [inputs];
  const allParsed: ParsedSeat[] = [];

  for (const item of inputList) {
    const parsed = parseSeatInfo(item);
    allParsed.push(...parsed);
  }

  // Filter out completely empty items
  const validSeats = allParsed.filter((s) => s.raw || s.zone || s.row || s.seatNumber !== null);

  // 1. Zero or Single Seat handling
  if (validSeats.length <= 1) {
    const single = validSeats[0];
    if (!single || (!single.row && single.seatNumber === null && !single.zone)) {
      return {
        isAdjacent: true,
        status: 'SINGLE_SEAT',
        badgeText: '1 Ticket',
        badgeSubtext: 'Single Ticket',
        badgeTone: 'neutral',
        commonZone: null,
        commonRow: null,
        seatNumbers: [],
        parsedSeats: validSeats,
        reason: 'Single ticket',
        liquidityScore: 'MEDIUM',
        liquidityNote: 'Standard single ticket.',
      };
    }

    const seatDesc = single.row && single.seatNumber !== null
      ? `Row ${single.row} - Seat ${single.seatNumber}`
      : single.row
      ? `Row ${single.row}`
      : single.seatNumber !== null
      ? `Seat ${single.seatNumber}`
      : single.zone || '1 Ticket';

    return {
      isAdjacent: true,
      status: 'SINGLE_SEAT',
      badgeText: seatDesc,
      badgeSubtext: single.zone || undefined,
      badgeTone: 'neutral',
      commonZone: single.zone || null,
      commonRow: single.row || null,
      seatNumbers: single.seatNumber !== null ? [single.seatNumber] : [],
      parsedSeats: validSeats,
      reason: 'Single ticket',
      liquidityScore: 'MEDIUM',
      liquidityNote: 'Standard single ticket with stable demand.',
    };
  }

  // 2. Standing / GA Tickets Check
  const standingSeats = validSeats.filter((s) => s.isStanding);
  if (standingSeats.length === validSeats.length) {
    const firstZone = normalizeZone(validSeats[0].zone);
    const sameZone = validSeats.every((s) => normalizeZone(s.zone) === firstZone);

    if (sameZone) {
      const zoneDisplay = validSeats[0].zone || 'GA Standing Zone';
      return {
        isAdjacent: true,
        status: 'GENERAL_ADMISSION',
        badgeText: 'General Admission (Same Zone)',
        badgeSubtext: zoneDisplay,
        badgeTone: 'info',
        commonZone: validSeats[0].zone || null,
        commonRow: null,
        seatNumbers: [],
        parsedSeats: validSeats,
        reason: 'All tickets belong to the same General Admission / Standing area',
        liquidityScore: 'HIGH',
        liquidityNote: 'General Admission tickets in the same zone allow entering and standing together.',
      };
    } else {
      const zoneNames = Array.from(new Set(validSeats.map((s) => s.zone || 'Different Zone'))).join(' & ');
      return {
        isAdjacent: false,
        status: 'DIFFERENT_LOCATIONS',
        badgeText: 'Different Zones',
        badgeSubtext: zoneNames,
        badgeTone: 'warning',
        commonZone: null,
        commonRow: null,
        seatNumbers: [],
        parsedSeats: validSeats,
        reason: `Tickets are in different standing areas (${zoneNames})`,
        liquidityScore: 'LOW',
        liquidityNote: 'Tickets are in different sections, holders will not be in the same area.',
      };
    }
  }

  // 3. Zone Matching Check
  const zones = validSeats.map((s) => s.zone).filter(Boolean);
  const normalizedZones = Array.from(new Set(zones.map(normalizeZone)));
  const uniqueDisplayZones = Array.from(new Set(zones));

  if (normalizedZones.length > 1) {
    const diffZoneText = uniqueDisplayZones.join(' & ');
    return {
      isAdjacent: false,
      status: 'DIFFERENT_LOCATIONS',
      badgeText: 'Different Locations',
      badgeSubtext: `${validSeats.length} different locations (${diffZoneText})`,
      badgeTone: 'warning',
      commonZone: null,
      commonRow: null,
      seatNumbers: validSeats.map((s) => s.seatNumber).filter((n): n is number => n !== null),
      parsedSeats: validSeats,
      reason: `Tickets belong to different sections/zones (${diffZoneText})`,
      liquidityScore: 'LOW',
      liquidityNote: 'Tickets are in different sections and not located together.',
    };
  }

  const commonZone = uniqueDisplayZones[0] || null;

  // 4. Row Matching Check
  const rows = validSeats.map((s) => s.row).filter(Boolean);
  const uniqueRows = Array.from(new Set(rows));

  if (uniqueRows.length > 1) {
    const diffRowText = uniqueRows.join(' & ');
    return {
      isAdjacent: false,
      status: 'DIFFERENT_LOCATIONS',
      badgeText: 'Different Locations',
      badgeSubtext: `Different rows (Rows ${diffRowText})`,
      badgeTone: 'warning',
      commonZone: commonZone,
      commonRow: null,
      seatNumbers: validSeats.map((s) => s.seatNumber).filter((n): n is number => n !== null),
      parsedSeats: validSeats,
      reason: `Tickets are on different rows (Rows ${diffRowText})`,
      liquidityScore: 'LOW',
      liquidityNote: 'Tickets are on different rows and not seated together.',
    };
  }

  const commonRow = uniqueRows[0] || null;

  // 5. Seat Number Extraction & Adjacency Evaluation
  const seatsWithNumbers = validSeats.filter((s) => s.seatNumber !== null);

  if (seatsWithNumbers.length < validSeats.length) {
    // Some seats don't have extractable seat numbers
    return {
      isAdjacent: false,
      status: 'UNKNOWN',
      badgeText: 'Unassigned Seat Numbers',
      badgeSubtext: commonRow ? `Same Row ${commonRow}` : commonZone || undefined,
      badgeTone: 'neutral',
      commonZone: commonZone,
      commonRow: commonRow,
      seatNumbers: seatsWithNumbers.map((s) => s.seatNumber as number),
      parsedSeats: validSeats,
      reason: 'Seat numbers missing to determine adjacent seating',
      liquidityScore: 'MEDIUM',
      liquidityNote: 'Please check ticket details for specific seating positions.',
    };
  }

  // Extract all numbers and sort ascending
  const rawNumbers = seatsWithNumbers.map((s) => s.seatNumber as number);
  const sorted = [...rawNumbers].sort((a, b) => a - b);

  // Check for duplicate seat numbers
  const hasDuplicates = sorted.some((val, idx) => idx > 0 && val === sorted[idx - 1]);
  if (hasDuplicates) {
    return {
      isAdjacent: false,
      status: 'DIFFERENT_LOCATIONS',
      badgeText: 'Duplicate Seat Numbers',
      badgeSubtext: `Duplicate seat numbers detected (${sorted.join(', ')})`,
      badgeTone: 'warning',
      commonZone: commonZone,
      commonRow: commonRow,
      seatNumbers: sorted,
      parsedSeats: validSeats,
      reason: 'Seat list contains duplicate seat numbers',
      liquidityScore: 'LOW',
      liquidityNote: 'Warning: Ticket list contains duplicate seat numbers.',
    };
  }

  // Evaluate Consecutive Steps
  // Case A: Continuous sequential numbers (step = 1), e.g. [12, 13], [12, 13, 14], [1, 2, 3, 4]
  let isStep1 = true;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== 1) {
      isStep1 = false;
      break;
    }
  }

  // Case B: Theatre parity sequential (step = 2 with identical parity, all even or all odd)
  // Standard in Vietnamese/international auditoriums (e.g. 12 & 14 on Left wing, or 11 & 13 on Right wing)
  let isTheatreParity = true;
  const firstParity = sorted[0] % 2;
  for (let i = 1; i < sorted.length; i++) {
    const diff = sorted[i] - sorted[i - 1];
    const currParity = sorted[i] % 2;
    if (diff !== 2 || currParity !== firstParity) {
      isTheatreParity = false;
      break;
    }
  }

  if (isStep1 || isTheatreParity) {
    const rowSuffix = commonRow ? `Row ${commonRow}` : `Seats ${sorted.join(', ')}`;
    const formattedNumbers = sorted.join(' & ');

    return {
      isAdjacent: true,
      status: 'ADJACENT',
      badgeText: 'Adjacent Seats',
      badgeSubtext: `${rowSuffix} (Seats ${formattedNumbers})`,
      badgeTone: 'success',
      commonZone: commonZone,
      commonRow: commonRow,
      seatNumbers: sorted,
      parsedSeats: validSeats,
      reason: `Seats are directly adjacent in Row ${commonRow || ''} (Seats ${formattedNumbers})`,
      liquidityScore: 'HIGH',
      liquidityNote: 'Adjacent seats sell significantly faster and are preferred by buyers.',
    };
  }

  // Case C: Same row but gap between seats (e.g. 12 and 15, or 12 and 16)
  const numbersText = sorted.join(' & ');
  return {
    isAdjacent: false,
    status: 'DIFFERENT_LOCATIONS',
    badgeText: 'Different Locations',
    badgeSubtext: commonRow ? `Row ${commonRow}, non-adjacent (${numbersText})` : `Non-adjacent (${numbersText})`,
    badgeTone: 'warning',
    commonZone: commonZone,
    commonRow: commonRow,
    seatNumbers: sorted,
    parsedSeats: validSeats,
    reason: `Seats are on Row ${commonRow || ''} but not adjacent (Seats ${numbersText})`,
    liquidityScore: 'MEDIUM',
    liquidityNote: 'Seats are not directly adjacent. Please review seating before purchasing.',
  };
}

/**
 * Formats a clean seat list label for UI presentation (e.g. "Zone A • Row G (Seats 12 & 14)").
 */
export function formatSeatListSummary(
  inputs: Array<string | SeatInfoInput | null | undefined> | string
): string {
  const result = detectSeatAdjacency(inputs);
  const parts: string[] = [];

  if (result.commonZone) {
    parts.push(result.commonZone);
  }

  if (result.commonRow) {
    parts.push(`Row ${result.commonRow}`);
  }

  if (result.seatNumbers.length > 0) {
    parts.push(`Seats ${result.seatNumbers.join(', ')}`);
  } else if (result.status === 'GENERAL_ADMISSION') {
    parts.push('General Admission');
  }

  return parts.length > 0 ? parts.join(' • ') : 'Ticket Location';
}
