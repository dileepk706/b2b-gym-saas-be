import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status';
import ISubscriptionController from '@/module/subscription/domain/interfaces/subscription.controller.interface.js';
import ISubscriptionService from '@/module/subscription/domain/interfaces/subscription.service.interface.js';
import { sendSuccess } from '@/shared/response_handler.js';
import { ApiError } from '@/shared/middleware/error_handler.js';

@injectable()
class SubscriptionController implements ISubscriptionController {
  constructor(
    @inject('ISubscriptionService')
    private readonly subscriptionService: ISubscriptionService,
  ) {}

  // ── Checkout ────────────────────────────────────────────────────────────────

  createCheckoutSession = async (req: Request, res: Response): Promise<any> => {
    const tenantId = req.user.tenant_id!;
    const { plan_id } = req.body as { plan_id: string };

    const result = await this.subscriptionService.createCheckoutSession(tenantId, plan_id);
    return sendSuccess(res, result, 'Checkout session created', httpStatus.CREATED);
  };

  completeCheckout = async (req: Request, res: Response): Promise<any> => {
    const tenantId = req.user.tenant_id!;
    const { sessionId } = req.params;

    const result = await this.subscriptionService.completeCheckout(tenantId, sessionId as string);
    return sendSuccess(res, result, 'Subscription activated successfully', httpStatus.OK);
  };

  // ── Read ────────────────────────────────────────────────────────────────────

  getCurrentSubscription = async (req: Request, res: Response): Promise<any> => {
    const tenantId = req.user.tenant_id!;

    const result = await this.subscriptionService.getCurrentSubscription(tenantId);
    if (!result) throw new ApiError('No active subscription found', httpStatus.NOT_FOUND);

    return sendSuccess(res, result, 'Current subscription fetched', httpStatus.OK);
  };

  getSubscriptionHistory = async (req: Request, res: Response): Promise<any> => {
    const tenantId = req.user.tenant_id as string;

    const history = await this.subscriptionService.getSubscriptionHistory(tenantId);
    return sendSuccess(res, history, 'Subscription history fetched', httpStatus.OK);
  };

  // ── Plan changes ────────────────────────────────────────────────────────────

  upgrade = async (req: Request, res: Response): Promise<any> => {
    const tenantId = req.user.tenant_id as string;
    const { plan_id } = req.body as { plan_id: string };

    const result = await this.subscriptionService.upgrade(tenantId, plan_id);
    return sendSuccess(res, result, 'Subscription upgraded successfully', httpStatus.OK);
  };

  downgrade = async (req: Request, res: Response): Promise<any> => {
    const tenantId = req.user.tenant_id as string;
    const { plan_id } = req.body as { plan_id: string };

    const result = await this.subscriptionService.downgrade(tenantId, plan_id);
    return sendSuccess(
      res,
      result,
      'Downgrade scheduled. Your current plan remains active until the billing period ends.',
      httpStatus.OK,
    );
  };

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  cancel = async (req: Request, res: Response): Promise<any> => {
    const tenantId = req.user.tenant_id as string;

    const subscription = await this.subscriptionService.cancel(tenantId);
    return sendSuccess(
      res,
      subscription,
      'Subscription cancelled. Access remains until the billing period ends.',
      httpStatus.OK,
    );
  };

  reactivate = async (req: Request, res: Response): Promise<any> => {
    const tenantId = req.user.tenant_id as string;

    const result = await this.subscriptionService.reactivate(tenantId);
    return sendSuccess(res, result, 'Subscription reactivated successfully', httpStatus.OK);
  };

  // ── Invoices ────────────────────────────────────────────────────────────────

  getInvoices = async (req: Request, res: Response): Promise<any> => {
    const tenantId = req.user.tenant_id as string;

    const invoices = await this.subscriptionService.getInvoices(tenantId);
    return sendSuccess(res, invoices, 'Invoices fetched', httpStatus.OK);
  };

  getInvoiceById = async (req: Request, res: Response): Promise<any> => {
    const tenantId = req.user.tenant_id!;
    const { invoiceId } = req.params;

    const invoice = await this.subscriptionService.getInvoiceById(tenantId, invoiceId as string);
    if (!invoice) throw new ApiError('Invoice not found', httpStatus.NOT_FOUND);

    return sendSuccess(res, invoice, 'Invoice fetched', httpStatus.OK);
  };
}

export default SubscriptionController;
