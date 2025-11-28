import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  addDoc,
  increment,
  query,
  where,
  getDocs,
  orderBy
} from '@angular/fire/firestore';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Observable } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-purchase-orders',
  standalone: false,
  templateUrl: './purchase-orders.html',
  styleUrls: ['./purchase-orders.scss'],
  animations: [
    trigger('slideFadeToggle', [
      state(
        'void',
        style({ height: '0px', opacity: 0, transform: 'translateY(-10px)', overflow: 'hidden' })
      ),
      state(
        '*',
        style({ height: '*', opacity: 1, transform: 'translateY(0)', overflow: 'hidden' })
      ),
      transition('void <=> *', animate('300ms ease-in-out')),
    ]),
  ],
})
export class PurchaseOrders implements OnInit {
  purchaseOrders$!: Observable<any[]>;
  subcategories: any[] = [];
  editingItemMap: { [key: string]: any } = {};
  expandedOrders: Set<string> = new Set();
itemSearchMap: { [orderId: string]: string } = {};
itemsPerPage = 5;

// Store pagination state per order
itemPages: { [orderId: string]: number } = {};

  constructor(private firestore: Firestore,private ps:ProductService) {}

getItemPage(orderId: string) {
  return this.itemPages[orderId] || 1;
}

setItemPage(orderId: string, page: number) {
  this.itemPages[orderId] = page;
}

filterItemsByName(order: any, search: string) {
  const items = order.items; // always use full list

  // Filter first
  let filtered = items;

  if (search && search.trim() !== '') {
    const term = search.toLowerCase();
    filtered = items.filter((item: any) =>
      item.name.toLowerCase().includes(term)
    );
  }

  // Then paginate filtered results
  const page = this.getItemPage(order.id);
  const start = (page - 1) * this.itemsPerPage;

  return filtered.slice(start, start + this.itemsPerPage);
}





getPaginatedItems(order: any) {
  const page = this.getItemPage(order.id);
  const start = (page - 1) * this.itemsPerPage;
  return order.items.slice(start, start + this.itemsPerPage);
}

getTotalItemPages(order: any) {
  return Math.ceil(order.items.length / this.itemsPerPage);
}

nextItemPage(order: any) {
  const page = this.getItemPage(order.id);
  if (page < this.getTotalItemPages(order)) {
    this.setItemPage(order.id, page + 1);
  }
}

prevItemPage(order: any) {
  const page = this.getItemPage(order.id);
  if (page > 1) {
    this.setItemPage(order.id, page - 1);
  }
}

  ngOnInit() {
    const ordersRef = collection(this.firestore, 'purchaseOrders');
    const ordersQuery = query(ordersRef, orderBy('date', 'desc'));
    this.purchaseOrders$ = collectionData(ordersQuery, { idField: 'id' });

    collectionData(collection(this.firestore, 'subcategories'), { idField: 'id' }).subscribe(
      (subs: any[]) => {
        this.subcategories = subs || [];
      }
    );
  }

  filterSubcategories(categoryId: number, search: string) {
  const list = this.subcategories.filter(s => s.categoryId === categoryId);

  if (!search) return list;

  return list.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );
}



  getFilteredItems(order: any) {
  const search = this.itemSearchMap[order.id]?.toLowerCase() || '';
  if (!search) return order.items;

  return order.items.filter((item: any) =>
    item.name.toLowerCase().includes(search)
  );
}


  // ----------------- Collapsible logic -----------------
