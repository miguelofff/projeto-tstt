import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  activeSearch: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.activeSearch = params.get('search');
    });
  }

  isCardActive(term: string): boolean {
    return !!this.activeSearch && this.activeSearch.toLowerCase().includes(term.toLowerCase());
  }
}
