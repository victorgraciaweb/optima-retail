import { BadRequestException, ConflictException } from '@nestjs/common';
import { IncidentStatus } from '../enums';
import {
  ALLOWED_TRANSITIONS,
  assertTransitionAllowed,
  canTransition,
  isReopening,
} from './incident-status.transitions';

const ALL_STATUSES = Object.values(IncidentStatus);

/**
 * The full transition table, enumerated rather than derived from
 * ALLOWED_TRANSITIONS: a test that reads the same map it verifies would pass
 * even if the map were wrong.
 */
const EXPECTED_ALLOWED: [IncidentStatus, IncidentStatus][] = [
  [IncidentStatus.Abierta, IncidentStatus.EnRevision],
  [IncidentStatus.EnRevision, IncidentStatus.Bloqueada],
  [IncidentStatus.EnRevision, IncidentStatus.Resuelta],
  [IncidentStatus.Bloqueada, IncidentStatus.EnRevision],
  [IncidentStatus.Bloqueada, IncidentStatus.Resuelta],
  [IncidentStatus.Resuelta, IncidentStatus.Abierta],
];

const isExpectedAllowed = (from: IncidentStatus, to: IncidentStatus) =>
  EXPECTED_ALLOWED.some(([f, t]) => f === from && t === to);

describe('incident status transitions', () => {
  describe('canTransition', () => {
    it.each(EXPECTED_ALLOWED)('allows %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    // Every remaining pair in the 4x4 matrix, same-status included.
    const rejected = ALL_STATUSES.flatMap((from) =>
      ALL_STATUSES.filter((to) => !isExpectedAllowed(from, to)).map(
        (to) => [from, to] as [IncidentStatus, IncidentStatus],
      ),
    );

    it.each(rejected)('rejects %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    });

    it('declares an entry for every status, so no status is a dead end by omission', () => {
      expect(Object.keys(ALLOWED_TRANSITIONS).sort()).toEqual(
        [...ALL_STATUSES].sort(),
      );
    });
  });

  describe('isReopening', () => {
    it('is true only for resuelta -> abierta', () => {
      expect(isReopening(IncidentStatus.Resuelta, IncidentStatus.Abierta)).toBe(
        true,
      );
      expect(
        isReopening(IncidentStatus.Bloqueada, IncidentStatus.EnRevision),
      ).toBe(false);
      expect(isReopening(IncidentStatus.Abierta, IncidentStatus.Abierta)).toBe(
        false,
      );
    });
  });

  describe('assertTransitionAllowed', () => {
    it.each(
      EXPECTED_ALLOWED.filter(([from]) => from !== IncidentStatus.Resuelta),
    )('does not throw for %s -> %s', (from, to) => {
      expect(() => assertTransitionAllowed(from, to)).not.toThrow();
    });

    it('rejects a transition to the same status with 409, so no empty log is written', () => {
      expect(() =>
        assertTransitionAllowed(IncidentStatus.Abierta, IncidentStatus.Abierta),
      ).toThrow(ConflictException);
    });

    it('rejects an illegal transition with 409 and lists the valid targets', () => {
      expect(() =>
        assertTransitionAllowed(
          IncidentStatus.Abierta,
          IncidentStatus.Resuelta,
        ),
      ).toThrow(
        new ConflictException(
          'No se puede pasar de "abierta" a "resuelta". Transiciones válidas: en_revision.',
        ),
      );
    });

    it('rejects reopening without a reason with 400', () => {
      expect(() =>
        assertTransitionAllowed(
          IncidentStatus.Resuelta,
          IncidentStatus.Abierta,
        ),
      ).toThrow(BadRequestException);
    });

    it('rejects reopening with a blank reason, not just a missing one', () => {
      expect(() =>
        assertTransitionAllowed(
          IncidentStatus.Resuelta,
          IncidentStatus.Abierta,
          '   ',
        ),
      ).toThrow(BadRequestException);
    });

    it('allows reopening when a reason is given', () => {
      expect(() =>
        assertTransitionAllowed(
          IncidentStatus.Resuelta,
          IncidentStatus.Abierta,
          'Vuelve a reproducirse',
        ),
      ).not.toThrow();
    });

    it('does not require a reason for a regular transition', () => {
      expect(() =>
        assertTransitionAllowed(
          IncidentStatus.EnRevision,
          IncidentStatus.Resuelta,
        ),
      ).not.toThrow();
    });
  });
});
