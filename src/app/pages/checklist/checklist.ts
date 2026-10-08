import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './checklist.html',
  styleUrl: './checklist.scss',
})
export class Checklist {
  imprimirChecklist(): void {
    window.print();
  }
}
