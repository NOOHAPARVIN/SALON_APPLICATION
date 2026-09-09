import { NextResponse } from 'next/server';
import { sendInvoiceEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { toEmail, customerName, invoiceId, appointmentDate, services, tips, totalAmount, paymentMethod, branch } = body;

    if (!toEmail || !toEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid customer email address is required.' }, { status: 400 });
    }

    const result = await sendInvoiceEmail({
      toEmail: toEmail.trim(),
      customerName: customerName || 'Valued Customer',
      invoiceId: invoiceId || `#INV-${Date.now().toString().slice(-4)}`,
      appointmentDate: appointmentDate || new Date().toISOString().split('T')[0],
      services: services || [],
      tips: Number(tips) || 0,
      totalAmount: Number(totalAmount) || 0,
      paymentMethod: paymentMethod || 'Cash',
      salonName: branch ? `Salon (${branch})` : 'Salon Management',
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.dispatched
          ? `Invoice email sent successfully to ${toEmail}`
          : `Invoice processed for ${toEmail} (SMTP active/simulated)`
      });
    } else {
      return NextResponse.json({ error: result.error || 'Failed to send invoice email' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error while sending invoice email' }, { status: 500 });
  }
}
