// Типы для роутера
interface RouteComponentProps {
  path: string;
  name?: string;
  hiddenNavigationLink?: boolean;
}

interface RouteCtx<T = unknown> {
  query: T extends { Query: infer Q } ? Q : Record<string, string>;
  params: T extends { Params: infer P } ? P : Record<string, string>;
  router: Router;
}

// Базовый класс для компонентов роутов
abstract class RouteComponent<T = unknown> {
  props: RouteComponentProps;

  constructor(props: RouteComponentProps) {
    this.props = props;
  }

  abstract render(ctx: RouteCtx<T>): HTMLElement;

  unmount?(): void;
}

// Конструктор роута
type RouteConstructor<T = unknown> = new () => RouteComponent<T>;

interface RouterConfig {
  links: RouteConstructor[];
  navigationSelector: () => HTMLElement | null;
  renderNavigationLink: (route: RouteComponent) => HTMLElement;
  rootSelector?: () => HTMLElement | null;
}

// Утилита для конвертации паттерна роута в URLPattern синтаксис
function convertPathToURLPattern(path: string): string {
  // Конвертируем :param в :param синтаксис URLPattern
  return path.replace(/:([^/]+)/g, ':$1');
}

// Основной класс роутера
class Router {
  private routes: Map<string, RouteComponent> = new Map();
  private routesByName: Map<string, RouteComponent> = new Map();
  private urlPatterns: Map<URLPattern, RouteComponent> = new Map();
  private currentRoute: RouteComponent | null = null;
  private currentElement: HTMLElement | null = null;
  private config: RouterConfig;
  private navigation: Navigation;

  constructor(config: RouterConfig) {
    this.config = config;
    this.navigation = window.navigation!;
    this.init();
  }

  private init() {
    // Инициализация роутов
    this.config.links.forEach((RouteClass) => {
      const route = new RouteClass();
      this.routes.set(route.props.path, route);

      if (route.props.name) {
        this.routesByName.set(route.props.name, route);
      }

      // Создаем URLPattern для каждого роута
      const patternPath = convertPathToURLPattern(route.props.path);
      const pattern = new URLPattern({ pathname: patternPath });
      this.urlPatterns.set(pattern, route);
    });

    // Рендер навигации
    this.renderNavigation();

    // Подписка на события Navigation API с intercept
    this.navigation.addEventListener('navigate', (event: NavigateEvent) => {
      if (!event.canIntercept || event.hashChange || event.downloadRequest) {
        return;
      }

      // Используем intercept для перехвата навигации
      event.intercept({
        handler: async () => {
          await this.handleNavigation(event.destination.url);
        },
      });
    });

    // Первоначальный рендер текущего пути
    this.handleNavigation(window.location.href);
  }

  private renderNavigation() {
    const navContainer = this.config.navigationSelector();
    if (!navContainer) return;

    navContainer.innerHTML = '';

    this.routes.forEach((route) => {
      if (route.props.hiddenNavigationLink) return;

      // Пропускаем динамические роуты в навигации
      if (route.props.path.includes(':')) return;

      const linkElement = this.config.renderNavigationLink(route);
      const anchor = linkElement.querySelector('a');

      if (anchor) {
        anchor.textContent = route.props.name || route.props.path;

        // Prefetch при hover
        anchor.addEventListener('mouseenter', () => {
          this.prefetch(route.props.path);
        });
      }

      navContainer.appendChild(linkElement);
    });
  }

  private async handleNavigation(url: string) {
    const parsedUrl = new URL(url);

    const matchResult = this.findRoute(parsedUrl);
    if (!matchResult) {
      console.warn(`Route not found: ${parsedUrl.pathname}`);
      return;
    }

    const { route, params } = matchResult;

    // Размонтирование предыдущего роута
    if (this.currentRoute?.unmount) {
      this.currentRoute.unmount();
    }

    // Парсинг query параметров
    const query: Record<string, string> = {};
    parsedUrl.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    // Создание контекста
    const ctx: RouteCtx = {
      query,
      params,
      router: this,
    };

    // Рендер нового роута
    const element = route.render(ctx);
    const rootContainer = this.config.rootSelector?.() || document.body;

    if (this.currentElement) {
      rootContainer.removeChild(this.currentElement);
    }

    rootContainer.appendChild(element);

    this.currentRoute = route;
    this.currentElement = element;
  }