toggleOrderItems(orderId: string) {
  if (this.expandedOrders.has(orderId)) {
    // If already expanded, collapse it
    this.expandedOrders.clear();
  } else {
    // Collapse all others and expand only this one
    this.expandedOrders.clear();
    this.expandedOrders.add(orderId);
  }
}

  isOrderExpanded(orderId: string): boolean {
    return this.expandedOrders.has(orderId);
  }

  // ----------------- Items & Subcategory -----------------
  getSubsForCategory(categoryId: string): any[] {
    if (!categoryId || !Array.isArray(this.subcategories)) return [];
    return this.subcategories.filter(
      (s) =>
        (typeof s.categoryId === 'string' ? s.categoryId : s.categoryId.id).trim() ===
        categoryId.trim()
    );
  }

  getEditingItem(orderId: string, item: any) {
    const key = `${orderId}_${item.productId}`;
    if (!this.editingItemMap[key]) {
      this.editingItemMap[key] = {
        receivedQty: item.receivedQty || 0,
        newPrice: item.receivedPrice || item.price || 0,
        subCategoryId: item.subCategoryId || '',
        subCategoryName: item.subCategoryName || '',
      };
    }
    return this.editingItemMap[key];
  }

  async onSubCategoryChange(orderId: string, item: any) {
    const editData = this.getEditingItem(orderId, item);
    if (!editData.subCategoryId) return;

    const subRef = doc(this.firestore, `subcategories/${editData.subCategoryId}`);
    const subSnap = await getDoc(subRef);

    if (subSnap.exists()) {
      const subData = subSnap.data() as any;
      editData.subCategoryName = subData.name;
    }
  }

  async saveItem(order: any, item: any) {
    if (order.status === 'completed') {
      return alert('Cannot edit completed order.');
    }

    const editData = this.getEditingItem(order.id, item);
    const subList = this.getSubsForCategory(item.categoryId);

    if (!editData.receivedQty || editData.receivedQty <= 0) {
      return alert('Enter received quantity');
    }

    if (subList.length > 0 && !editData.subCategoryId) {
      return alert('Please select a subcategory');
    }

    let subRef: any = null;
    if (editData.subCategoryId) {
      subRef = doc(this.firestore, `subcategories/${editData.subCategoryId}`);
    }

    const productsCollection = collection(this.firestore, 'products');
    let q;

    if (editData.subCategoryId) {
      q = query(
        productsCollection,
        where('name', '==', item.name),
        where('subcategoryId', '==', editData.subCategoryId)
      );
    } else {
      q = query(productsCollection, where('name', '==', item.name));
    }

    const existingProductsSnap = await getDocs(q);

    if (!existingProductsSnap.empty) {
      const prodDoc = existingProductsSnap.docs[0];
      const prodData = prodDoc.data() as any;

      await updateDoc(prodDoc.ref, {
        stock: (prodData.stock || 0) + Number(editData.receivedQty),
        price: editData.newPrice || prodData.price,
        // ✅ FIX: insert keywords
        keywords: this.ps.generateKeywords(item.name)
      });
    } else {
      await addDoc(productsCollection, {
        name: item.name,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        subcategoryId: editData.subCategoryId || null,
        subcategoryName: editData.subCategoryName || '',
        stock: Number(editData.receivedQty),
        price: editData.newPrice || item.price,
        minStock: 5,        
        // ✅ FIX: insert keywords
        keywords: this.ps.generateKeywords(item.name)
      });
    }

    if (subRef) {
      await updateDoc(subRef, { count: increment(Number(editData.receivedQty)) });
    }

    const updatedItems = order.items.map((p: any) =>
      p.productId === item.productId
        ? {
            ...p,
            received: true,
            receivedQty: editData.receivedQty,
            receivedPrice: editData.newPrice || p.price,
            subCategoryId: editData.subCategoryId,
            subCategoryName: editData.subCategoryName,
          }
        : p
    );

    const orderRef = doc(this.firestore, `purchaseOrders/${order.id}`);
    await updateDoc(orderRef, { items: updatedItems });

    const allReceived = updatedItems.every((it: any) => it.received === true);

    if (allReceived) {
      await updateDoc(orderRef, { status: 'completed' });
      alert('Order completed successfully.');
    } else {
      alert(`${item.name} received (${editData.receivedQty}) successfully.`);
    }
  }

  getLowestPriceSubName(item: any): string | null {
    return item.subCategoryName || null;
  }

  async deleteOrder(orderId: string) {
    const orderRef = doc(this.firestore, `purchaseOrders/${orderId}`);
    const docSnap = await getDoc(orderRef);

    if (docSnap.exists() && docSnap.data()['status'] === 'completed') {
      return alert('Cannot delete completed order.');
    }

    if (!confirm('Are you sure you want to delete this purchase order?')) return;

    await deleteDoc(orderRef);
    alert('Purchase order deleted');
  }

  totalReceived(order: any) {
    return order.items.reduce((sum: number, i: any) => sum + (i.receivedQty || 0), 0);
  }

  totalReceivedPrice(order: any) {
    return order.items.reduce(
      (sum: number, i: any) =>
        sum + ((i.receivedPrice || i.price || 0) * (i.receivedQty || 0)),
      0
    );
  }

  // --------------------------------------------------------
  // 🚀 PRINT PDF (only for pending orders)
  // --------------------------------------------------------
  printPDF(order: any) {
    if (order.status === 'completed') return;

    const doc = new jsPDF();

    // ===== PAGE BORDER =====
    doc.setDrawColor(180);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287);

    // ===== WATERMARK =====
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(235);
    doc.setFontSize(48);
    doc.text('Sai Baba Cellpoint', 28, 165, { angle: 30 });

    // ===== LOGO =====
    const logo = 'assets/logo.png';
    doc.addImage(logo, 'PNG', 10, 8, 40, 38);

    // ===== HEADER =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Sai Baba Cellpoint', 105, 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Owner: Gedela Narendra', 105, 25, { align: 'center' });
    doc.text(
      'RTC Complex Center Gate, Opp Apollo, S.kota, Vizianagaram (AP) - 535145',
      105,
      31,
      { align: 'center' }
    );
    doc.text('Phone/WhatsApp: 9502049996', 105, 37, { align: 'center' });

    // Divider
    doc.line(10, 48, 200, 48);

    // ===== TITLE =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PURCHASE ORDER', 105, 60, { align: 'center' });

    // ===== ORDER DETAILS =====
    const formattedDate =
      order.date?.toDate
        ? order.date.toDate().toLocaleString()
        : new Date(order.date).toLocaleString();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    doc.text(`Order ID: ${order.id}`, 14, 75);
    doc.text(`Category: ${order.categoryName}`, 14, 83);
    doc.text(`Date: ${formattedDate}`, 14, 91);

    // ===== TABLE =====
    const tableBody = order.items.map((item: any, i: number) => [i + 1, item.name, item.orderQty]);

    autoTable(doc, {
      startY: 105,
      head: [['#', 'Item Name', 'Ordered Qty']],
      body: tableBody,
      styles: { fontSize: 11, valign: 'middle' },
      headStyles: { fillColor: [0, 102, 204], textColor: 255, fontSize: 12, fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'center', cellWidth: 18 }, 1: { halign: 'left', cellWidth: 120 }, 2: { halign: 'center', cellWidth: 40 } },
      margin: { left: 14, right: 14 },
    });

    const finalY =
      (doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY
        ? (doc as any).lastAutoTable.finalY
        : doc.internal.pageSize.height - 60;

    const totalQty = order.items.reduce((sum: number, item: any) => sum + item.orderQty, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Total Ordered Quantity: ${totalQty}`, 14, finalY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text('Thank you for choosing Sai Baba Cellpoint', 105, doc.internal.pageSize.height - 10, {
      align: 'center',
    });

    doc.save(`PurchaseOrder-${order.id}.pdf`);
  }
}
