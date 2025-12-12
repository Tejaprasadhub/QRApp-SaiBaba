import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  limit,
  startAfter,
  getDocs,
  writeBatch,
  doc
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class ProductKeywordUpdateService {

  constructor(private firestore: Firestore) {}

  // -------------------------------------
  // Generate Keywords (your logic)
  // -------------------------------------
  generateKeywords(text: string): string[] {
    text = (text || '').toLowerCase().trim();

    const keywords = new Set<string>();
    if (!text) return [];

    const firstSplit = text.split(/\//).map(t => t.trim()).filter(Boolean);

    for (let chunk of firstSplit) {
      keywords.add(chunk);

    //   const spaceParts = chunk.split(/\s+/).filter(Boolean);
    //   for (let part of spaceParts) {
    //     keywords.add(part);
    //   }
    }

    return Array.from(keywords);
  }

  // -------------------------------------
  // minStock logic
  // -------------------------------------
  getMinStock(categoryName: string, keywordCount: number): number {
  const cat = (categoryName || "").trim().toUpperCase();

  // -------------------------
  // CATEGORY: DISPLAYS
  // -------------------------
  if (cat === "DISPLAYS") {
  if (keywordCount <= 2) return 2;
  if (keywordCount <= 4) return 3;
  return 5;
}


  // -------------------------
  // CATEGORY: Always 2
  // -------------------------
  const min2Categories = [
    "CC BOARD",
    "UV GLASS",
    "ON OFF STRIPS",
    "MIDDLE FRAMES",
    "OUTER BUTTONS",
    "BACK CAPS",
  ];

  if (min2Categories.includes(cat)) return 2;

  // -------------------------
  // CATEGORY: Always 1
  // -------------------------
  const min1Categories = [
    "SIM SLOTS",
    "WATCHES",
    "BATTERIES",
    "RINGER KITS",
  ];

  if (min1Categories.includes(cat)) return 1;

  // -------------------------
  // Default
  // -------------------------
  return 0; // safer default
}


  // -------------------------------------
  // Batch Update Script + isLowStock
  // -------------------------------------
  async updateAllProducts() {
    const productCol = collection(this.firestore, 'products');
    let lastDoc: any = null;
    let batchNumber = 1;

    while (true) {
      let q;

      if (lastDoc) {
        q = query(productCol, startAfter(lastDoc), limit(200));
      } else {
        q = query(productCol, limit(200));
      }

      const snap = await getDocs(q);
      if (snap.empty) {
        alert("✅ All products updated.");
        break;
      }

      console.log(`⚙ Updating batch #${batchNumber} (${snap.size} products)`);

      const batch = writeBatch(this.firestore);

      snap.docs.forEach(d => {
        const data = d.data() as any;

        const name = data.name || "";
        const stock = data.stock || 0;

        // Generate keywords
        const keywords = this.generateKeywords(name);
        const minStock = this.getMinStock(data.categoryName,keywords.length);

        // 🔥 NEW: Calculate low-stock field
        const isLowStock = stock < minStock;

        // Update Firestore doc
        batch.update(doc(this.firestore, 'products', d.id), {
          keywords,
          minStock,
          isLowStock  // 🔥 new field
        });
      });

      await batch.commit();
      console.log(`✔ Batch #${batchNumber} committed.`);

      lastDoc = snap.docs[snap.docs.length - 1];
      batchNumber++;
    }
  }
}
