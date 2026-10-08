import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [RouterOutlet, FormsModule],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.scss',
})
export class Relatorios {
  relatorioSelecionado: string = '';


  // =====================================================
  // EXPORTAR PDF
  // =====================================================

  exportarPDF(): void {

    if (!this.relatorioSelecionado) {
      alert('Selecione um relatório.');
      return;
    }


    const pdf = new jsPDF();

     // TÍTULO
    pdf.setFontSize(20);

    pdf.text(
      'Relatório de Segurança e Saúde do Trabalho',
      14,
      20
    );


    // SUBTÍTULO
    pdf.setFontSize(11);

    pdf.text(
      this.getNomeRelatorio(),
      14,
      30
    );


    pdf.text(
      'Período: Junho de 2026',
      14,
      38
    );

      // DADOS
    const dados = this.getDadosRelatorio();


    autoTable(pdf, {

      startY: 48,

      head: [
        dados.colunas
      ],

      body: dados.linhas,

      theme: 'grid',

      headStyles: {
        fillColor: [31, 41, 55],
        textColor: 255
      }

    });

    // RODAPÉ
    pdf.setFontSize(9);

    pdf.text(
      'Sistema TST - Segurança e Saúde do Trabalho',
      14,
      285
    );


    // DOWNLOAD
    pdf.save(
      `${this.relatorioSelecionado}-junho-2026.pdf`
    );

  }


  // =====================================================
  // EXPORTAR EXCEL
  // =====================================================

  exportarExcel(): void {

    if (!this.relatorioSelecionado) {
      alert('Selecione um relatório.');
      return;
    }


    const dados = this.getDadosRelatorio();


    const worksheet: XLSX.WorkSheet =
      XLSX.utils.aoa_to_sheet([

        dados.colunas,

        ...dados.linhas

      ]);


    const workbook: XLSX.WorkBook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Relatório'
    );


    const excelBuffer =
      XLSX.write(workbook, {

        bookType: 'xlsx',

        type: 'array'

      });


    const arquivo =
      new Blob(
        [excelBuffer],
        {
          type:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      );


    saveAs(
      arquivo,
      `${this.relatorioSelecionado}-junho-2026.xlsx`
    );

  }


  // =====================================================
  // NOME DO RELATÓRIO
  // =====================================================

  getNomeRelatorio(): string {

    switch (this.relatorioSelecionado) {

      case 'geral':
        return 'Relatório Geral';

      case 'funcionarios':
        return 'Relatório de Funcionários';

      case 'treinamentos':
        return 'Relatório de Treinamentos';

      case 'epis':
        return 'Relatório de EPIs';

      case 'riscos':
        return 'Relatório de Riscos Ocupacionais';

      case 'inspecoes':
        return 'Relatório de Inspeções';

      case 'checklist':
        return 'Relatório de Checklist de Segurança';

      default:
        return 'Relatório';

    }

  }


  // =====================================================
  // DADOS DOS RELATÓRIOS
  // =====================================================

  getDadosRelatorio(): {
    colunas: string[],
    linhas: any[][]
  } {


    switch (this.relatorioSelecionado) {


      // -----------------------------------------------
      // RELATÓRIO GERAL
      // -----------------------------------------------

      case 'geral':

        return {

          colunas: [
            'Indicador',
            'Quantidade'
          ],

          linhas: [

            ['Funcionários', 120],

            ['Treinamentos', 18],

            ['EPIs Entregues', 235],

            ['Riscos Ativos', 12]

          ]

        };


      // -----------------------------------------------
      // FUNCIONÁRIOS
      // -----------------------------------------------

      case 'funcionarios':

        return {

          colunas: [

            'Funcionários',
            'Quantidade'

          ],

          linhas: [

            ['Total de colaboradores', 120],

            ['Ativos', 116],

            ['Afastados', 4]

          ]

        };


      // -----------------------------------------------
      // TREINAMENTOS
      // -----------------------------------------------

      case 'treinamentos':

        return {

          colunas: [

            'Treinamento',
            'Quantidade'

          ],

          linhas: [

            ['Direção Defensiva', 45],

            ['Uso de EPIs', 32],

            ['Combate a Incêndio', 28],

            ['Primeiros Socorros', 25],

            ['NR-12', 18]

          ]

        };


      // -----------------------------------------------
      // EPIs
      // -----------------------------------------------

      case 'epis':

        return {

          colunas: [

            'EPI',
            'Percentual'

          ],

          linhas: [

            ['Botina', '28%'],

            ['Colete Refletivo', '22%'],

            ['Luvas', '20%'],

            ['Óculos', '16%'],

            ['Protetor Auricular', '14%']

          ]

        };


      // -----------------------------------------------
      // RISCOS
      // -----------------------------------------------

      case 'riscos':

        return {

          colunas: [

            'Nível',
            'Quantidade'

          ],

          linhas: [

            ['Alto', 4],

            ['Médio', 7],

            ['Baixo', 3]

          ]

        };


      // -----------------------------------------------
      // INSPEÇÕES
      // -----------------------------------------------

      case 'inspecoes':

        return {

          colunas: [

            'Situação',
            'Quantidade'

          ],

          linhas: [

            ['Realizadas', 32],

            ['Pendentes', 5],

            ['Não conformes', 3]

          ]

        };


      // -----------------------------------------------
      // CHECKLIST
      // -----------------------------------------------

      case 'checklist':

        return {

          colunas: [

            'Resultado',
            'Quantidade'

          ],

          linhas: [

            ['Conformes', 85],

            ['Não conformes', 10],

            ['Pendentes', 5]

          ]

        };


      default:

        return {

          colunas: [
            'Informação'
          ],

          linhas: [
            ['Nenhum dado disponível']
          ]

        };

    }

  }

}

