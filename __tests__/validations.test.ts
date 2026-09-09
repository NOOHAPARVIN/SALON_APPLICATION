import { describe, it, expect } from 'vitest';
import { createBookingSchema } from '../lib/validations';

describe('Validations - createBookingSchema', () => {
  it('should accept a valid booking payload', () => {
    const validPayload = {
      customer: { name: "John Doe", phone: "+97433445566" },
      services: [{ service: "Haircut", price: 150, duration_minutes: 45 }],
      date: "2026-08-01",
      time: "10:00",
      branch: "rospa"
    };

    const result = createBookingSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('should reject a booking without customer name', () => {
    const invalidPayload = {
      customer: { name: "" }, // Invalid
      services: [{ service: "Haircut", price: 150, duration_minutes: 45 }],
      date: "2026-08-01",
      time: "10:00",
    };

    const result = createBookingSchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });
});
