import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface EntregaEpi {
  id: number;
  funcionario: string;
  epi: string;
  quantidade: number;
  dataEntrega: string;
  dataValidade: string;
  ca: string;
  observacoes: string;
  status: 'Válido' | 'Próximo do vencimento' | 'Vencido';
  remessas: AlocacaoRemessa[];
}

interface AlocacaoRemessa {
  remessaId: number;
  quantidade: number;
  dataValidade: string;
}

type AcaoHistorico = 'Entrega registrada' | 'Entrega alterada' | 'Entrega excluída';

interface RegistroHistoricoEpi {
  id: number;
  dataHora: string;
  funcionario: string;
  epi: string;
  acao: AcaoHistorico;
  detalhes: string;
}

type CategoriaEpi =
  | 'Cabeça'
  | 'Olhos e Face'
  | 'Ouvidos'
  | 'Respiratória'
  | 'Mãos'
  | 'Pés'
  | 'Corpo'
  | 'Outros';

interface OpcaoCatalogoEpi {
  nome: string;
  categoria: CategoriaEpi;
  ca: string;
}

type StatusCadastroEpi = 'Ativo' | 'Em revisão' | 'Vencido';

interface CadastroEpi {
  id: number;
  nome: string;
  categoria: CategoriaEpi | '';
  dataEntrada: string;
  quantidade: number;
  validade: string;
  ca: string;
}

type PrioridadeAcao = 'Baixa' | 'Média' | 'Alta' | 'Crítica';
type StatusAcao = 'Pendente' | 'Em andamento' | 'Concluída';

interface PlanoAcaoEpi {
  id: number;
  titulo: string;
  problema: string;
  responsavel: string;
  dataInicio: string;
  prazo: string;
  prioridade: PrioridadeAcao;
  status: StatusAcao;
  observacoes: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './epis.html',
  styleUrl: './epis.scss',
})
export class Epis implements OnInit {
  abaAtual = 'entrega';
  entregaVisualizada: EntregaEpi | null = null;
  entregaEditandoId: number | null = null;
  feedbackEntrega = '';
  acaoVisualizada: PlanoAcaoEpi | null = null;
  acaoEditandoId: number | null = null;
  formularioAcaoAberto = false;
  errosFormulario: Record<string, string> = {};
  epiEditandoId: number | null = null;
  epiParaExcluir: CadastroEpi | null = null;
  feedbackCadastro = '';
  tipoFeedbackCadastro: 'success' | 'error' = 'success';
  filtroStatusEpi: StatusCadastroEpi | '' = '';

  readonly catalogoEpis: OpcaoCatalogoEpi[] = [
    { nome: 'Capacete de Segurança', categoria: 'Cabeça', ca: 'CA 498' },
    { nome: 'Óculos de Proteção', categoria: 'Olhos e Face', ca: 'CA 16462' },
    { nome: 'Protetor Auricular', categoria: 'Ouvidos', ca: 'CA 5674' },
    { nome: 'Luva Mecânica', categoria: 'Mãos', ca: 'CA 30916' },
    { nome: 'Luva Anticorte', categoria: 'Mãos', ca: 'CA 44608' },
    { nome: 'Botina de Segurança', categoria: 'Pés', ca: 'CA 40142 / CA 21159' },
    { nome: 'Máscara PFF2', categoria: 'Respiratória', ca: 'CA 41514' },
    { nome: 'Macacão de Proteção', categoria: 'Corpo', ca: 'CA 34183' },
    { nome: 'Avental de Raspa', categoria: 'Corpo', ca: 'CA 18856' },
    { nome: 'Máscara para Solda', categoria: 'Olhos e Face', ca: 'CA 46614 / CA 34336' },
  ];

  private readonly chaveLocalStorageEpis = 'epis-cadastrados';
  private readonly chaveLocalStorageEntregas = 'epis-entregas';
  private readonly chaveLocalStorageHistorico = 'epis-historico-entregas';
  private readonly chaveLocalStorageEstado = 'epis-controle-estoque-v1';

  readonly funcionarios = [
    'João Silva',
    'Maria Costa',
    'Carlos Oliveira',
    'Ana Souza',
    'Marcos Pereira',
    'Fernanda Lima',
    'Ricardo Santos',
  ];

  entregaForm: EntregaEpi = this.criarEntregaVazia();

  cadastroForm: CadastroEpi = this.criarCadastroVazio();

  episCadastrados: CadastroEpi[] = [
    {
      id: 1,
      nome: 'Capacete de Segurança',
      categoria: 'Cabeça',
      dataEntrada: '2026-01-10',
      quantidade: 10,
      validade: '2027-01-10',
      ca: 'CA 498',
    },
    {
      id: 2,
      nome: 'Botina de Segurança',
      categoria: 'Pés',
      dataEntrada: '2026-01-10',
      quantidade: 20,
      validade: '2026-10-20',
      ca: 'CA 40142 / CA 21159',
    },
    {
      id: 3,
      nome: 'Óculos de Proteção',
      categoria: 'Olhos e Face',
      dataEntrada: '2026-01-10',
      quantidade: 15,
      validade: '2026-08-20',
      ca: 'CA 16462',
    },
  ];

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngOnInit() {
    this.carregarEpisSalvos();
  }

  get episFiltrados(): CadastroEpi[] {
    return this.remessasEpiSelecionado.filter((epi) => {
      const statusCorresponde =
        !this.filtroStatusEpi ||
        this.statusCadastroEpi(epi.validade) === this.filtroStatusEpi;
      return statusCorresponde;
    }).sort((a, b) => a.dataEntrada.localeCompare(b.dataEntrada) || a.id - b.id);
  }

  get totalQuantidadeEstoque(): number {
    return this.episCadastrados.reduce(
      (total, remessa) => total + remessa.quantidade,
      0,
    );
  }

  get totalEpisAtivos(): number {
    return this.episCadastrados.filter(
      (epi) => this.statusCadastroEpi(epi.validade) === 'Ativo',
    ).length;
  }

  get totalEpisEmRevisao(): number {
    return this.episCadastrados.filter(
      (epi) => this.statusCadastroEpi(epi.validade) === 'Em revisão',
    ).length;
  }

