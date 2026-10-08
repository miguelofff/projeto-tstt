import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  usuario = '';
  senha = '';

  // Controle da recuperação de senha
  recuperandoSenha = false;
  etapaRecuperacao = 1;

  usuarioRecuperacao = '';
  respostaRecuperacao = '';
  novaSenha = '';
  confirmarSenha = '';

  perguntaSeguranca = '';

  // Controle da mensagem flutuante
  mensagemFlutuante = '';
  mostrarMensagem = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  fazerLogin(): void {

    const sucesso = this.authService.login(
      this.usuario,
      this.senha
    );

    if (sucesso) {

      this.router.navigate(['/sistema']);

    } else {

      this.mostrarMensagemFlutuante(
        'Senha incorreta',
        'Verifique sua senha e tente novamente.'
      );
    }
  }

  abrirRecuperacao(): void {

    this.recuperandoSenha = true;
    this.etapaRecuperacao = 1;

    this.usuarioRecuperacao = '';
    this.respostaRecuperacao = '';
    this.novaSenha = '';
    this.confirmarSenha = '';
    this.perguntaSeguranca = '';
  }

  voltarLogin(): void {

    this.recuperandoSenha = false;
    this.etapaRecuperacao = 1;

    this.usuarioRecuperacao = '';
    this.respostaRecuperacao = '';
    this.novaSenha = '';
    this.confirmarSenha = '';
    this.perguntaSeguranca = '';
  }

  verificarUsuario(): void {

    if (!this.usuarioRecuperacao.trim()) {

      this.mostrarMensagemFlutuante(
        'Atenção',
        'Digite seu usuário para continuar.'
      );

      return;
    }

    const usuario = this.authService.recuperarUsuario(
      this.usuarioRecuperacao
    );

    if (!usuario) {

      this.mostrarMensagemFlutuante(
        'Usuário não encontrado',
        'Verifique o usuário informado.'
      );

      return;
    }

    this.perguntaSeguranca = usuario.pergunta;

    this.etapaRecuperacao = 2;
  }

  verificarResposta(): void {

    const correta = this.authService.verificarResposta(
      this.usuarioRecuperacao,
      this.respostaRecuperacao
    );

    if (!correta) {

      this.mostrarMensagemFlutuante(
        'Resposta incorreta',
        'A resposta de segurança está incorreta.'
      );

      return;
    }

    this.etapaRecuperacao = 3;
  }

  alterarSenha(): void {

    if (!this.novaSenha || !this.confirmarSenha) {

      this.mostrarMensagemFlutuante(
        'Atenção',
        'Preencha os dois campos de senha.'
      );

      return;
    }

    if (this.novaSenha.length < 4) {

      this.mostrarMensagemFlutuante(
        'Senha inválida',
        'A senha precisa ter pelo menos 4 caracteres.'
      );

      return;
    }

    if (this.novaSenha !== this.confirmarSenha) {

      this.mostrarMensagemFlutuante(
        'Senhas diferentes',
        'As duas senhas precisam ser iguais.'
      );

      return;
    }

    const alterada = this.authService.alterarSenha(
      this.usuarioRecuperacao,
      this.novaSenha
    );

    if (!alterada) {

      this.mostrarMensagemFlutuante(
        'Erro',
        'Não foi possível alterar a senha.'
      );

      return;
    }

    this.mostrarMensagemFlutuante(
      'Senha alterada',
      'Sua senha foi alterada com sucesso.'
    );

    setTimeout(() => {
      this.voltarLogin();
    }, 1500);
  }

  mostrarMensagemFlutuante(
    titulo: string,
    mensagem: string
  ): void {

    this.mensagemFlutuante =
      `${titulo}|${mensagem}`;

    this.mostrarMensagem = true;
  }

  fecharMensagem(): void {

    this.mostrarMensagem = false;
    this.mensagemFlutuante = '';
  }

  getTituloMensagem(): string {

    return this.mensagemFlutuante.split('|')[0] || '';
  }

  getTextoMensagem(): string {

    return this.mensagemFlutuante.split('|')[1] || '';
  }
}

