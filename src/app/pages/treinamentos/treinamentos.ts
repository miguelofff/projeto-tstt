import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Treinamento } from './treinamento.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-treinamentos',
  standalone: true,
  imports: [RouterOutlet, FormsModule],
  templateUrl: './treinamentos.html',
  styleUrl: './treinamentos.scss',
})
export class Treinamentos implements OnInit {
  formularioAberto = false;
  treinamentoEditando: Treinamento | null = null;

  abrirFormulario() {
    this.formularioAberto = true;
  }

  fecharFormulario() {
    this.formularioAberto = false;
  }

  salvarTreinamento() {
    if (this.treinamentoEditando) {
      this.atualizarTreinamento();
    } else {
      this.criarTreinamento();
    }
  }

  criarTreinamento() {
    const novoId = this.treinamentos.length + 1;

    const treinamento: Treinamento = {
      ...this.novoTreinamento,
      id: novoId,
    };

    this.treinamentos.push(treinamento);

    this.saveLocalStorage();
    this.limparFormulario();
    this.fecharFormulario();
  }

  atualizarTreinamento() {
    const indice = this.treinamentos.findIndex(
      (treinamento) => treinamento.id === this.treinamentoEditando!.id,
    );

    if (indice !== -1) {
      this.treinamentos[indice] = {
        ...this.novoTreinamento,
        id: this.treinamentoEditando!.id,
      };
    }

    this.saveLocalStorage();
    this.limparFormulario();
    this.fecharFormulario();

    this.treinamentoEditando = null;
  }

  limparFormulario() {
    this.novoTreinamento = {
      id: 0,
      nome: '',
      norma: '',
      descricao: '',
      cargaHoraria: 0,
      validade: 0,
      participantes: 0,
      status: 'Ativo',
    };
  }

  saveLocalStorage() {
    localStorage.setItem('treinamentos', JSON.stringify(this.treinamentos));
  }

  ngOnInit() {
    this.loadLocalStorage();
  }

  loadLocalStorage() {
    const dados = localStorage.getItem('treinamentos');
    if (dados) {
      this.treinamentos = JSON.parse(dados);
    }
  }

  treinamentoVisualizado: Treinamento | null = null;

  verTreinamento(treinamento: Treinamento) {
    this.treinamentoVisualizado = treinamento;
  }

  fecharVisualizacao() {
    this.treinamentoVisualizado = null;
  }

  editarTreinamento(treinamento: Treinamento) {
    this.treinamentoEditando = treinamento;

    this.novoTreinamento = {
      ...treinamento,
    };

    this.formularioAberto = true;
  }

  novoTreinamento: Treinamento = {
    id: 0,
    nome: '',
    norma: '',
    descricao: '',
    cargaHoraria: 0,
    validade: 0,
    participantes: 0,
    status: 'Ativo',
  };

  treinamentos: Treinamento[] = [];
}
