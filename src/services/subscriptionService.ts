import {
  CustomerSubscription,
  ChangePlanPayload,
  PauseSubscriptionPayload,
  CancelSubscriptionPayload,
} from "@/types/subscription";
import { MOCK_CUSTOMER_SUBSCRIPTIONS } from "@/mockData/subscriptionsMock";

class SubscriptionService {
  async getCustomerSubscriptions(
    customerId: string = "cust_acme_corp"
  ): Promise<CustomerSubscription[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_CUSTOMER_SUBSCRIPTIONS);
      }, 150);
    });
  }

  async changePlan(payload: ChangePlanPayload): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Subscription plan change to ${payload.newPlanId} scheduled successfully.`,
        });
      }, 300);
    });
  }

  async pauseSubscription(
    payload: PauseSubscriptionPayload
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Subscription ${payload.subscriptionId} paused until ${payload.resumeDate || "further notice"}.`,
        });
      }, 300);
    });
  }

  async cancelSubscription(
    payload: CancelSubscriptionPayload
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Subscription ${payload.subscriptionId} cancellation request processed. Access remains active until billing period end.`,
        });
      }, 300);
    });
  }
}

export const subscriptionService = new SubscriptionService();

