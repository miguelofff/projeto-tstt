<div class="login-page">

    <div class="overlay"></div>

    <div class="login-box">

        <img src="/img/logo.png" class="logo" alt="Logo">

        <h2>Acesse sua conta</h2>

        <p>
            Digite seu nome e senha para acessar a plataforma
        </p>

       <form (ngSubmit)="fazerLogin()" class="login-form">
  <h2>Login</h2>

  <input [(ngModel)]="usuario" name="usuario" type="text" placeholder="Usuário" required />
  <input [(ngModel)]="senha" name="senha" type="password" placeholder="Senha" required />

  <button type="submit">Entrar</button>
</form>

        <a href="#">
            Recuperar Senha
        </a>

        <span class="termos">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade
        </span>

    </div>

</div>

