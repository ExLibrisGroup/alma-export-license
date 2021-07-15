/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CollectionPickerDialog } from './collection-picker.component';

describe('CollectionPickerComponent', () => {
  let component: CollectionPickerDialog;
  let fixture: ComponentFixture<CollectionPickerDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollectionPickerDialog ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionPickerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
