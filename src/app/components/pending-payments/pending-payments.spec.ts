import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingPayments } from './pending-payments';

describe('PendingPayments', () => {
  let component: PendingPayments;
  let fixture: ComponentFixture<PendingPayments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PendingPayments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingPayments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
