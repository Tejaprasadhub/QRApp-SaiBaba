import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepairsList } from './repairs-list';

describe('RepairsList', () => {
  let component: RepairsList;
  let fixture: ComponentFixture<RepairsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RepairsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepairsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
