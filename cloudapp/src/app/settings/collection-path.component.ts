import { CdkDragDrop, moveItemInArray, transferArrayItem } from "@angular/cdk/drag-drop";
import { Component, Input, OnInit } from "@angular/core";
import { FormArray } from "@angular/forms";
import { CollectionPathOptions } from "../models/settings";
import { AlmaService } from "../services/alma.service";

@Component({
  selector: 'app-collection-path',
  templateUrl: './collection-path.component.html',
  styleUrls: ['./collection-path.component.scss']
})
export class CollectionPathComponent implements OnInit {

  @Input() collectionPath: FormArray;
  collectionPathOptions: string[];

  constructor(
    private alma: AlmaService,
  ) { }

  ngOnInit() {
    this.collectionPathOptions = CollectionPathOptions.filter(o => !this.collectionPath.value.includes(o));
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.collectionPath.markAsDirty();
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.collectionPath.markAsDirty();
    }
  }
}