import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Epis } from './epis';

describe('Epis', () => {
  let component: Epis;
  let fixture: ComponentFixture<Epis>;

  beforeEach(async () => {
    localStorage.removeItem('epis-cadastrados');
    localStorage.removeItem('epis-entregas');
    localStorage.removeItem('epis-historico-entregas');
    localStorage.removeItem('epis-controle-estoque-v1');
    await TestBed.configureTestingModule({
      imports: [Epis],
    }).compileComponents();

    fixture = TestBed.createComponent(Epis);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('decreases and persists stock when registering a delivery', () => {
    component.entregaForm = {
      id: 0,
      funcionario: 'João Silva',
      epi: 'Capacete de Segurança',
      quantidade: 3,
      dataEntrega: '2026-10-08',
      dataValidade: '2027-10-08',
      ca: 'CA 498',
      observacoes: '',
      status: 'Válido',
      remessas: [],
    };

    component.registrarEntrega();

    expect(
      component.episCadastrados.find((epi) => epi.nome === 'Capacete de Segurança')
        ?.quantidade,
    ).toBe(7);
    const estadoSalvo = JSON.parse(
      localStorage.getItem('epis-controle-estoque-v1') ?? '{}',
    ) as { remessas: Array<{ quantidade: number }> };
    expect(estadoSalvo.remessas[0].quantidade).toBe(7);
  });

  it('blocks a delivery larger than the available stock', () => {
    component.entregaForm = {
      id: 0,
      funcionario: 'João Silva',
      epi: 'Capacete de Segurança',
      quantidade: 11,
      dataEntrega: '2026-10-08',
      dataValidade: '2027-10-08',
      ca: 'CA 498',
      observacoes: '',
      status: 'Válido',
      remessas: [],
    };

    component.registrarEntrega();

    expect(
      component.episCadastrados.find((epi) => epi.nome === 'Capacete de Segurança')
        ?.quantidade,
    ).toBe(10);
    expect(component.errosFormulario['estoque']).toBe(
      'Quantidade indisponível. Há apenas 10 unidades em estoque.',
    );
  });

  it('restores stock when a delivery is deleted', () => {
    component.entregaForm = {
      id: 0,
      funcionario: 'João Silva',
      epi: 'Capacete de Segurança',
      quantidade: 3,
      dataEntrega: '2026-10-08',
      dataValidade: '2027-10-08',
      ca: 'CA 498',
      observacoes: '',
      status: 'Válido',
      remessas: [],
    };
    component.registrarEntrega();
    const novaEntrega = component.entregas[0];

    component.excluirEntrega(novaEntrega.id);

    expect(
      component.episCadastrados.find((epi) => epi.nome === 'Capacete de Segurança')
        ?.quantidade,
    ).toBe(10);
    expect(component.entregas.some((entrega) => entrega.id === novaEntrega.id))
      .toBe(false);
  });

  it('adjusts stock when the quantity of an existing delivery changes', () => {
    component.entregaForm = {
      id: 0,
      funcionario: 'João Silva',
      epi: 'Capacete de Segurança',
      quantidade: 2,
      dataEntrega: '2026-10-08',
      dataValidade: '2027-10-08',
      ca: 'CA 498',
      observacoes: '',
      status: 'Válido',
      remessas: [],
    };
    component.registrarEntrega();
    const novaEntrega = component.entregas[0];
    component.editarEntrega(novaEntrega);
    component.entregaForm.quantidade = 5;

    component.registrarEntrega();

    expect(
      component.episCadastrados.find((epi) => epi.nome === 'Capacete de Segurança')
        ?.quantidade,
    ).toBe(5);
  });

  it('allows another batch of the same EPI when the expiry is different', () => {
    component.cadastroForm = {
      id: 0,
      nome: 'Capacete de Segurança',
      categoria: 'Cabeça',
      dataEntrada: '2026-10-08',
      quantidade: 45,
      validade: '2028-02-10',
      ca: 'CA 498',
    };

    component.salvarEpiCadastro();

    expect(
      component.remessasEpiSelecionado.map((remessa) => remessa.validade),
    ).toContain('2028-02-10');
    expect(component.feedbackCadastro).toBe('Remessa cadastrada com sucesso.');
  });

  it('rejects a second batch with the same EPI and expiry', () => {
    component.cadastroForm = {
      id: 0,
      nome: 'Capacete de Segurança',
      categoria: 'Cabeça',
      dataEntrada: '2026-10-08',
      quantidade: 45,
      validade: '2027-01-10',
      ca: 'CA 498',
    };

    component.salvarEpiCadastro();

    expect(component.feedbackCadastro).toBe(
      'Já existe uma remessa deste EPI com esta validade.',
    );
    expect(component.episCadastrados).toHaveLength(3);
  });

  it('allocates deliveries by earliest expiry across batches', () => {
    component.cadastroForm = {
      id: 0,
      nome: 'Capacete de Segurança',
      categoria: 'Cabeça',
      dataEntrada: '2026-10-08',
      quantidade: 30,
      validade: '2028-02-10',
      ca: 'CA 498',
    };
    component.salvarEpiCadastro();
    component.entregaForm = {
      id: 0,
      funcionario: 'João Silva',
      epi: 'Capacete de Segurança',
      quantidade: 20,
      dataEntrega: '2026-10-08',
      dataValidade: '2027-01-10',
      ca: 'CA 498',
      observacoes: '',
      status: 'Válido',
      remessas: [],
    };

    component.registrarEntrega();

    expect(component.episCadastrados.find((remessa) => remessa.id === 1)?.quantidade)
      .toBe(0);
    expect(component.episCadastrados.find((remessa) => remessa.id === 4)?.quantidade)
      .toBe(20);
    expect(component.entregas[0].remessas).toEqual([
      { remessaId: 1, quantidade: 10, dataValidade: '2027-01-10' },
      { remessaId: 4, quantidade: 10, dataValidade: '2028-02-10' },
    ]);
  });

  it('excludes expired batches from availability and blocks their use', () => {
    component.cadastroForm = {
      id: 0,
      nome: 'Capacete de Segurança',
      categoria: 'Cabeça',
      dataEntrada: '2019-01-01',
      quantidade: 8,
      validade: '2020-01-01',
      ca: 'CA 498',
    };
    component.salvarEpiCadastro();
    component.entregaForm = {
      id: 0,
      funcionario: 'João Silva',
      epi: 'Capacete de Segurança',
      quantidade: 11,
      dataEntrega: '2026-10-08',
      dataValidade: '',
      ca: 'CA 498',
      observacoes: '',
      status: 'Válido',
      remessas: [],
    };

    component.registrarEntrega();

    expect(component.estoqueDisponivelParaEpi('Capacete de Segurança')).toBe(10);
    expect(component.errosFormulario['estoque']).toBe(
      'Quantidade indisponível. Há apenas 10 unidades em estoque.',
    );
  });

  it('persists delivery source allocations and returns each source batch on deletion', () => {
    component.cadastroForm = {
      id: 0,
      nome: 'Capacete de Segurança',
      categoria: 'Cabeça',
      dataEntrada: '2026-10-08',
      quantidade: 30,
      validade: '2028-02-10',
      ca: 'CA 498',
    };
    component.salvarEpiCadastro();
    component.entregaForm = {
      id: 0,
      funcionario: 'João Silva',
      epi: 'Capacete de Segurança',
      quantidade: 20,
      dataEntrega: '2026-10-08',
      dataValidade: '2027-01-10',
      ca: 'CA 498',
      observacoes: '',
      status: 'Válido',
      remessas: [],
    };
    component.registrarEntrega();
    const delivery = component.entregas[0];
    const savedState = JSON.parse(
      localStorage.getItem('epis-controle-estoque-v1') ?? '{}',
    ) as {
      entregas: Array<{
        remessas: Array<{ remessaId: number; quantidade: number }>;
      }>;
    };

    expect(savedState.entregas[0].remessas).toEqual(delivery.remessas);
    const reloadedFixture = TestBed.createComponent(Epis);
    reloadedFixture.detectChanges();
    expect(reloadedFixture.componentInstance.entregas[0].remessas).toEqual(
      delivery.remessas,
    );
    expect(
      reloadedFixture.componentInstance.episCadastrados.find(
        (remessa) => remessa.id === 1,
      )?.quantidade,
    ).toBe(0);

    component.excluirEntrega(delivery.id);

    expect(component.episCadastrados.find((remessa) => remessa.id === 1)?.quantidade)
      .toBe(10);
    expect(component.episCadastrados.find((remessa) => remessa.id === 4)?.quantidade)
      .toBe(30);
  });
});
