import { generateWhatsAppUrl } from "@/features/quotations/domain/quotation-types";

export type ReceiptCustomData = {
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  voucherNumber: string;
  receiptDate: string;
  sellerName: string;
  sellerPhone: string;
  sellerWhatsapp: string;
  sellerEmiratesId: string;
  carNumber: string;
  carBrand: string;
  carModel: string;
  carYear: string;
  vinChassis: string;
  condition: string;
  itemDescription: string;
  paymentMethod: string;
  purchasePrice: number;
  acknowledgementClause: string;
  sellerConfirmationClause: string;
  sellerSignerName: string;
  buyerSignerName: string;
};

export function generateReceiptWhatsAppMessage(receipt: {
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  voucherNumber: string;
  receiptDate: string;
  sellerName: string;
  sellerPhone?: string | null;
  sellerEmiratesId?: string | null;
  carNumber: string;
  carTitle: string;
  vinChassis?: string | null;
  condition?: string | null;
  purchasePrice: number;
  paymentMethod: string;
}): string {
  const bName = receipt.businessName || "Car Scrap Business";
  const bPhone = receipt.businessPhone || "+971 56 270 9960";
  const bAddress = receipt.businessAddress || "Sharjah 10 Industrial Area, UAE";

  const lines: string[] = [
    `🧾 *VEHICLE PURCHASE PAYMENT VOUCHER*`,
    `*${bName}*`,
    `📞 Call / WhatsApp: ${bPhone}`,
    `📍 ${bAddress}`,
    ``,
    `*Voucher Ref:* ${receipt.voucherNumber}`,
    `*Date:* ${receipt.receiptDate}`,
    ``,
    `👤 *Seller / Customer Details*`,
    `• Name: ${receipt.sellerName}`,
    receipt.sellerPhone ? `• Phone: ${receipt.sellerPhone}` : "",
    receipt.sellerEmiratesId ? `• Emirates ID: ${receipt.sellerEmiratesId}` : "",
    ``,
    `🚗 *Vehicle Acquisition Details*`,
    `• Vehicle: ${receipt.carTitle}`,
    receipt.vinChassis ? `• VIN / Chassis: ${receipt.vinChassis}` : "",
    receipt.condition ? `• Condition: ${receipt.condition}` : "",
    ``,
    `💵 *Payment Summary*`,
    `• Total Amount Paid: *AED ${receipt.purchasePrice.toLocaleString("en-US")}*`,
    `• Payment Method: ${receipt.paymentMethod}`,
    `• Status: Verified & Disbursed`,
    ``,
    `⚖️ *Transfer & Legal Acknowledgement*`,
    `_The seller acknowledges receipt of full payment of AED ${receipt.purchasePrice.toLocaleString("en-US")} as stated above and confirms transfer of full title & possession to ${bName} free from all prior traffic fines, liabilities, or legal claims._`,
    ``,
    `Thank you for doing business with ${bName}.`,
    `📞 ${bPhone}`,
  ];

  return lines.filter(Boolean).join("\n");
}

export { generateWhatsAppUrl };