  get totalEpisCadastroVencidos(): number {
    return this.episCadastrados.filter(
      (epi) => this.statusCadastroEpi(epi.validade) === 'Vencido',
    ).length;
  }

  get remessasEpiSelecionado(): CadastroEpi[] {
    if (!this.cadastroForm.nome) {
      return [];
    }
    return this.episCadastrados
      .filter((remessa) => remessa.nome === this.cadastroForm.nome)
      .sort(
        (a, b) =>
          a.validade.localeCompare(b.validade) ||
          a.dataEntrada.localeCompare(b.dataEntrada) ||
          a.id - b.id,
      );
  }

  get estoqueTotalEpiSelecionado(): number {
    return this.remessasEpiSelecionado
      .filter((remessa) => this.statusCadastroEpi(remessa.validade) !== 'Vencido')
      .reduce((total, remessa) => total + remessa.quantidade, 0);
  }

  get unidadesVencidasEpiSelecionado(): number {
    return this.remessasEpiSelecionado
      .filter((remessa) => this.statusCadastroEpi(remessa.validade) === 'Vencido')
      .reduce((total, remessa) => total + remessa.quantidade, 0);
  }

  entregas: EntregaEpi[] = [];

  historicoEntregas: RegistroHistoricoEpi[] = [
    {
      id: 1,
      dataHora: '2026-10-07T19:30:00',
      funcionario: 'João Silva',
      epi: 'Capacete',
      acao: 'Entrega registrada',
      detalhes: 'Nova entrega cadastrada.',
    },
    {
      id: 2,
      dataHora: '2026-10-07T19:35:00',
      funcionario: 'Ana Souza',
      epi: 'Óculos de Proteção',
      acao: 'Entrega alterada',
      detalhes: 'Validade alterada: 20/03/2027 → 20/03/2028.',
    },
    {
      id: 3,
      dataHora: '2026-10-07T19:40:00',
      funcionario: 'Carlos Oliveira',
      epi: 'Luva de Segurança',
      acao: 'Entrega excluída',
      detalhes: 'Entrega removida.',
    },
  ];

  acaoForm: PlanoAcaoEpi = this.criarAcaoVazia();

  acoesPlano: PlanoAcaoEpi[] = [
    {
      id: 1,
      titulo: 'Revisar EPIs próximos do vencimento',
      problema: 'Itens com validade próxima precisam de substituição programada.',
      responsavel: 'Maria Costa',
      dataInicio: '2026-10-01',
      prazo: '2026-10-20',
      prioridade: 'Média',
      status: 'Em andamento',
      observacoes: 'Confirmar disponibilidade de estoque antes da troca.',
    },
    {
      id: 2,
      titulo: 'Substituir luvas vencidas',
      problema: 'Há luvas de segurança com validade vencida.',
      responsavel: 'Carlos Oliveira',
      dataInicio: '2026-10-05',
      prazo: '2026-10-15',
      prioridade: 'Crítica',
      status: 'Pendente',
      observacoes: 'Priorizar a equipe de manutenção.',
    },
  ];

  get totalValidades(): number {
    return this.entregas.length;
  }

  get totalEpisValidos(): number {
    return this.entregas.filter(
      (entrega) => this.calcularStatus(entrega.dataValidade) === 'Válido',
    ).length;
  }

  get totalEpisProximosVencimento(): number {
    return this.entregas.filter(
      (entrega) => this.calcularStatus(entrega.dataValidade) === 'Próximo do vencimento',
    ).length;
  }

  get totalEpisVencidos(): number {
    return this.entregas.filter(
      (entrega) => this.calcularStatus(entrega.dataValidade) === 'Vencido',
    ).length;
  }

  get totalAcoes(): number {
    return this.acoesPlano.length;
  }

  get totalAcoesPendentes(): number {
    return this.contarAcoesPorStatus('Pendente');
  }

  get totalAcoesEmAndamento(): number {
    return this.contarAcoesPorStatus('Em andamento');
  }

  get totalAcoesConcluidas(): number {
    return this.contarAcoesPorStatus('Concluída');
  }

  selecionarAba(aba: string) {
    this.abaAtual = aba;
    if (aba !== 'entrega') {
      this.entregaVisualizada = null;
    }
  }

  get opcoesEpiParaEntrega(): OpcaoCatalogoEpi[] {
    return this.catalogoEpis.filter((opcao) =>
      this.episCadastrados.some(
        (remessa) =>
          remessa.nome === opcao.nome &&
          remessa.quantidade > 0,
      ) || this.entregaForm.epi === opcao.nome,
    );
  }

  estoqueDisponivelParaEpi(nomeEpi: string): number {
    return this.remessasDisponiveis(nomeEpi).reduce(
      (total, remessa) => total + remessa.quantidade,
      0,
    );
  }

  get estoqueSelecionadoEntrega(): number | null {
    if (!this.entregaForm.epi) {
      return null;
    }
    return this.remessasDisponiveisParaEntrega(this.entregaForm.epi).reduce(
      (total, remessa) => total + remessa.quantidade,
      0,
    );
  }

  get remessasDisponiveisEntrega(): CadastroEpi[] {
    return this.remessasDisponiveisParaEntrega(this.entregaForm.epi);
  }

  get unidadesVencidasEpiEntrega(): number {
    if (!this.entregaForm.epi) {
      return 0;
    }
    return this.episCadastrados
      .filter(
        (remessa) =>
          remessa.nome === this.entregaForm.epi &&
          this.statusCadastroEpi(remessa.validade) === 'Vencido',
      )
      .reduce((total, remessa) => total + remessa.quantidade, 0);
  }

  descricaoAlocacoes(alocacoes: AlocacaoRemessa[]): string {
    return (
      alocacoes
        .map((alocacao) => {
          const remessa = this.episCadastrados.find(
            (item) => item.id === alocacao.remessaId,
          );
          return remessa
            ? `${this.formatarData(alocacao.dataValidade || remessa.validade)}: ${alocacao.quantidade}`
            : `Remessa ${alocacao.remessaId}: ${alocacao.quantidade}`;
        })
        .join('; ') || 'Sem remessas associadas'
    );
  }

