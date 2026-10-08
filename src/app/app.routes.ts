import { Routes } from '@angular/router';
import { Perfil } from './pages/perfil/perfil';
import { Layout } from './pages/layout/layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { UsuariosComponent} from './pages/usuarios/usuarios';
import { Treinamentos } from './pages/treinamentos/treinamentos';
import { Epis } from './pages/epis/epis';
import { Riscos } from './pages/riscos/riscos';
import { Relatorios } from './pages/relatorios/relatorios';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth.guard';
import { Topbar } from './pages/topbar/topbar';
import { Checklist } from './pages/checklist/checklist';
import { Footer } from './pages/footer/footer';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  {
    path: 'sistema',
    component: Layout,
    canActivate: [authGuard],
    children: [

      { path: '', component: Dashboard },

  {

  path: 'usuarios',
  component: UsuariosComponent,
  canActivate: [authGuard]
},
 {
      path: 'perfil',
      component: Perfil,
      canActivate: [authGuard]
    },

      { path: 'treinamentos', component: Treinamentos },
      { path: 'epis', component: Epis },
      { path: 'riscos', component: Riscos },
      { path: 'relatorios', component: Relatorios },
      { path: 'topbar', component: Topbar },
      {path: 'checklist', component: Checklist },
      {path: 'footer', component: Footer }
    ],
  },
];