import { AuthService } from '../../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RiscoUsuario {
  setor: string;
  risco: string;
  nivel: 'Baixo' | 'Médio' | 'Alto';
  situacao: 'Ativo' | 'Inativo';
  validade: string;
  validadeValida: boolean;
}

interface Usuario {
  id: number;
  nome: string;
  cargo: string;
  perfil: string;
  ativo: boolean;
  riscos: RiscoUsuario[];
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.scss']
})
export class UsuariosComponent implements OnInit {

  termoBusca = '';
  mensagem = '';

  usuarios: Usuario[] = [];

  usuariosFiltrados: Usuario[] = [];

  usuarioVisualizado: Usuario | null = null;
  usuarioSelecionado: Usuario | null = null;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {

    // Usuários cadastrados no sistema
    this.usuarios = [
      {
        id: 1,
        nome: 'Administrador',
        cargo: 'Administrador do Sistema',
        perfil: 'admin',
        ativo: true,
        riscos: []
      },
      {
        id: 2,
        nome: 'João da Silva',
        cargo: 'Colaborador',
        perfil: 'colaborador',
        ativo: true,
        riscos: []
      }
    ];

    const usuarioLogado = this.authService.getUsuarioLogado();

    if (!usuarioLogado) {
      this.usuariosFiltrados = [];
      return;
    }

    // ADM vê todos os usuários
    if (usuarioLogado.role === 'admin') {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }

    // COLABORADOR vê somente os próprios dados
    this.usuariosFiltrados = this.usuarios.filter(
      usuario => usuario.nome === usuarioLogado.nome
    );
  }

  buscarUsuario(): void {

    const termo = this.termoBusca.trim().toLowerCase();

    const usuarioLogado = this.authService.getUsuarioLogado();

    if (!usuarioLogado) {
      this.usuariosFiltrados = [];
      return;
    }

    let usuariosPermitidos: Usuario[];

    if (usuarioLogado.role === 'admin') {
      usuariosPermitidos = this.usuarios;
    } else {
      
      usuariosPermitidos = this.usuarios.filter(
        usuario => usuario.nome === usuarioLogado.nome
      );
    }

    if (!termo) {
      this.usuariosFiltrados = [...usuariosPermitidos];
      return;
    }

    this.usuariosFiltrados = usuariosPermitidos.filter(usuario =>
      usuario.nome.toLowerCase().includes(termo) ||
      usuario.cargo.toLowerCase().includes(termo) ||
      usuario.perfil.toLowerCase().includes(termo)
    );
  }

  visualizarUsuario(usuario: Usuario): void {

    const usuarioLogado = this.authService.getUsuarioLogado();

    if (!usuarioLogado) {
      return;
    }

   
    if (
      usuarioLogado.role === 'colaborador' &&
      usuario.nome !== usuarioLogado.nome
    ) {
      alert('Você não tem permissão para visualizar este usuário.');
      return;
    }

    this.usuarioVisualizado = usuario;
  }

  editarUsuario(usuario: Usuario): void {

    const usuarioLogado = this.authService.getUsuarioLogado();

    if (!usuarioLogado) {
      return;
    }

    // ADM pode editar qualquer usuário
    // Colaborador só pode editar a si mesmo
    const podeEditar =
      usuarioLogado.role === 'admin' ||
      usuario.nome === usuarioLogado.nome;

    if (!podeEditar) {
      alert('Você não tem permissão para editar este usuário.');
      return;
    }

    this.usuarioSelecionado = { ...usuario };
    this.mensagem = '';
  }

  salvarEdicao(): void {

    if (!this.usuarioSelecionado) {
      return;
    }

    const index = this.usuarios.findIndex(
      usuario => usuario.id === this.usuarioSelecionado!.id
    );

    if (index !== -1) {
      this.usuarios[index] = { ...this.usuarioSelecionado };
    }

    this.buscarUsuario();

    this.mensagem = 'Usuário atualizado com sucesso!';
    this.usuarioSelecionado = null;
  }

  cancelarEdicao(): void {
    this.usuarioSelecionado = null;
    this.mensagem = 'Edição cancelada.';
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isColaborador(): boolean {
    return this.authService.isColaborador();
  }
}