  cancelarEntrega() {
    this.limparFormulario();
    this.errosFormulario = {};
    this.entregaEditandoId = null;
    this.feedbackEntrega = '';
  }

  limparFormulario() {
    this.entregaForm = this.criarEntregaVazia();
  }

  limparCadastro() {
    this.cadastroForm = this.criarCadastroVazio();
    this.epiEditandoId = null;
    this.feedbackCadastro = '';
  }

  salvarEpiCadastro() {
    this.feedbackCadastro = '';
    if (
      !this.cadastroForm.nome.trim() ||
      !Number.isInteger(this.cadastroForm.quantidade) ||
      this.cadastroForm.quantidade < (this.epiEditandoId === null ? 1 : 0) ||
      !this.cadastroForm.dataEntrada ||
      !this.cadastroForm.validade
    ) {
      this.definirFeedbackCadastro('Preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const definicaoCatalogo = this.catalogoEpis.find(
      (epi) => epi.nome === this.cadastroForm.nome,
    );
    if (!definicaoCatalogo) {
      this.definirFeedbackCadastro('Selecione um EPI da lista.', 'error');
      return;
    }

    const remessaDuplicada = this.episCadastrados.some(
      (epi) =>
        epi.id !== this.epiEditandoId &&
        epi.nome === definicaoCatalogo.nome &&
        epi.validade === this.cadastroForm.validade,
    );
    if (remessaDuplicada) {
      this.definirFeedbackCadastro(
        'Já existe uma remessa deste EPI com esta validade.',
        'error',
      );
      return;
    }

    const remessaAtual = this.episCadastrados.find(
      (remessa) => remessa.id === this.epiEditandoId,
    );
    if (
      remessaAtual &&
      remessaAtual.nome !== definicaoCatalogo.nome &&
      this.entregas.some((entrega) =>
        entrega.remessas.some((alocacao) => alocacao.remessaId === remessaAtual.id),
      )
    ) {
      this.definirFeedbackCadastro(
        'Não é possível alterar o EPI desta remessa porque ela está vinculada a entregas.',
        'error',
      );
      return;
    }

    const epiSalvo: CadastroEpi = {
      ...this.cadastroForm,
      categoria: definicaoCatalogo.categoria,
      nome: definicaoCatalogo.nome,
      quantidade: Number(this.cadastroForm.quantidade),
      ca: definicaoCatalogo.ca,
      id: this.epiEditandoId ?? this.proximoId(this.episCadastrados),
    };
    const estavaEditando = this.epiEditandoId !== null;

    this.episCadastrados = estavaEditando
      ? this.episCadastrados.map((epi) =>
          epi.id === this.epiEditandoId ? epiSalvo : epi,
        )
      : [...this.episCadastrados, epiSalvo];
    const persistenciaOk = this.persistirEpis();
    this.cadastroForm = {
      ...this.criarCadastroVazio(),
      nome: epiSalvo.nome,
      categoria: epiSalvo.categoria,
      ca: epiSalvo.ca,
      dataEntrada: this.dataHojeLocal(),
    };
    this.epiEditandoId = null;
    if (persistenciaOk) {
      this.definirFeedbackCadastro(
        estavaEditando
          ? 'Remessa atualizada com sucesso.'
          : 'Remessa cadastrada com sucesso.',
        'success',
      );
    }
  }

  editarEpiCadastro(epi: CadastroEpi) {
    this.cadastroForm = { ...epi };
    this.selecionarTipoEpi(epi.nome);
    this.epiEditandoId = epi.id;
    this.feedbackCadastro = '';
  }

  selecionarTipoEpi(nome: string) {
    this.cadastroForm.nome = nome;
    const opcao = this.catalogoEpis.find((epi) => epi.nome === nome);
    if (opcao) {
      this.cadastroForm.categoria = opcao.categoria;
      this.cadastroForm.ca = opcao.ca;
    } else if (!nome) {
      this.cadastroForm.categoria = '';
      this.cadastroForm.ca = '';
    }
  }

  selecionarEpiEntrega(nome: string) {
    this.entregaForm.epi = nome;
    const definicao = this.definicaoCatalogoEpi(nome);
    this.entregaForm.ca = definicao?.ca ?? '';
    this.entregaForm.dataValidade =
      this.remessasDisponiveisParaEntrega(nome)[0]?.validade ?? '';
  }

  definicaoCatalogoEpi(nome: string): OpcaoCatalogoEpi | undefined {
    return this.catalogoEpis.find((epi) => epi.nome === nome);
  }

  solicitarExclusaoEpi(epi: CadastroEpi) {
    this.epiParaExcluir = epi;
  }

  cancelarExclusaoEpi() {
    this.epiParaExcluir = null;
  }

  confirmarExclusaoEpi() {
    if (!this.epiParaExcluir) {
      return;
    }
    const id = this.epiParaExcluir.id;
    const epi = this.epiParaExcluir;
    if (
      this.entregas.some((entrega) =>
        entrega.remessas.some((alocacao) => alocacao.remessaId === id),
      )
    ) {
      this.epiParaExcluir = null;
      this.definirFeedbackCadastro(
        'Não é possível excluir esta remessa enquanto houver entregas vinculadas.',
        'error',
      );
      return;
    }
    this.episCadastrados = this.episCadastrados.filter((epi) => epi.id !== id);
    if (this.epiEditandoId === id) {
      this.cadastroForm = this.criarCadastroVazio();
      this.epiEditandoId = null;
    }
    this.epiParaExcluir = null;
    if (this.persistirEpis()) {
      this.definirFeedbackCadastro('EPI excluído com sucesso.', 'success');
    }
  }

  excluirEpiCadastro(id: number) {
    const epi = this.episCadastrados.find((item) => item.id === id);
    if (epi) {
      this.solicitarExclusaoEpi(epi);
    }
  }

  limparFiltrosEpi() {
    this.filtroStatusEpi = '';
  }

  statusCadastroEpi(dataValidade: string): StatusCadastroEpi {
    const dias = this.diasRestantes(dataValidade);
    if (dias === null || dias <= 30) {
      return dias !== null && dias < 0 ? 'Vencido' : 'Em revisão';
    }
    return 'Ativo';
  }

  private normalizarNomeEpi(nome: string): string {
    return nome.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
  }

  private remessasDisponiveis(nomeEpi: string): CadastroEpi[] {
    if (!nomeEpi) {
      return [];
    }
    return this.episCadastrados
      .filter(
        (remessa) =>
          remessa.nome === nomeEpi &&
          remessa.quantidade > 0 &&
          this.statusCadastroEpi(remessa.validade) !== 'Vencido',
      )
      .sort(
        (a, b) =>
          a.validade.localeCompare(b.validade) ||
          a.dataEntrada.localeCompare(b.dataEntrada) ||
          a.id - b.id,
      );
  }

  private remessasDisponiveisParaEntrega(nomeEpi: string): CadastroEpi[] {
    if (this.entregaEditandoId === null) {
      return this.remessasDisponiveis(nomeEpi);
    }
    const entregaOriginal = this.entregas.find(
      (entrega) => entrega.id === this.entregaEditandoId,
    );
    const estoqueRestaurado = entregaOriginal
      ? this.restaurarAlocacoes(
          this.episCadastrados,
          entregaOriginal.remessas,
          entregaOriginal.quantidade,
        )
      : null;
    return (estoqueRestaurado ?? this.episCadastrados)
      .filter(
        (remessa) =>
          remessa.nome === nomeEpi &&
          remessa.quantidade > 0 &&
          this.statusCadastroEpi(remessa.validade) !== 'Vencido',
      )
      .sort(
        (a, b) =>
          a.validade.localeCompare(b.validade) ||
          a.dataEntrada.localeCompare(b.dataEntrada) ||
          a.id - b.id,
      );
  }

  private calcularDistribuicaoRemessas(
    nomeEpi: string,
    quantidade: number,
    remessas: CadastroEpi[],
  ): { alocacoes: AlocacaoRemessa[]; remessasAtualizadas: CadastroEpi[] } | null {
    const candidatas = remessas
      .filter(
        (remessa) =>
          remessa.nome === nomeEpi &&
          remessa.quantidade > 0 &&
          this.statusCadastroEpi(remessa.validade) !== 'Vencido',
      )
      .sort(
        (a, b) =>
          a.validade.localeCompare(b.validade) ||
          a.dataEntrada.localeCompare(b.dataEntrada) ||
          a.id - b.id,
      );
    const disponivel = candidatas.reduce(
      (total, remessa) => total + remessa.quantidade,
      0,
    );
    if (disponivel < quantidade) {
      return null;
    }

    let restante = quantidade;
    const alocacoes: AlocacaoRemessa[] = [];
    const saldoPorId = new Map<number, number>();
    for (const remessa of candidatas) {
      if (restante === 0) {
        break;
      }
      const retirada = Math.min(restante, remessa.quantidade);
      saldoPorId.set(remessa.id, remessa.quantidade - retirada);
      alocacoes.push({
        remessaId: remessa.id,
        quantidade: retirada,
        dataValidade: remessa.validade,
      });
      restante -= retirada;
    }
    const remessasAtualizadas = remessas.map((remessa) => {
      const saldo = saldoPorId.get(remessa.id);
      return saldo === undefined ? remessa : { ...remessa, quantidade: saldo };
    });
    return { alocacoes, remessasAtualizadas };
  }

  private restaurarAlocacoes(
    remessas: CadastroEpi[],
    alocacoes: AlocacaoRemessa[],
    quantidadeEsperada: number,
  ): CadastroEpi[] | null {
    if (
      alocacoes.reduce((total, alocacao) => total + alocacao.quantidade, 0) !==
      quantidadeEsperada
    ) {
      return null;
    }
    const saldoPorId = new Map<number, number>();
    for (const alocacao of alocacoes) {
      const remessa = remessas.find((item) => item.id === alocacao.remessaId);
      if (!remessa || !Number.isInteger(alocacao.quantidade) || alocacao.quantidade < 1) {
        return null;
      }
      saldoPorId.set(
        remessa.id,
        (saldoPorId.get(remessa.id) ?? remessa.quantidade) + alocacao.quantidade,
      );
    }
    return remessas.map((remessa) => {
      const saldo = saldoPorId.get(remessa.id);
      return saldo === undefined ? remessa : { ...remessa, quantidade: saldo };
    });
  }

  private mensagemEstoqueInsuficiente(
    nomeEpi: string,
    remessas = this.episCadastrados,
  ): string {
    const disponivel = remessas
      .filter(
        (remessa) =>
          remessa.nome === nomeEpi &&
          remessa.quantidade > 0 &&
          this.statusCadastroEpi(remessa.validade) !== 'Vencido',
      )
      .reduce(
        (total, remessa) => total + remessa.quantidade,
        0,
      );
    return `Quantidade indisponível. Há apenas ${disponivel} unidades em estoque.`;
  }

  private definirFeedbackCadastro(
    mensagem: string,
    tipo: 'success' | 'error',
  ) {
    this.feedbackCadastro = mensagem;
    this.tipoFeedbackCadastro = tipo;
  }

  private carregarEpisSalvos() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let estadoSalvo: string | null;
    let dadosSalvos: string | null;
    try {
      estadoSalvo = localStorage.getItem(this.chaveLocalStorageEstado);
      dadosSalvos = localStorage.getItem(this.chaveLocalStorageEpis);
    } catch (error) {
      console.error('Não foi possível acessar o estado local de EPIs.', error);
      this.definirFeedbackCadastro(
        'Não foi possível acessar os dados salvos neste navegador.',
        'error',
      );
      return;
    }

    if (estadoSalvo !== null) {
      try {
        this.carregarEstadoUnificadoSalvo(JSON.parse(estadoSalvo) as unknown);
      } catch (error) {
        console.error('Não foi possível interpretar o estado local de EPIs.', error);
        this.feedbackEntrega =
          'Os dados locais de estoque, entregas ou histórico estão inválidos.';
      }
      return;
    }

    if (dadosSalvos === null) {
      // First run: keep the in-memory demonstration remittances.
    } else {
      try {
        const dados: unknown = JSON.parse(dadosSalvos);
        if (!Array.isArray(dados)) {
          throw new Error('O formato das remessas salvas é inválido.');
        }
        this.episCadastrados = dados
          .map((item, index) => this.normalizarEpiSalvo(item, index))
          .filter((epi): epi is CadastroEpi => epi !== null);
      } catch (error) {
        console.error('Não foi possível interpretar as remessas salvas.', error);
        this.definirFeedbackCadastro(
          'As remessas salvas estavam inválidas. Foram carregados os dados de exemplo.',
          'error',
        );
      }
    }

    if (this.carregarEntregasEHistorico()) {
      this.persistirEpis();
    }
  }