  private findRoute(url: URL): { route: RouteComponent; params: Record<string, string> } | undefined {
    // Используем URLPattern для поиска совпадений
    for (const [pattern, route] of this.urlPatterns.entries()) {
      const result = pattern.exec(url);

      if (result) {
        // Извлекаем параметры из pathname groups
        const params: Record<string, string> = {};

        if (result.pathname.groups) {
          Object.entries(result.pathname.groups).forEach(([key, value]) => {
            if (value) {
              params[key] = value;
            }
          });
        }

        return { route, params };
      }
    }

    return undefined;
  }

  private prefetch(path: string) {
    // Можно добавить логику предзагрузки данных
    console.log(`Prefetching: ${path}`);
  }

  // Публичные методы навигации
  push(path: string) {
    this.navigation.navigate(path);
  }

  replace(path: string) {
    this.navigation.navigate(path, { history: 'replace' });
  }

  back() {
    this.navigation.back();
  }

  forward() {
    this.navigation.forward();
  }

  // Типобезопасный доступ к роутам
  getUnsafe<T extends RouteConstructor>(filter: { name: string } | { path: string }): InstanceType<T> {
    let route: RouteComponent | undefined;

    if ('name' in filter) {
      route = this.routesByName.get(filter.name);
    } else {
      route = this.routes.get(filter.path);
    }

    if (!route) {
      throw new Error(`Route not found: ${JSON.stringify(filter)}`);
    }

    return route as InstanceType<T>;
  }
}

// Фабричная функция
function createRouter(config: RouterConfig): Router {
  return new Router(config);
}

// Пример использования
class HomeRoute extends RouteComponent<{ Query: { id: string } }> {
  private div: HTMLDivElement | null = null;

  constructor() {
    super({
      path: '/',
      name: 'HOME',
    });

    this.handleClick = this.handleClick.bind(this);
  }

  render(ctx: RouteCtx<{ Query: { id: string } }>) {
    const div = document.createElement('div');
    div.textContent = 'Hello!';
    div.addEventListener('click', this.handleClick);

    const button = document.createElement('button');
    button.textContent = 'Go to About';
    button.addEventListener('click', () => {
      ctx.router.push('/about');
    });

    div.appendChild(button);
    this.div = div;
    return div;
  }

  handleClick() {
    console.log('Home clicked');
  }

  unmount() {
    if (this.div) {
      this.div.removeEventListener('click', this.handleClick);
    }
  }
}

class AboutRoute extends RouteComponent {
  constructor() {
    super({
      path: '/about',
      name: 'ABOUT',
    });
  }

  render(ctx: RouteCtx) {
    const div = document.createElement('div');
    div.textContent = 'About page';

    const button = document.createElement('button');
    button.textContent = 'Go to Blog';
    button.addEventListener('click', () => {
      ctx.router.push('/blog/1');
    });

    div.appendChild(button);
    return div;
  }
}

class BlogRoute extends RouteComponent<{ Params: { id: string } }> {
  constructor() {
    super({
      path: '/blog/:id',
      name: 'BLOG',
      hiddenNavigationLink: true, // Скрываем динамические роуты из навигации
    });
  }

  render(ctx: RouteCtx<{ Params: { id: string } }>) {
    const blogId = ctx.params.id; // Используем params, а не query!
    const div = document.createElement('div');
    div.textContent = `Blog page: ${blogId}`;

    const button = document.createElement('button');
    button.textContent = 'Go to next Blog';
    button.addEventListener('click', () => {
      ctx.router.push(`/blog/${Number(blogId) + 1}`);
    });

    div.appendChild(button);
    return div;
  }
}

export const router = createRouter({
  links: [HomeRoute, AboutRoute, BlogRoute],
  rootSelector: () => document.querySelector('#app'),
  navigationSelector: () => document.querySelector('#navigation'),
  renderNavigationLink: (route): HTMLElement => {
    const div = document.createElement('div');
    const a = document.createElement('a');
    a.href = route.props.path;
    a.classList.add('link');
    div.append(a);
    return div;
  },
});
