import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrRedirect } from './qr-redirect';

describe('QrRedirect', () => {
  let component: QrRedirect;
  let fixture: ComponentFixture<QrRedirect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QrRedirect]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrRedirect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