  private carregarEstadoUnificadoSalvo(valor: unknown) {
    if (typeof valor !== 'object' || valor === null) {
      throw new Error('O formato dos dados locais é inválido.');
    }
    const estado = valor as Record<string, unknown>;
    if (
      !Array.isArray(estado['remessas']) ||
      !Array.isArray(estado['entregas']) ||
      !Array.isArray(estado['historico'])
    ) {
      throw new Error('O estado local não contém remessas, entregas e histórico.');
    }
    const remessas = estado['remessas']
      .map((item, index) => this.normalizarEpiSalvo(item, index))
      .filter((item): item is CadastroEpi => item !== null);
    const entregas = estado['entregas'].map((item) =>
      this.normalizarEntregaSalva(item),
    );
    const historico = estado['historico'].map((item) =>
      this.normalizarRegistroHistoricoSalvo(item),
    );
    if (
      remessas.length !== estado['remessas'].length ||
      entregas.some((item) => item === null) ||
      historico.some((item) => item === null)
    ) {
      throw new Error('O estado local contém registros inválidos.');
    }
    this.episCadastrados = remessas;
    this.entregas = entregas.filter(
      (item): item is EntregaEpi => item !== null,
    );
    this.historicoEntregas = historico.filter(
      (item): item is RegistroHistoricoEpi => item !== null,
    );
  }

