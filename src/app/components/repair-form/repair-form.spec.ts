import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepairForm } from './repair-form';

describe('RepairForm', () => {
  let component: RepairForm;
  let fixture: ComponentFixture<RepairForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RepairForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepairForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
