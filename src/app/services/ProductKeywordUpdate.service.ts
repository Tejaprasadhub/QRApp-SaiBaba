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

      const spaceParts = chunk.split(/\s+/).filter(Boolean);
      for (let part of spaceParts) {
        keywords.add(part);
      }
    }

    return Array.from(keywords);
  }

  // -------------------------------------
  // minStock logic
  // -------------------------------------
  getMinStock(keywordCount: number): number {
    if (keywordCount <= 2) return 2;
    if (keywordCount <= 6) return 3;
    if (keywordCount <= 10) return 5;
    return 10;
  }

  // -------------------------------------
  // Batch Update Script
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

        // Use "name" field
        const keywords = this.generateKeywords(data.name || '');
        const minStock = this.getMinStock(keywords.length);

        batch.update(doc(this.firestore, 'products', d.id), {
          keywords,
          minStock // Firestore field uses camelCase
        });
      });

      await batch.commit();
      console.log(`✔ Batch #${batchNumber} committed.`);

      lastDoc = snap.docs[snap.docs.length - 1];
      batchNumber++;
    }
  }
}
