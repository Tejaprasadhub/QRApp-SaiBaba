import { Component } from '@angular/core';

@Component({
  selector: 'app-thank-you',
  standalone: false,
  templateUrl: './thank-you.html',
  styleUrl: './thank-you.scss',
})
export class ThankYou {
currentYear = new Date().getFullYear();
 // ⚠️ Replace with your actual WhatsApp Channel invite link
  channelLink = 'https://chat.whatsapp.com/H71ZWPWoke3HnhjDEH3EB4?mode=wwt';
  saveContact() {
    const contactVCard = `
BEGIN:VCARD
VERSION:3.0
FN:Sai Baba Cell Point
TEL:+919876543210
EMAIL:info@mobileworld.com
ADR:;;Main Road, Hyderabad, India;;;;
END:VCARD
`;
    const blob = new Blob([contactVCard], { type: 'text/vcard' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'SaiBabaCellPoint.vcf';
    link.click();
  }

   joinWhatsAppChannel() {
    // Opens channel in a new tab
    window.open(this.channelLink, '_blank', 'noopener');
  }
}
