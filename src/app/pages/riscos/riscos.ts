import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Risco {
  id: number;
  setor: string;
  risco: string;
  nivel: 'Alto' | 'Médio' | 'Baixo';
  situacao: 'Ativo' | 'Inativo';
  icone: string;
}

@Component({
  selector: 'app-riscos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './riscos.html',
  styleUrl: './riscos.scss',
})
export class Riscos {
  busca = '';
  nivelFiltro = 'Todos';
  situacaoFiltro = 'Todos';

  niveis = ['Todos', 'Alto', 'Médio', 'Baixo'];
  situacoes = ['Todos', 'Ativo', 'Inativo'];

  riscos: Risco[] = [
    { id: 1, setor: 'Oficina Mecânica', risco: 'Contato com Produtos Químicos', nivel: 'Médio', situacao: 'Ativo', icone: 'bi-wrench' },
    { id: 2, setor: 'Acidente', risco: 'Atropelamento por Manobra de Ônibus', nivel: 'Alto', situacao: 'Ativo', icone: 'bi-shield-exclamation' },
    { id: 3, setor: 'Manutenção Elétrica', risco: 'Choque Elétrico', nivel: 'Alto', situacao: 'Ativo', icone: 'bi-lightning-charge' },
    { id: 4, setor: 'Lavagem de Veículos', risco: 'Chão Molhado e Escorregadio', nivel: 'Médio', situacao: 'Ativo', icone: 'bi-droplet' },
  ];

  get totalRiscos(): number {
    return this.riscos.length;
  }

  get totalAltos(): number {
    return this.riscos.filter(r => r.nivel === 'Alto').length;
  }

  get totalMedios(): number {
    return this.riscos.filter(r => r.nivel === 'Médio').length;
  }

  get totalBaixos(): number {
    return this.riscos.filter(r => r.nivel === 'Baixo').length;
  }

  get riscosFiltrados(): Risco[] {
    return this.riscos.filter(risco => {
      const termo = this.busca.trim().toLowerCase();
      const correspondeBusca =
        !termo ||
        risco.setor.toLowerCase().includes(termo) ||
        risco.risco.toLowerCase().includes(termo);
      const correspondeNivel =
        this.nivelFiltro === 'Todos' || risco.nivel === this.nivelFiltro;
      const correspondeSituacao =
        this.situacaoFiltro === 'Todos' || risco.situacao === this.situacaoFiltro;
      return correspondeBusca && correspondeNivel && correspondeSituacao;
    });
  }

  filtrar(): void {
    // A filtragem é aplicada automaticamente pelo getter.
  }

  limpar(): void {
    this.busca = '';
    this.nivelFiltro = 'Todos';
    this.situacaoFiltro = 'Todos';
  }
}