  private normalizarEpiSalvo(valor: unknown, indice: number): CadastroEpi | null {
    if (typeof valor !== 'object' || valor === null) {
      return null;
    }
    const item = valor as Record<string, unknown>;
    const nomeSalvo = typeof item['nome'] === 'string' ? item['nome'].trim() : '';
    const nome = this.nomeCatalogoNormalizado(nomeSalvo);
    const validade =
      typeof item['validade'] === 'string' ? item['validade'] : '';
    if (!nome || !validade) {
      return null;
    }

    const opcaoCatalogo = this.catalogoEpis.find((epi) => epi.nome === nome);
    if (!opcaoCatalogo) {
      return null;
    }
    const categoria = opcaoCatalogo.categoria;
    const quantidadeSalva = item['quantidade'];
    const quantidade =
      typeof quantidadeSalva === 'number' &&
      Number.isInteger(quantidadeSalva) &&
      quantidadeSalva >= 0
        ? quantidadeSalva
        : 1;
    const idSalvo = item['id'];

    return {
      id:
        typeof idSalvo === 'number' && Number.isInteger(idSalvo) && idSalvo > 0
          ? idSalvo
          : indice + 1,
      nome,
      categoria,
      dataEntrada:
        typeof item['dataEntrada'] === 'string' ? item['dataEntrada'] : '',
      quantidade,
      validade,
      ca: opcaoCatalogo.ca,
    };
  }

  private nomeCatalogoNormalizado(nome: string): string {
    const nomeNormalizado = this.normalizarNomeEpi(nome);
    const opcao = this.catalogoEpis.find(
      (epi) => this.normalizarNomeEpi(epi.nome) === nomeNormalizado,
    );
    if (opcao) {
      return opcao.nome;
    }

    const nomesLegados: Record<string, string> = {
      capacete: 'Capacete de Segurança',
      'luva de segurança': 'Luva Mecânica',
      'máscara respiratória': 'Máscara PFF2',
    };
    return nomesLegados[nomeNormalizado] ?? nome.trim();
  }

