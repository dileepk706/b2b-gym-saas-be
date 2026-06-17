import { Request, Response } from 'express';

export default interface ISubscriptionController {
  // Checkout
  createCheckoutSession(req: Request, res: Response): Promise<any>;
  completeCheckout(req: Request, res: Response): Promise<any>;

  // Read
  getCurrentSubscription(req: Request, res: Response): Promise<any>;
  getSubscriptionHistory(req: Request, res: Response): Promise<any>;

  // Plan changes
  upgrade(req: Request, res: Response): Promise<any>;
  downgrade(req: Request, res: Response): Promise<any>;

  // Lifecycle
  cancel(req: Request, res: Response): Promise<any>;
  reactivate(req: Request, res: Response): Promise<any>;

  // Invoices
  getInvoices(req: Request, res: Response): Promise<any>;
  getInvoiceById(req: Request, res: Response): Promise<any>;
}
