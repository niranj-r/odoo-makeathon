import { Invoice, InvoiceFilterParams } from "@/types/invoice";
import { MOCK_INVOICES } from "@/mockData/invoicesMock";

class InvoiceService {
  async getInvoices(params?: InvoiceFilterParams): Promise<Invoice[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = [...MOCK_INVOICES];
        if (params?.status && params.status !== "all") {
          results = results.filter((inv) => inv.status === params.status);
        }
        if (params?.search) {
          const q = params.search.toLowerCase();
          results = results.filter(
            (inv) =>
              inv.invoiceNumber.toLowerCase().includes(q) ||
              inv.customerName.toLowerCase().includes(q) ||
              inv.items.some((it) => it.description.toLowerCase().includes(q))
          );
        }
        resolve(results);
      }, 150);
    });
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const found = MOCK_INVOICES.find((inv) => inv.id === id || inv.invoiceNumber === id);
        resolve(found || null);
      }, 100);
    });
  }
}

export const invoiceService = new InvoiceService();

