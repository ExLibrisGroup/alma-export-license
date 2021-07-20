import { Component, OnInit, Inject } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PromptDialog, PromptDialogData } from "eca-components";
import { Collection } from '../models/collection';
import { DataService } from '../services/data.service';
import { finalize } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-collection-picker',
  templateUrl: './collection-picker.component.html',
  styleUrls: ['./collection-picker.component.scss']
})
export class CollectionPickerDialog extends PromptDialog implements OnInit {
  loading = false;
  selected: Collection = null;
  treeControl = new NestedTreeControl<Collection>(node => node.children);
  dataSource = new MatTreeNestedDataSource<Collection>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PromptDialogData,
    public dialogRef: MatDialogRef<PromptDialog>,
    public translate: TranslateService,
    private dataService: DataService,
  ) { 
    super(data,translate,dialogRef);
    this.selected = data.val;
  }

  ngOnInit() {
    this.loading = true;
    this.dataService.collections
    .pipe(finalize(() => this.loading = false))
    .subscribe(collections => {
      this.dataSource.data = collections;
      this.openSelectedNode();
    })
  }

  hasChild = (_: number, node: Collection) => !!node.children && node.children.length > 0;

  select(node: Collection) {
    this.dialogRef.close(node);
  }

  openSelectedNode() {
    if (!this.selected) return;
    this.openNode(this.selected);
    setTimeout(() => {
      const element = document.querySelector('.selected');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    })
  }

  openNode(node: Collection) {
    const findNode = (data: Collection[], node: Collection) => {
      const find = (iter: Collection, index: number, obj: Collection[]) => {
        if (node.id === iter.id) {
            result.push(iter);
            return true;
        }
        if (Array.isArray(iter.children)) {
          result.push(iter) /* Push parent */
          return iter.children.find(find);
        } else if (index == obj.length-1) {
          result.pop() /* Finished searching, remove parent */;
          return false;
        }
      }
  
      let result: Collection[] = [];
      data.find(find);
      return result;
    }
    const found = findNode(this.dataSource.data, node).map(n => n.id);
    const expand = (node: Collection) => {
      if (node.children) node.children.forEach(expand);
      if (found.includes(node.id)) this.treeControl.expand(node);
    }
    this.dataSource.data.forEach(expand);
  }
}
