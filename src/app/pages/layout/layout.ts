import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Topbar } from "../topbar/topbar";
import { Sidebar } from "../sidebar/sidebar";
import { Footer } from "../footer/footer";
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    Topbar
],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {

   menuPerfilAberto = false;


  constructor(
    public authService: AuthService
  ) {}

   fecharMenuPerfil(): void {
    this.menuPerfilAberto = false;
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}