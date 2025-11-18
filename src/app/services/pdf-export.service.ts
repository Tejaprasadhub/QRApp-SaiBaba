import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {

  constructor() {}

  // -------------------------------------------------------------
  // EXPORT ALL / CATEGORY-WISE PURCHASE ORDERS LIST
  // -------------------------------------------------------------
  generatePurchaseOrderPDF(title: string, orders: any[]) {
    const doc = new jsPDF('p', 'mm', 'a4');

    // ---------------------------
    // HEADER WITH LOGO + BUSINESS DETAILS
    // ---------------------------
    try {
      doc.addImage('YOUR_LOGO_URL_HERE', 'PNG', 10, 10, 25, 25);
    } catch {}

    doc.setFontSize(16);
    doc.text('Sai Baba Cellpoint', 40, 15);

    doc.setFontSize(11);
    doc.text('Owner: Gedela Narendra', 40, 22);

    doc.text(
      'RTC complex center gate, opposite apollo,\nbeside rtc complex gandhi bomma,\nS.kota, Vizianagaram, Andhra Pradesh - 535145',
      40,
      28
    );

    doc.text('Phone: 9502049996 | WhatsApp: 9502049996', 40, 47);

    // TITLE
    doc.setFontSize(14);
    doc.text(title, 10, 60);

    // TABLE DATA
    const tableBody: any[] = [];

    orders.forEach((order, index) => {
      const totalValue = order.items.reduce(
        (sum: number, i: any) =>
          sum + ((i.receivedPrice || i.price || 0) * (i.receivedQty || 0)),
        0
      );

      tableBody.push([
        index + 1,
        new Date(order.date?.toDate?.() ?? order.date).toLocaleString(),
        order.categoryName,
        order.status.toUpperCase(),
        order.items.length,
        totalValue.toFixed(2),
      ]);
    });

    autoTable(doc, {
      startY: 70,
      head: [['S No', 'Date', 'Category', 'Status', 'Items', 'Total Value']],
      body: tableBody,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [40, 40, 40] },
    });

    // FOOTER
    doc.setFontSize(10);
    doc.text(
      'Thank you for choosing Sai Baba Cellpoint',
      10,
      doc.internal.pageSize.height - 10
    );

    doc.save(`PurchaseOrders.pdf`);
  }

  // -------------------------------------------------------------
  // EXPORT A SINGLE PURCHASE ORDER (DETAILED FORMAT)
  // -------------------------------------------------------------
  generateSingleOrderPDF(order: any) {
    const doc = new jsPDF('p', 'mm', 'a4');

    try {
      doc.addImage('YOUR_LOGO_URL_HERE', 'PNG', 10, 10, 25, 25);
    } catch {}

    doc.setFontSize(16);
    doc.text('Sai Baba Cellpoint', 40, 15);

    doc.setFontSize(10);
    doc.text(`Owner: Gedela Narendra`, 40, 22);
    doc.text(
      'RTC complex center gate, opposite apollo,\nbeside rtc complex gandhi bomma,\nS.kota, Vizianagaram, Andhra Pradesh - 535145',
      40,
      28
    );
    doc.text('Phone: 9502049996 | WhatsApp: 9502049996', 40, 47);

    doc.setFontSize(14);
    doc.text('Purchase Order Details', 10, 63);

    doc.setFontSize(11);
    doc.text(`Category: ${order.categoryName}`, 10, 75);
    doc.text(`Status: ${order.status.toUpperCase()}`, 10, 82);
    doc.text(
      `Date: ${
        new Date(order.date?.toDate?.() ?? order.date).toLocaleString()
      }`,
      10,
      89
    );

    // TABLE OF ITEMS
    const body: any[] = [];

    order.items.forEach((item: any) => {
      body.push([
        item.name,
        item.orderQty,
        item.receivedQty || 0,
        item.price || 0,
        item.receivedPrice || item.price || 0,
      ]);
    });

    autoTable(doc, {
      startY: 100,
      head: [['Item', 'Ordered', 'Received', 'Price', 'Final Price']],
      body,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 0, 0] },
    });

    doc.save(`PO-${order.categoryName}.pdf`);
  }
}
