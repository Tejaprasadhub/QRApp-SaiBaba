import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesList } from './sales-list';

describe('SalesList', () => {
  let component: SalesList;
  let fixture: ComponentFixture<SalesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SalesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
