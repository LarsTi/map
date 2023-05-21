import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-error-list',
  templateUrl: './error-list.component.html',
  styleUrls: ['./error-list.component.css'] 
})
export class ErrorListComponent implements OnChanges{
  
  visible: boolean = false;
  @Input() error: {text: string}[] = [];  

  ngOnChanges(changes: SimpleChanges): void {
    if(this.error.length > 0){
      this.visible = true;
    } 
  }
  onHide(){
    this.visible = false;
    this.error = [];
  }
  
}
