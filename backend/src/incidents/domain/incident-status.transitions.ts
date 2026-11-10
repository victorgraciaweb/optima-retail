import { BadRequestException, ConflictException } from '@nestjs/common';
import { IncidentStatus } from '../enums';

/**
 * Allowed status transitions.
 *
 * Kept as a pure module (no Nest dependencies, no repositories) so the whole
 * state machine is unit-testable in isolation and so the service layer cannot
 * silently diverge from it.
 *
 * `resuelta -> abierta` is intentionally present: the assignment requires that
 * a resolved incident can only go back to open as an *explicit* reopening,
 * which is enforced by `assertTransitionAllowed` demanding a reason.
 */
export const ALLOWED_TRANSITIONS: Readonly<
  Record<IncidentStatus, readonly IncidentStatus[]>
> = {
  [IncidentStatus.Abierta]: [IncidentStatus.EnRevision],
  [IncidentStatus.EnRevision]: [
    IncidentStatus.Bloqueada,
    IncidentStatus.Resuelta,
  ],
  [IncidentStatus.Bloqueada]: [
    IncidentStatus.EnRevision,
    IncidentStatus.Resuelta,
  ],
  [IncidentStatus.Resuelta]: [IncidentStatus.Abierta],
};

/**
 * True when `to` is reachable from `from` in a single step.
 *
 * A transition to the same status is *not* allowed: it would persist no change
 * and produce an empty log entry, polluting the audit trail.
 */
export const canTransition = (
  from: IncidentStatus,
  to: IncidentStatus,
): boolean => ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;

/**
 * True when the transition is a reopening, i.e. the only backwards move in the
 * lifecycle. Callers use it to decide the log action and to require a reason.
 */
export const isReopening = (
  from: IncidentStatus,
  to: IncidentStatus,
): boolean => from === IncidentStatus.Resuelta && to === IncidentStatus.Abierta;

/**
 * Guard used by the service layer before persisting a status change.
 *
 * Throws instead of returning a result so the caller cannot forget to check
 * it, and so the transaction wrapping the change aborts on its own.
 *
 * @throws ConflictException when the transition is not allowed (409 — the
 *         request is well-formed, it conflicts with the current state).
 * @throws BadRequestException when reopening without a reason (400 — the
 *         request itself is incomplete).
 */
export const assertTransitionAllowed = (
  from: IncidentStatus,
  to: IncidentStatus,
  reason?: string,
): void => {
  if (from === to) {
    throw new ConflictException(
      `La incidencia ya está en estado "${from}". Transiciones válidas: ${ALLOWED_TRANSITIONS[from].join(', ')}.`,
    );
  }

  if (!canTransition(from, to)) {
    throw new ConflictException(
      `No se puede pasar de "${from}" a "${to}". Transiciones válidas: ${ALLOWED_TRANSITIONS[from].join(', ')}.`,
    );
  }

  if (isReopening(from, to) && !reason?.trim()) {
    throw new BadRequestException(
      'Reabrir una incidencia resuelta requiere un motivo explícito (campo "reason").',
    );
  }
};