  private persistirEpis(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }
    try {
      localStorage.setItem(
        this.chaveLocalStorageEstado,
        JSON.stringify({
          remessas: this.episCadastrados,
          entregas: this.entregas,
          historico: this.historicoEntregas,
        }),
      );
      return true;
    } catch (error) {
      console.error('Não foi possível salvar os EPIs no navegador.', error);
      this.definirFeedbackCadastro(
        'A alteração foi aplicada nesta sessão, mas não pôde ser salva no navegador.',
        'error',
      );
      return false;
    }
  }

  private carregarEntregasEHistorico(): boolean {
    try {
      const entregasSalvas = localStorage.getItem(this.chaveLocalStorageEntregas);
      const historicoSalvo = localStorage.getItem(this.chaveLocalStorageHistorico);
      if (entregasSalvas !== null) {
        const dados: unknown = JSON.parse(entregasSalvas);
        if (!Array.isArray(dados)) {
          throw new Error('O formato das entregas salvas é inválido.');
        }
        const entregasNormalizadas = dados.map((item) =>
          this.normalizarEntregaSalva(item),
        );
        if (entregasNormalizadas.some((item) => item === null)) {
          throw new Error('Há entregas salvas com dados ou lotes de origem inválidos.');
        }
        this.entregas = entregasNormalizadas.filter(
          (item): item is EntregaEpi => item !== null,
        );
      }

      if (historicoSalvo !== null) {
        const dados: unknown = JSON.parse(historicoSalvo);
        if (!Array.isArray(dados)) {
          throw new Error('O formato do histórico salvo é inválido.');
        }
        const historicoNormalizado = dados.map((item) =>
          this.normalizarRegistroHistoricoSalvo(item),
        );
        if (historicoNormalizado.some((item) => item === null)) {
          throw new Error('Há registros inválidos no histórico salvo.');
        }
        this.historicoEntregas = historicoNormalizado.filter(
          (item): item is RegistroHistoricoEpi => item !== null,
        );
      }
      return true;
    } catch (error) {
      console.error('Não foi possível carregar entregas e histórico salvos.', error);
      this.feedbackEntrega =
        'Não foi possível carregar os dados locais de entregas e histórico.';
      return false;
    }
  }

  private normalizarEntregaSalva(valor: unknown): EntregaEpi | null {
    if (typeof valor !== 'object' || valor === null) {
      return null;
    }
    const item = valor as Record<string, unknown>;
    if (
      typeof item['id'] !== 'number' ||
      typeof item['funcionario'] !== 'string' ||
      typeof item['epi'] !== 'string' ||
      typeof item['quantidade'] !== 'number' ||
      !Number.isInteger(item['quantidade']) ||
      item['quantidade'] < 1 ||
      typeof item['dataEntrega'] !== 'string' ||
      typeof item['dataValidade'] !== 'string' ||
      !Array.isArray(item['remessas'])
    ) {
      return null;
    }
    const status =
      typeof item['dataValidade'] === 'string'
        ? this.calcularStatus(item['dataValidade'])
        : 'Válido';
    const remessas = Array.isArray(item['remessas'])
      ? item['remessas']
          .map((alocacao) => this.normalizarAlocacaoSalva(alocacao))
          .filter((alocacao): alocacao is AlocacaoRemessa => alocacao !== null)
      : [];
    if (
      remessas.length !== item['remessas'].length ||
      remessas.reduce((total, alocacao) => total + alocacao.quantidade, 0) !==
        item['quantidade']
    ) {
      return null;
    }
    return {
      id: item['id'],
      funcionario: item['funcionario'],
      epi: this.nomeCatalogoNormalizado(item['epi']),
      quantidade: item['quantidade'],
      dataEntrega: item['dataEntrega'],
      dataValidade: item['dataValidade'],
      ca:
        this.definicaoCatalogoEpi(this.nomeCatalogoNormalizado(item['epi']))?.ca ??
        '',
      observacoes:
        typeof item['observacoes'] === 'string' ? item['observacoes'] : '',
      status,
      remessas,
    };
  }

  private normalizarRegistroHistoricoSalvo(
    valor: unknown,
  ): RegistroHistoricoEpi | null {
    if (typeof valor !== 'object' || valor === null) {
      return null;
    }
    const item = valor as Record<string, unknown>;
    const acoes: AcaoHistorico[] = [
      'Entrega registrada',
      'Entrega alterada',
      'Entrega excluída',
    ];
    if (
      typeof item['id'] !== 'number' ||
      typeof item['dataHora'] !== 'string' ||
      typeof item['funcionario'] !== 'string' ||
      typeof item['epi'] !== 'string' ||
      typeof item['acao'] !== 'string' ||
      !acoes.includes(item['acao'] as AcaoHistorico) ||
      typeof item['detalhes'] !== 'string'
    ) {
      return null;
    }
    return {
      id: item['id'],
      dataHora: item['dataHora'],
      funcionario: item['funcionario'],
      epi: this.nomeCatalogoNormalizado(item['epi']),
      acao: item['acao'] as AcaoHistorico,
      detalhes: item['detalhes'],
    };
  }

  private normalizarAlocacaoSalva(valor: unknown): AlocacaoRemessa | null {
    if (typeof valor !== 'object' || valor === null) {
      return null;
    }
    const item = valor as Record<string, unknown>;
    if (
      typeof item['remessaId'] !== 'number' ||
      !Number.isInteger(item['remessaId']) ||
      typeof item['quantidade'] !== 'number' ||
      !Number.isInteger(item['quantidade']) ||
      item['quantidade'] < 1
    ) {
      return null;
    }
    return {
      remessaId: item['remessaId'],
      quantidade: item['quantidade'],
      dataValidade:
        typeof item['dataValidade'] === 'string' ? item['dataValidade'] : '',
    };
  }

  diasRestantes(dataValidade: string): number | null {
    const validade = this.criarDataLocal(dataValidade);
    if (!validade) {
      return null;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  }

  statusValidade(dataValidade: string): EntregaEpi['status'] {
    const dias = this.diasRestantes(dataValidade);
    if (dias === null) {
      return 'Válido';
    }
    if (dias < 0) {
      return 'Vencido';
    }
    if (dias <= 30) {
      return 'Próximo do vencimento';
    }
    return 'Válido';
  }

  textoDiasRestantes(dataValidade: string): string {
    const dias = this.diasRestantes(dataValidade);
    if (dias === null) {
      return '—';
    }
    return dias < 0 ? 'Vencido' : `${dias} dias`;
  }

  abrirEntregaNaValidade(entrega: EntregaEpi) {
    this.visualizarEntrega(entrega);
  }

  abrirNovaAcaoParaValidades() {
    this.acaoEditandoId = null;
    this.acaoForm = this.criarAcaoVazia();
    this.acaoForm.titulo = this.totalEpisVencidos > 0
      ? 'Regularizar EPIs vencidos'
      : 'Programar substituição de EPIs';
    this.acaoForm.problema = this.totalEpisVencidos > 0
      ? 'Existem EPIs vencidos no controle de validade.'
      : 'Existem EPIs próximos do vencimento.';
    this.formularioAcaoAberto = true;
    this.abaAtual = 'acao';
  }

  abrirFormularioAcao() {
    this.acaoEditandoId = null;
    this.acaoForm = this.criarAcaoVazia();
    this.formularioAcaoAberto = true;
  }

  cancelarFormularioAcao() {
    this.formularioAcaoAberto = false;
    this.acaoEditandoId = null;
    this.acaoForm = this.criarAcaoVazia();
    this.errosFormulario = {};
  }

  salvarAcao() {
    this.errosFormulario = {};
    if (!this.acaoForm.titulo.trim()) {
      this.errosFormulario['tituloAcao'] = 'Informe o título da ação.';
    }
    if (!this.acaoForm.problema.trim()) {
      this.errosFormulario['problemaAcao'] = 'Descreva o problema identificado.';
    }
    if (!this.acaoForm.responsavel.trim()) {
      this.errosFormulario['responsavelAcao'] = 'Informe o responsável.';
    }
    if (!this.acaoForm.dataInicio) {
      this.errosFormulario['dataInicioAcao'] = 'Informe a data de início.';
    }
    if (!this.acaoForm.prazo) {
      this.errosFormulario['prazoAcao'] = 'Informe o prazo.';
    }
    if (Object.keys(this.errosFormulario).length > 0) {
      return;
    }

    if (this.acaoEditandoId === null) {
      this.acoesPlano = [
        { ...this.acaoForm, id: this.proximoId(this.acoesPlano) },
        ...this.acoesPlano,
      ];
    } else {
      this.acoesPlano = this.acoesPlano.map((acao) =>
        acao.id === this.acaoEditandoId
          ? { ...this.acaoForm, id: acao.id }
          : acao,
      );
    }
    this.cancelarFormularioAcao();
  }

  visualizarAcao(acao: PlanoAcaoEpi) {
    this.acaoVisualizada = acao;
  }

  fecharVisualizacaoAcao() {
    this.acaoVisualizada = null;
  }

  editarAcao(acao: PlanoAcaoEpi) {
    this.acaoEditandoId = acao.id;
    this.acaoForm = { ...acao };
    this.errosFormulario = {};
    this.formularioAcaoAberto = true;
  }

  excluirAcao(id: number) {
    this.acoesPlano = this.acoesPlano.filter((acao) => acao.id !== id);
    if (this.acaoVisualizada?.id === id) {
      this.acaoVisualizada = null;
    }
    if (this.acaoEditandoId === id) {
      this.cancelarFormularioAcao();
    }
  }

  private contarAcoesPorStatus(status: StatusAcao): number {
    return this.acoesPlano.filter((acao) => acao.status === status).length;
  }

  private criarDataLocal(valor: string): Date | null {
    if (!valor) {
      return null;
    }
    const [ano, mes, dia] = valor.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  registrarEntrega() {
    this.feedbackEntrega = '';
    this.errosFormulario = {};

    if (!this.entregaForm.funcionario.trim()) {
      this.errosFormulario['funcionario'] = 'Selecione o funcionário.';
    }

    if (!this.entregaForm.epi.trim()) {
      this.errosFormulario['epi'] = 'Selecione o EPI.';
    }

    if (
      !Number.isInteger(this.entregaForm.quantidade) ||
      this.entregaForm.quantidade < 1
    ) {
      this.errosFormulario['quantidade'] = 'Informe a quantidade válida.';
    }

    if (!this.entregaForm.dataEntrega) {
      this.errosFormulario['dataEntrega'] = 'Informe a data da entrega.';
    }

    if (Object.keys(this.errosFormulario).length > 0) {
      return;
    }

    if (this.entregaEditandoId !== null) {
      this.alterarEntrega();
      return;
    }

    const novaEntrega: EntregaEpi = {
      ...this.entregaForm,
      id: this.proximoId(this.entregas),
      status: this.calcularStatus(this.entregaForm.dataValidade),
      remessas: [],
    };

    const distribuicao = this.calcularDistribuicaoRemessas(
      novaEntrega.epi,
      novaEntrega.quantidade,
      this.episCadastrados,
    );
    if (!distribuicao) {
      this.errosFormulario['estoque'] = this.mensagemEstoqueInsuficiente(
        novaEntrega.epi,
      );
      return;
    }
    novaEntrega.remessas = distribuicao.alocacoes;
    novaEntrega.dataValidade =
      this.episCadastrados.find(
        (remessa) => remessa.id === distribuicao.alocacoes[0].remessaId,
      )?.validade ?? '';
    novaEntrega.status = this.calcularStatus(novaEntrega.dataValidade);
    const definicao = this.definicaoCatalogoEpi(novaEntrega.epi);
    novaEntrega.ca = definicao?.ca ?? '';
    this.episCadastrados = distribuicao.remessasAtualizadas;
    this.entregas = [novaEntrega, ...this.entregas];
    this.adicionarRegistroHistorico(
      novaEntrega,
      'Entrega registrada',
      `Nova entrega cadastrada. Lotes retirados: ${this.descricaoAlocacoes(novaEntrega.remessas)}.`,
    );
    const estoquePersistido = this.persistirEpis();
    this.limparFormulario();
    if (!estoquePersistido) {
      this.feedbackEntrega =
        'A entrega foi registrada nesta sessão, mas os dados não puderam ser salvos no navegador.';
    }
  }

  visualizarEntrega(entrega: EntregaEpi) {
    this.entregaVisualizada = entrega;
  }

  fecharVisualizacao() {
    this.entregaVisualizada = null;
  }

  excluirEntrega(id: number) {
    const entrega = this.entregas.find((item) => item.id === id);
    if (!entrega) {
      return;
    }

    const remessasRestauradas = this.restaurarAlocacoes(
      this.episCadastrados,
      entrega.remessas,
      entrega.quantidade,
    );
    if (!remessasRestauradas) {
      this.feedbackEntrega =
        'Não foi possível excluir: não foi possível localizar os lotes de origem desta entrega.';
      return;
    }
    this.episCadastrados = remessasRestauradas;
    this.adicionarRegistroHistorico(
      entrega,
      'Entrega excluída',
      `Entrega removida. Quantidades devolvidas aos lotes: ${this.descricaoAlocacoes(entrega.remessas)}.`,
    );
    this.entregas = this.entregas.filter((item) => item.id !== id);
    const estoquePersistido = this.persistirEpis();
    this.feedbackEntrega = estoquePersistido
      ? ''
      : 'A entrega foi excluída nesta sessão, mas os dados atualizados não puderam ser salvos no navegador.';

    if (this.entregaEditandoId === id) {
      this.cancelarEntrega();
    }

    if (this.entregaVisualizada?.id === id) {
      this.entregaVisualizada = null;
    }
  }

  editarEntrega(entrega: EntregaEpi) {
    this.entregaEditandoId = entrega.id;
    this.entregaForm = { ...entrega };
    this.errosFormulario = {};
    this.entregaVisualizada = null;
  }

  private alterarEntrega() {
    const indice = this.entregas.findIndex(
      (entrega) => entrega.id === this.entregaEditandoId,
    );
    if (indice === -1) {
      this.cancelarEntrega();
      return;
    }

    const entregaAntiga = this.entregas[indice];
    const entregaAtualizada: EntregaEpi = {
      ...this.entregaForm,
      id: entregaAntiga.id,
      status: this.calcularStatus(this.entregaForm.dataValidade),
    };

    const estoqueRestaurado = this.restaurarAlocacoes(
      this.episCadastrados,
      entregaAntiga.remessas,
      entregaAntiga.quantidade,
    );
    if (!estoqueRestaurado) {
      this.errosFormulario['estoque'] =
        'Não foi possível localizar os lotes de origem desta entrega.';
      return;
    }
    const distribuicao = this.calcularDistribuicaoRemessas(
      entregaAtualizada.epi,
      entregaAtualizada.quantidade,
      estoqueRestaurado,
    );
    if (!distribuicao) {
      this.errosFormulario['estoque'] = this.mensagemEstoqueInsuficiente(
        entregaAtualizada.epi,
        estoqueRestaurado,
      );
      return;
    }
    entregaAtualizada.remessas = distribuicao.alocacoes;
    entregaAtualizada.dataValidade =
      estoqueRestaurado.find(
        (remessa) => remessa.id === distribuicao.alocacoes[0].remessaId,
      )?.validade ?? '';
    entregaAtualizada.status = this.calcularStatus(entregaAtualizada.dataValidade);
    const definicao = this.definicaoCatalogoEpi(entregaAtualizada.epi);
    entregaAtualizada.ca = definicao?.ca ?? '';
    const detalhesAlteracoes = this.detalhesAlteracoes(entregaAntiga, entregaAtualizada);
    const alocacoesAlteradas =
      this.descricaoAlocacoes(entregaAntiga.remessas) !==
      this.descricaoAlocacoes(entregaAtualizada.remessas);
    const detalhes = [
      detalhesAlteracoes,
      alocacoesAlteradas
        ? `Remessas ajustadas: ${this.descricaoAlocacoes(entregaAntiga.remessas)} → ${this.descricaoAlocacoes(entregaAtualizada.remessas)}`
        : '',
    ]
      .filter(Boolean)
      .join('; ');
    this.episCadastrados = distribuicao.remessasAtualizadas;
    this.entregas = this.entregas.map((entrega, posicao) =>
      posicao === indice ? entregaAtualizada : entrega,
    );
    this.adicionarRegistroHistorico(
      entregaAtualizada,
      'Entrega alterada',
      detalhes || 'Nenhuma informação foi alterada.',
    );
    const estoquePersistido = this.persistirEpis();
    this.cancelarEntrega();
    if (!estoquePersistido) {
      this.feedbackEntrega =
        'A entrega foi alterada nesta sessão, mas os dados não puderam ser salvos no navegador.';
    }
  }

  private detalhesAlteracoes(antiga: EntregaEpi, atualizada: EntregaEpi): string {
    const campos: Array<{
      chave: keyof EntregaEpi;
      descricao: string;
      data?: boolean;
    }> = [
      { chave: 'funcionario', descricao: 'Funcionário alterado' },
      { chave: 'epi', descricao: 'EPI alterado' },
      { chave: 'quantidade', descricao: 'Quantidade alterada' },
      { chave: 'dataEntrega', descricao: 'Data da entrega alterada', data: true },
      { chave: 'dataValidade', descricao: 'Validade alterada', data: true },
      { chave: 'ca', descricao: 'CA alterado' },
      { chave: 'observacoes', descricao: 'Observações alteradas' },
    ];

    return campos
      .filter(({ chave }) => antiga[chave] !== atualizada[chave])
      .map(({ chave, descricao, data }) => {
        const valorAntigo = antiga[chave];
        const valorNovo = atualizada[chave];
        const anterior = data
          ? this.formatarData(String(valorAntigo))
          : String(valorAntigo || '—');
        const novo = data
          ? this.formatarData(String(valorNovo))
          : String(valorNovo || '—');

        return `${descricao}: ${anterior} → ${novo}`;
      })
      .join('; ');
  }

  private adicionarRegistroHistorico(
    entrega: EntregaEpi,
    acao: AcaoHistorico,
    detalhes: string,
  ) {
    this.historicoEntregas = [
      {
        id: this.proximoId(this.historicoEntregas),
        dataHora: new Date().toISOString(),
        funcionario: entrega.funcionario,
        epi: entrega.epi,
        acao,
        detalhes,
      },
      ...this.historicoEntregas,
    ];
  }

  private proximoId<T extends { id: number }>(items: T[]): number {
    return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
  }

  formatarData(data: string) {
    if (!data) {
      return '—';
    }

    const [ano, mes, dia] = data.split('-').map(Number);
    const date = new Date(ano, mes - 1, dia);

    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  formatarHora(dataHora: string) {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dataHora));
  }

  formatarDataHoraData(dataHora: string) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dataHora));
  }

  calcularStatus(dataValidade: string): EntregaEpi['status'] {
    return this.statusValidade(dataValidade);
  }

  private criarEntregaVazia(): EntregaEpi {
    return {
      id: 0,
      funcionario: '',
      epi: '',
      quantidade: 1,
      dataEntrega: '',
      dataValidade: '',
      ca: '',
      observacoes: '',
      status: 'Válido',
      remessas: [],
    };
  }

  private criarCadastroVazio(): CadastroEpi {
    return {
      id: 0,
      nome: '',
      categoria: '',
      dataEntrada: this.dataHojeLocal(),
      quantidade: 1,
      validade: '',
      ca: '',
    };
  }

  private dataHojeLocal(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private criarAcaoVazia(): PlanoAcaoEpi {
    return {
      id: 0,
      titulo: '',
      problema: '',
      responsavel: '',
      dataInicio: '',
      prazo: '',
      prioridade: 'Média',
      status: 'Pendente',
      observacoes: '',
    };
  }
}
