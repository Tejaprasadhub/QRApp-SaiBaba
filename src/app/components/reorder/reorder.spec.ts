import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reorder } from './reorder';

describe('Reorder', () => {
  let component: Reorder;
  let fixture: ComponentFixture<Reorder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Reorder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Reorder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
