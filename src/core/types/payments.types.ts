export enum WebhookEvent {
  PaymentWaitingForCapture = 'payment.waiting_for_capture',
  PaymentSucceeded = 'payment.succeeded',
  PaymentCanceled = 'payment.canceled',
  RefundSucceeded = 'refund.succeeded',
  PayoutSucceeded = 'payout.succeeded',
  PayoutCanceled = 'payout.canceled',
  DealClosed = 'deal.closed',
}
