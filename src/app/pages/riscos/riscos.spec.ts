import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Riscos } from './riscos';

describe('Riscos', () => {
  let component: Riscos;
  let fixture: ComponentFixture<Riscos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Riscos],
    }).compileComponents();

    fixture = TestBed.createComponent(Riscos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
