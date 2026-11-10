/**
 * Whitelisted sort orders.
 *
 * Exposed as an enum rather than a free-text `sort` parameter so the value can
 * never reach `ORDER BY` as raw user input: the service maps each member to a
 * fixed column/direction pair.
 */
export enum IncidentSort {
  CreatedAtDesc = 'created_at:desc',
  CreatedAtAsc = 'created_at:asc',
  UpdatedAtDesc = 'updated_at:desc',
  DueAtAsc = 'due_at:asc',
  PriorityDesc = 'priority:desc',
}
