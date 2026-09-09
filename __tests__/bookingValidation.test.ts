import { describe, it, expect } from 'vitest';
import { addMinutes } from '../lib/bookingValidation';

describe('Booking Validation Logic', () => {
  describe('addMinutes', () => {
    it('should correctly add minutes to a standard time', () => {
      const result = addMinutes('10:00', 45);
      expect(result).toBe('10:45:00');
    });

    it('should correctly roll over the hour', () => {
      const result = addMinutes('10:30', 45);
      expect(result).toBe('11:15:00');
    });

    it('should handle midnight rollover correctly', () => {
      const result = addMinutes('23:45', 30);
      expect(result).toBe('00:15:00');
    });
  });
});
