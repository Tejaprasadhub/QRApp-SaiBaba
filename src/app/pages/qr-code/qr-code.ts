import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.html',
  styleUrls: ['./qr-code.scss'],
  standalone: false
})
export class QrCodeComponent implements OnInit {
  shopName: string = 'Sai Baba Cell Point';
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  
  // 👇 Directly link to the customer form route
  qrData = 'https://tejaprasadhub.github.io/#/qr-redirect';
  
  qrGenerated = false;

  ngOnInit() {
    this.generateQRCode();
  }

  generateQRCode() {
    try {
      QRCode.toCanvas(this.canvas.nativeElement, this.qrData, {
        width: 250,
        margin: 2,
        color: {
          dark: '#ff6a00',  // Orange shade
          light: '#ffffff', // White background
        },
      });
      this.qrGenerated = true;
    } catch (error) {
      console.error('QR code generation failed:', error);
    }
  }

  downloadQR() {
    const canvas = this.canvas.nativeElement;
    const link = document.createElement('a');
    link.download = 'customer-form-qr.png';
    link.href = canvas.toDataURL();
    link.click();
  }
}
