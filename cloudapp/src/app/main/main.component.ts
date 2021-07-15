import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Entity } from '@exlibris/exl-cloudapp-angular-lib';
import { SelectEntityComponent } from 'eca-components';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  loading = false;
  selectedEntity: Entity = null;
  entityCount = 0;
  @ViewChild(SelectEntityComponent) selectEntityComponent: SelectEntityComponent;

  constructor( 
    private data: DataService,
    private router: Router,
  ) { }

  ngOnInit() {
  }

  ngOnDestroy(): void {
  }

  clear() {
    this.selectEntityComponent.clear();
  }

  next() {
    this.data.licenseCode = this.selectedEntity.code;
    this.router.navigate(['details']);
  }
}