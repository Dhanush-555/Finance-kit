import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generateReceiptPDF = async (data: {
  receiptNo: string;
  date: string;
  customerName: string;
  amount: number;
  paymentFor: string;
  paymentMode: string;
}) => {
  const element = document.createElement('div');
  element.style.padding = '40px';
  element.style.width = '600px';
  element.style.background = 'white';
  element.style.fontFamily = 'Inter, sans-serif';
  
  element.innerHTML = `
    <div style="border: 2px solid #e2e8f0; border-radius: 24px; padding: 40px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; background: #10b981; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 24px;">FK</div>
          <div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">FinanceKit</h1>
            <p style="margin: 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Official Receipt</p>
          </div>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 800;">Receipt No</p>
          <p style="margin: 0; font-size: 14px; font-weight: 800; color: #0f172a;">#${data.receiptNo}</p>
        </div>
      </div>

      <div style="margin-bottom: 40px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div>
            <p style="margin: 0 0 4px 0; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 800;">Date</p>
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #334155;">${data.date}</p>
          </div>
          <div>
            <p style="margin: 0 0 4px 0; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 800;">Payment Mode</p>
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #334155;">${data.paymentMode}</p>
          </div>
        </div>
      </div>

      <div style="background: #f1f5f9; border-radius: 16px; padding: 24px; margin-bottom: 40px;">
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 4px 0; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 800;">Received From</p>
          <p style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">${data.customerName}</p>
        </div>
        <div>
          <p style="margin: 0 0 4px 0; font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 800;">Payment For</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #475569;">${data.paymentFor}</p>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; color: #10b981; margin-bottom: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Verified Payment</span>
          </div>
          <p style="margin: 0; font-size: 10px; color: #94a3b8;">Generated via FinanceKit Premium</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 700;">Total Amount Paid</p>
          <p style="margin: 0; font-size: 32px; font-weight: 900; color: #10b981; letter-spacing: -1px;">₹${data.amount.toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(element);
  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  document.body.removeChild(element);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [600, canvas.height / 2 + 80]
  });

  pdf.addImage(imgData, 'PNG', 0, 0, 600, canvas.height / 2);
  return pdf;
};

export const sendWhatsAppReceipt = (phoneNumber: string, data: {
  customerName: string;
  amount: number;
  paymentFor: string;
}) => {
  const message = `*FinanceKit Receipt*%0A--------------------------%0A*Customer:* ${data.customerName}%0A*Amount:* ₹${data.amount.toLocaleString()}%0A*Payment For:* ${data.paymentFor}%0A*Status:* Verified ✅%0A%0A_Thank you for your payment!_`;
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
};
