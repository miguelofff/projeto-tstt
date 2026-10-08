import { Injectable } from '@angular/core';

export type Perfil = 'admin' | 'colaborador';

interface Usuario {
  usuario: string;
  senha: string;
  perfil: Perfil;
  nome: string;
  pergunta: string;
  resposta: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private usuarios: Usuario[] = [
    {
      usuario: 'admin',
      senha: '1234',
      perfil: 'admin',
      nome: 'Administrador',
      pergunta: 'Qual é o nome do sistema?',
      resposta: 'tst'
    },
    {
      usuario: 'João da Silva',
      senha: '2345',
      perfil: 'colaborador',
      nome: 'João da Silva',
      pergunta: 'Qual é o nome do sistema?',
      resposta: 'tst'
    }
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      this.carregarUsuarios();
    }
  }

  
  private carregarUsuarios(): void {

    if (typeof window === 'undefined') {
      return;
    }

    const usuariosSalvos = localStorage.getItem('usuarios');

    if (usuariosSalvos) {

      try {

        this.usuarios = JSON.parse(usuariosSalvos);

      } catch (erro) {

        console.error(
          'Erro ao carregar usuários:',
          erro
        );

        localStorage.removeItem('usuarios');

        this.salvarUsuarios();
      }

    } else {

      this.salvarUsuarios();
    }
  }

 
  private salvarUsuarios(): void {

    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(
      'usuarios',
      JSON.stringify(this.usuarios)
    );
  }

  login(
    usuario: string,
    senha: string
  ): boolean {

    const usuarioEncontrado = this.usuarios.find(
      u =>
        u.usuario.toLowerCase().trim()
        === usuario.toLowerCase().trim()
        &&
        u.senha === senha
    );

    if (!usuarioEncontrado) {
      return false;
    }

    if (typeof window !== 'undefined') {

      localStorage.setItem(
        'isLoggedIn',
        'true'
      );

      localStorage.setItem(
        'perfil',
        usuarioEncontrado.perfil
      );

      localStorage.setItem(
        'nomeUsuario',
        usuarioEncontrado.nome
      );
    }

    return true;
  }


  recuperarUsuario(
    usuario: string
  ): Usuario | null {

    const usuarioEncontrado = this.usuarios.find(
      u =>
        u.usuario.toLowerCase().trim()
        === usuario.toLowerCase().trim()
    );

    return usuarioEncontrado || null;
  }

  
  verificarResposta(
    usuario: string,
    resposta: string
  ): boolean {

    const usuarioEncontrado =
      this.recuperarUsuario(usuario);

    if (!usuarioEncontrado) {
      return false;
    }

    return (
      usuarioEncontrado.resposta
        .toLowerCase()
        .trim()
      ===
      resposta
        .toLowerCase()
        .trim()
    );
  }

 
  alterarSenha(
    usuario: string,
    novaSenha: string
  ): boolean {

    const indice = this.usuarios.findIndex(
      u =>
        u.usuario.toLowerCase().trim()
        === usuario.toLowerCase().trim()
    );

    if (indice === -1) {
      return false;
    }

    this.usuarios[indice].senha = novaSenha;

    this.salvarUsuarios();

    return true;
  }


  logout(): void {

    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem(
      'isLoggedIn'
    );

    localStorage.removeItem(
      'perfil'
    );

    localStorage.removeItem(
      'nomeUsuario'
    );
  }

  
  isAuthenticated(): boolean {

    if (typeof window === 'undefined') {
      return false;
    }

    return (
      localStorage.getItem(
        'isLoggedIn'
      ) === 'true'
    );
  }

 
  getPerfil(): Perfil | null {

    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem(
      'perfil'
    ) as Perfil | null;
  }


  isAdmin(): boolean {
    return this.getPerfil() === 'admin';
  }

 
  isColaborador(): boolean {
    return this.getPerfil() === 'colaborador';
  }

 
  getNomeUsuario(): string {

    if (typeof window === 'undefined') {
      return '';
    }

    return (
      localStorage.getItem(
        'nomeUsuario'
      ) || ''
    );
  }

  
  getUsuarioLogado(): {
    nome: string;
    role: string;
  } | null {

    if (typeof window === 'undefined') {
      return null;
    }

    const nome =
      localStorage.getItem(
        'nomeUsuario'
      );

    const perfil =
      localStorage.getItem(
        'perfil'
      );

    if (!nome || !perfil) {
      return null;
    }

    return {
      nome: nome,
      role: perfil
    };
  }
}