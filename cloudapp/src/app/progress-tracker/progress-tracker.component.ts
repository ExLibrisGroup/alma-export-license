import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-progress-tracker',
  templateUrl: './progress-tracker.component.html',
  styleUrls: ['./progress-tracker.component.scss']
})
export class ProgressTrackerComponent implements OnInit {

  dots: string = '';
  timer: any;

  private _steps: string[]
  @Input() set steps(steps: string[]) {
    this._steps = steps;
  }
  get steps() {
    return this._steps.slice(0, this._progress + 1)
  }

  private _progress: number = 0;
  get progress() {
    return this._progress;
  }

  get percent() {
    return (this._progress / this._steps.length) * 100
  }

  constructor() { }

  ngOnInit() { }

  setProgress (progress: string) {
    if (!~this._steps.indexOf(progress)) throw new Error("Invalid progress step");
    if (this.timer) clearTimeout(this.timer);
    this.dots = '';
    this._progress = this._steps.indexOf(progress);
    this.timer = setInterval(() => this.dots = this.dots.concat(' .'), 750);
  }

  complete() {
    if (this.timer) clearTimeout(this.timer);
    this._progress = this._steps.length;
  }
}
