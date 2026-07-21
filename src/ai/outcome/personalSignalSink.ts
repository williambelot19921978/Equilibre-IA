/**
 * Personal signal output port — Sprint A4.
 */

import type { PersonalSignal } from '../contracts/privacy/personal-signal.ts';
import type { MemberId } from '../contracts/common/ids.ts';

export type IPersonalSignalSink = {
  emit(signal: PersonalSignal): void;
  listForMember(memberId: MemberId): readonly PersonalSignal[];
  clear(): void;
};

export class InMemoryPersonalSignalSink implements IPersonalSignalSink {
  private readonly signals: PersonalSignal[] = [];

  emit(signal: PersonalSignal): void {
    this.signals.push(signal);
  }

  listForMember(memberId: MemberId): readonly PersonalSignal[] {
    return this.signals.filter((signal) => signal.memberId === memberId);
  }

  clear(): void {
    this.signals.length = 0;
  }

  listAll(): readonly PersonalSignal[] {
    return [...this.signals];
  }
}
