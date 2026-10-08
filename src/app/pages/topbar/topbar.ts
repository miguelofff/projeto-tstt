import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // 👈 importe o serviço

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  searchTerm = '';

  usuario = {
    nome: 'Administrador',
  };

  // 👇 aqui você injeta o AuthService junto com o Router
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  resolveRoute(term: string): { path: string; queryParams?: Record<string, string> } {
    const normalized = term
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!normalized) {
      return { path: '/sistema' };
    }

    const routes = [
      { keywords: ['dashboard', 'inicio', 'inicial', 'painel'], path: '/sistema' },
      { keywords: ['treinamentos', 'treinamento'], path: '/sistema/treinamentos' },
      { keywords: ['treinamentos vencidos', 'vencidos', 'treinamento vencido'], path: '/sistema', queryParams: { search: 'treinamentos-vencidos' } },
      { keywords: ['epis', 'epi', 'equipamento de protecao individual', 'e pi'], path: '/sistema/epis' },
      { keywords: ['epis proximos do vencimento', 'epis proximo do vencimento', 'proximos do vencimento', 'vencimento epi'], path: '/sistema', queryParams: { search: 'epis-proximos' } },
      { keywords: ['riscos', 'risco', 'riscos criticos', 'risco critico'], path: '/sistema/riscos' },
      { keywords: ['checklist', 'check list', 'lista de seguranca', 'seguranca'], path: '/sistema/checklist' },
      { keywords: ['relatorios', 'relatorio'], path: '/sistema/relatorios' },
      { keywords: ['usuarios', 'usuario', 'funcionarios', 'funcionario'], path: '/sistema/usuarios' },
    ];

    const match = routes.find((entry) =>
      entry.keywords.some((keyword) => normalized.includes(keyword))
    );

    return match ?? { path: '/sistema' };
  }

  buscar(): void {
    const route = this.resolveRoute(this.searchTerm);
    this.router.navigate([route.path], {
      queryParams: route.queryParams ?? {},
    });
  }
}


