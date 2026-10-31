import {
  PaymentTransaction,
  PaymentFilterParams,
  PaymentMethodDetails,
} from "@/types/payment";
import {
  MOCK_PAYMENT_TRANSACTIONS,
  MOCK_SAVED_PAYMENT_METHODS,
} from "@/mockData/paymentsMock";

class PaymentService {
  async getPaymentTransactions(params?: PaymentFilterParams): Promise<PaymentTransaction[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = [...MOCK_PAYMENT_TRANSACTIONS];
        if (params?.status && params.status !== "all") {
          results = results.filter((txn) => txn.status === params.status);
        }
        if (params?.search) {
          const q = params.search.toLowerCase();
          results = results.filter(
            (txn) =>
              txn.transactionNumber.toLowerCase().includes(q) ||
              txn.invoiceNumber.toLowerCase().includes(q) ||
              txn.paymentMethod.brand?.toLowerCase().includes(q) ||
              txn.paymentMethod.last4?.includes(q)
          );
        }
        resolve(results);
      }, 150);
    });
  }

  async getSavedPaymentMethods(
    customerId: string = "cust_acme_corp"
  ): Promise<PaymentMethodDetails[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_SAVED_PAYMENT_METHODS);
      }, 150);
    });
  }

  async setDefaultPaymentMethod(
    paymentMethodId: string
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: "Primary payment method updated successfully.",
        });
      }, 300);
    });
  }
}

export const paymentService = new PaymentService();

