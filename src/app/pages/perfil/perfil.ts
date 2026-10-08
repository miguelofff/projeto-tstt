import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class Perfil {

  usuario: any = null;
  editando = false;

  constructor(public authService: AuthService) {
    this.carregarUsuario();
  }

  carregarUsuario(): void {
    this.usuario = this.authService.getUsuarioLogado();
  }

  editarPerfil(): void {
    this.editando = true;
  }

  cancelarEdicao(): void {
    this.carregarUsuario();
    this.editando = false;
  }

  salvarPerfil(): void {

    if (!this.usuario) {
      return;
    }

    localStorage.setItem(
      'usuarioLogado',
      JSON.stringify(this.usuario)
    );

    this.editando = false;

    alert('Perfil atualizado com sucesso!');
  }
}